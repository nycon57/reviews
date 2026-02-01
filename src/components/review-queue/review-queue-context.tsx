"use client";

import {
  createContext,
  useContext,
  useState,
  useReducer,
  useTransition,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Review, AggregatedReview, AggregatedReviewFilters, ReviewAggregationStats } from "@/lib/reviews/types";
import {
  approveReview,
  rejectReview,
  updateReviewText,
  bulkApproveReviews,
  bulkRejectReviews,
  revertToPending,
} from "@/lib/reviews/actions";
import {
  getAggregatedReviews,
  getAggregatedReviewById,
  bulkArchiveReviews,
  bulkToggleFeatured,
  exportReviews,
  toggleReviewFeatured,
  archiveReview,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
}

type OpenDialog = null | "edit" | "reject" | "bulkReject";

// Filter state managed by useReducer
interface FilterState {
  statusFilter: string;
  memberFilter: string;
  sourceFilter: string;
  featuredFilter: string;
  searchQuery: string;
  dateRange: DateRange | undefined;
  page: number;
}

type FilterAction =
  | { type: "SET_STATUS"; value: string }
  | { type: "SET_MEMBER"; value: string }
  | { type: "SET_SOURCE"; value: string }
  | { type: "SET_FEATURED"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_DATE_RANGE"; value: DateRange | undefined }
  | { type: "SET_PAGE"; value: number }
  | { type: "CLEAR_ALL" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, statusFilter: action.value, page: 1 };
    case "SET_MEMBER":
      return { ...state, memberFilter: action.value, page: 1 };
    case "SET_SOURCE":
      return { ...state, sourceFilter: action.value, page: 1 };
    case "SET_FEATURED":
      return { ...state, featuredFilter: action.value, page: 1 };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.value, page: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.value, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.value };
    case "CLEAR_ALL":
      return {
        statusFilter: "all",
        memberFilter: "all",
        sourceFilter: "all",
        featuredFilter: "all",
        searchQuery: "",
        dateRange: undefined,
        page: 1,
      };
  }
}

// Context state shape
interface ReviewQueueState {
  reviews: (Review | AggregatedReview)[];
  total: number;
  stats: { pending: number; approved: number; rejected: number; total: number };
  aggregatedStats: ReviewAggregationStats | null;
  isPending: boolean;
  filters: FilterState;
  selectedIds: Set<string>;
  openDialog: OpenDialog;
  editingReview: Review | null;
  editedText: string;
  rejectingReview: Review | null;
  rejectionReason: string;
  bulkRejectionReason: string;
  selectedReview: AggregatedReview | null;
  detailModalOpen: boolean;
  teamMembers: TeamMember[];
  hasAiAccess: boolean;
  limit: number;
  totalPages: number;
  isPendingMode: boolean;
  hasActiveFilters: boolean;
}

interface ReviewQueueActions {
  dispatch: React.Dispatch<FilterAction>;
  refreshReviews: () => void;
  handleFilterChange: () => void;
  handleSearch: (e: React.FormEvent) => void;
  handlePageChange: (page: number) => void;
  clearFilters: () => void;
  handleExport: () => void;
  handleApprove: (review: Review, publish?: boolean) => void;
  handleReject: () => void;
  handleUpdateText: () => void;
  handleRevertToPending: (reviewId: string) => void;
  handleBulkApprove: () => void;
  handleBulkReject: () => void;
  handleBulkArchive: () => void;
  handleBulkFeature: (featured: boolean) => void;
  handleToggleFeatured: (reviewId: string, featured: boolean) => void;
  handleArchive: (reviewId: string) => void;
  openReviewDetail: (review: Review | AggregatedReview) => void;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  openEditDialog: (review: Review) => void;
  setEditedText: (text: string) => void;
  setRejectingReview: (review: Review | null) => void;
  setRejectionReason: (reason: string) => void;
  setBulkRejectDialogOpen: (open: boolean) => void;
  setBulkRejectionReason: (reason: string) => void;
  setEditingReview: (review: Review | null) => void;
  setDetailModalOpen: (open: boolean) => void;
  setSelectedReview: (review: AggregatedReview | null) => void;
}

interface ReviewQueueContextValue {
  state: ReviewQueueState;
  actions: ReviewQueueActions;
}

// ============================================================================
// Context
// ============================================================================

const ReviewQueueContext = createContext<ReviewQueueContextValue | null>(null);

export function useReviewQueue(): ReviewQueueContextValue {
  const ctx = useContext(ReviewQueueContext);
  if (!ctx) {
    throw new Error("useReviewQueue must be used within a ReviewQueueProvider");
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

interface ReviewQueueProviderProps {
  children: ReactNode;
  initialReviews: Review[];
  initialTotal: number;
  teamMembers: TeamMember[];
  initialStats: { pending: number; approved: number; rejected: number; total: number };
  initialAggregatedStats?: ReviewAggregationStats;
  initialReviewId?: string;
  hasAiAccess?: boolean;
}

export function ReviewQueueProvider({
  children,
  initialReviews,
  initialTotal,
  teamMembers,
  initialStats,
  initialAggregatedStats,
  initialReviewId,
  hasAiAccess = true,
}: ReviewQueueProviderProps) {
  const [reviews, setReviews] = useState<(Review | AggregatedReview)[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState(initialStats);
  const [aggregatedStats, setAggregatedStats] = useState<ReviewAggregationStats | null>(initialAggregatedStats || null);
  const [isPending, startTransition] = useTransition();

  // Filter state via useReducer
  const [filters, dispatch] = useReducer(filterReducer, {
    statusFilter: "all",
    memberFilter: "all",
    sourceFilter: "all",
    featuredFilter: "all",
    searchQuery: "",
    dateRange: undefined,
    page: 1,
  });

  const limit = 20;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state - unified enum
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedText, setEditedText] = useState("");
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Detail modal
  const [selectedReview, setSelectedReview] = useState<AggregatedReview | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Handle initialReviewId
  useEffect(() => {
    if (!initialReviewId) return;
    const openInitialReview = async () => {
      const reviewInList = reviews.find((r) => r.id === initialReviewId);
      if (reviewInList) {
        setSelectedReview(reviewInList as AggregatedReview);
        setDetailModalOpen(true);
        return;
      }
      const result = await getAggregatedReviewById(initialReviewId);
      if (result.success && result.data) {
        setSelectedReview(result.data);
        setDetailModalOpen(true);
      }
    };
    openInitialReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReviewId]);

  const isPendingMode = filters.statusFilter === "pending";
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    filters.statusFilter !== "all" ||
    filters.sourceFilter !== "all" ||
    filters.memberFilter !== "all" ||
    filters.featuredFilter !== "all" ||
    !!filters.searchQuery ||
    !!filters.dateRange?.from ||
    !!filters.dateRange?.to;

  // Build filters
  const buildFilters = useCallback((): AggregatedReviewFilters => {
    return {
      status: filters.statusFilter === "all" ? "all" : (filters.statusFilter as AggregatedReviewFilters["status"]),
      source: filters.sourceFilter === "all" ? "all" : (filters.sourceFilter as AggregatedReviewFilters["source"]),
      featured: filters.featuredFilter === "all" ? undefined : filters.featuredFilter === "yes",
      loanOfficerId: filters.memberFilter === "all" ? undefined : filters.memberFilter,
      search: filters.searchQuery || undefined,
      startDate: filters.dateRange?.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined,
      endDate: filters.dateRange?.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined,
      page: filters.page,
      limit,
    };
  }, [filters]);

  const refreshReviews = useCallback(() => {
    startTransition(async () => {
      const result = await getAggregatedReviews(buildFilters());
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
      const statsResult = await getReviewAggregationStats();
      if (statsResult.success && statsResult.data) {
        setAggregatedStats(statsResult.data);
      }
    });
  }, [buildFilters]);

  const handleFilterChange = useCallback(() => {
    setSelectedIds(new Set());
    startTransition(async () => {
      const f = buildFilters();
      f.page = 1;
      const result = await getAggregatedReviews(f);
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  }, [buildFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange();
  };

  const handlePageChange = (newPage: number) => {
    dispatch({ type: "SET_PAGE", value: newPage });
    setSelectedIds(new Set());
    startTransition(async () => {
      const f = buildFilters();
      f.page = newPage;
      const result = await getAggregatedReviews(f);
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  };

  const clearFilters = () => {
    dispatch({ type: "CLEAR_ALL" });
    setSelectedIds(new Set());
    startTransition(async () => {
      const result = await getAggregatedReviews({ page: 1, limit });
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  };

  const handleExport = async () => {
    startTransition(async () => {
      const result = await exportReviews(buildFilters());
      if (result.success && result.data) {
        const headers = ["ID", "Source", "Rating", "Customer Name", "Review Text", "Professional", "Status", "Review Date", "Response", "Sentiment"];
        const csvRows = [headers.join(",")];
        for (const row of result.data) {
          const values = [
            row.id, row.source, row.rating.toString(),
            `"${(row.customerName || "").replace(/"/g, '""')}"`,
            `"${(row.text || "").replace(/"/g, '""')}"`,
            `"${row.loanOfficerName.replace(/"/g, '""')}"`,
            row.status, row.reviewDate,
            `"${(row.responseText || "").replace(/"/g, '""')}"`,
            row.sentimentLabel || "",
          ];
          csvRows.push(values.join(","));
        }
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reviews-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleApprove = async (review: Review, publish: boolean = true) => {
    startTransition(async () => {
      const result = await approveReview({
        reviewId: review.id,
        editedText: editingReview?.id === review.id ? editedText : undefined,
        publish,
      });
      if (result.success) {
        setEditingReview(null);
        setOpenDialog(null);
        refreshReviews();
        setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1), approved: prev.approved + 1 }));
      }
    });
  };

  const handleReject = async () => {
    if (!rejectingReview || !rejectionReason) return;
    startTransition(async () => {
      const result = await rejectReview({ reviewId: rejectingReview.id, reason: rejectionReason });
      if (result.success) {
        setRejectingReview(null);
        setRejectionReason("");
        setOpenDialog(null);
        refreshReviews();
        setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1), rejected: prev.rejected + 1 }));
      }
    });
  };

  const handleUpdateText = async () => {
    if (!editingReview) return;
    startTransition(async () => {
      const result = await updateReviewText({ reviewId: editingReview.id, text: editedText });
      if (result.success) {
        setReviews((prev) => prev.map((r) => r.id === editingReview.id ? { ...r, text: editedText } : r));
      }
    });
  };

  const handleRevertToPending = async (reviewId: string) => {
    startTransition(async () => {
      const result = await revertToPending(reviewId);
      if (result.success) refreshReviews();
    });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkApproveReviews(ids);
      if (result.success) { setSelectedIds(new Set()); refreshReviews(); }
    });
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !bulkRejectionReason) return;
    startTransition(async () => {
      const result = await bulkRejectReviews(ids, bulkRejectionReason);
      if (result.success) {
        setSelectedIds(new Set());
        setOpenDialog(null);
        setBulkRejectionReason("");
        refreshReviews();
      }
    });
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkArchiveReviews(ids);
      if (result.success) { setSelectedIds(new Set()); refreshReviews(); }
    });
  };

  const handleBulkFeature = async (featured: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkToggleFeatured(ids, featured);
      if (result.success) { setSelectedIds(new Set()); refreshReviews(); }
    });
  };

  const handleToggleFeatured = async (reviewId: string, featured: boolean) => {
    startTransition(async () => {
      const result = await toggleReviewFeatured(reviewId, featured);
      if (result.success) refreshReviews();
    });
  };

  const handleArchive = async (reviewId: string) => {
    startTransition(async () => {
      const result = await archiveReview(reviewId);
      if (result.success) refreshReviews();
    });
  };

  const openReviewDetail = (review: Review | AggregatedReview) => {
    setSelectedReview(review as AggregatedReview);
    setDetailModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(reviews.map((r) => r.id)));
  };

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditedText(review.text || "");
    setOpenDialog("edit");
  };

  const setBulkRejectDialogOpen = (open: boolean) => {
    setOpenDialog(open ? "bulkReject" : null);
  };

  const value = useMemo<ReviewQueueContextValue>(
    () => ({
      state: {
        reviews, total, stats, aggregatedStats, isPending, filters,
        selectedIds, openDialog, editingReview, editedText,
        rejectingReview, rejectionReason, bulkRejectionReason,
        selectedReview, detailModalOpen, teamMembers, hasAiAccess,
        limit, totalPages, isPendingMode, hasActiveFilters,
      },
      actions: {
        dispatch, refreshReviews, handleFilterChange, handleSearch,
        handlePageChange, clearFilters, handleExport, handleApprove,
        handleReject, handleUpdateText, handleRevertToPending,
        handleBulkApprove, handleBulkReject, handleBulkArchive,
        handleBulkFeature, handleToggleFeatured, handleArchive,
        openReviewDetail, toggleSelection, toggleSelectAll,
        openEditDialog, setEditedText, setRejectingReview,
        setRejectionReason, setBulkRejectDialogOpen, setBulkRejectionReason,
        setEditingReview, setDetailModalOpen, setSelectedReview,
      },
    }),
    [
      reviews, total, stats, aggregatedStats, isPending, filters,
      selectedIds, openDialog, editingReview, editedText,
      rejectingReview, rejectionReason, bulkRejectionReason,
      selectedReview, detailModalOpen, teamMembers, hasAiAccess,
      totalPages, isPendingMode, hasActiveFilters,
      refreshReviews, handleFilterChange, buildFilters,
    ]
  );

  return (
    <ReviewQueueContext.Provider value={value}>
      {children}
    </ReviewQueueContext.Provider>
  );
}
