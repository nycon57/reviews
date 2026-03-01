"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type {
  VideoTestimonialResponse,
  VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import {
  getVideoTestimonialResponses,
  updateVideoApprovalStatus,
  deleteVideoTestimonialResponse,
  bulkUpdateVideoApprovalStatus,
} from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

type OpenDialog =
  | null
  | "reject"
  | "delete"
  | "bulkReject"
  | "bulkDelete";

interface VideoLibraryState {
  responses: VideoTestimonialResponse[];
  total: number;
  isLoading: boolean;
  isUpdating: boolean;

  approvalFilter: string;
  memberFilter: string;
  searchQuery: string;
  page: number;
  pageSize: number;
  totalPages: number;
  selectedIds: Set<string>;
  allSelected: boolean;
  openDialog: OpenDialog;
  videoToReject: string | null;
  videoToDelete: string | null;
  canManage: boolean;
  canDelete: boolean;
  teamMembers: TeamMember[];
  videoStats: VideoLibraryStats;
}

interface VideoLibraryActions {

  setApprovalFilter: (filter: string) => void;
  setMemberFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number | ((p: number) => number)) => void;
  fetchResponses: () => void;
  handleSelect: (id: string, checked: boolean) => void;
  handleSelectAll: () => void;
  handleClearSelection: () => void;
  handleVideoClick: (video: VideoTestimonialResponse) => void;
  handleApprove: (id: string) => void;
  handleRejectClick: (id: string) => void;
  handleRejectConfirm: (reason: string) => void;
  handlePublish: (id: string) => void;
  handleDeleteClick: (id: string) => void;
  handleDeleteConfirm: () => void;
  handleBulkApprove: () => void;
  openBulkRejectDialog: () => void;
  handleBulkRejectConfirm: (reason: string) => void;
  handleBulkPublish: () => void;
  openBulkDeleteDialog: () => void;
  handleBulkDeleteConfirm: () => void;
  closeDialog: () => void;
}

interface VideoLibraryContextValue {
  state: VideoLibraryState;
  actions: VideoLibraryActions;
}

// ============================================================================
// Context
// ============================================================================

const VideoLibraryContext = createContext<VideoLibraryContextValue | null>(null);

export function useVideoLibrary(): VideoLibraryContextValue {
  const ctx = useContext(VideoLibraryContext);
  if (!ctx) {
    throw new Error("useVideoLibrary must be used within a VideoLibraryProvider");
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

interface VideoLibraryProviderProps {
  children: ReactNode;
  initialVideos: VideoTestimonialResponse[];
  initialTotal: number;
  videoStats: VideoLibraryStats;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

export function VideoLibraryProvider({
  children,
  initialVideos,
  initialTotal,
  videoStats,
  teamMembers,
  userRole,
}: VideoLibraryProviderProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<VideoTestimonialResponse[]>(initialVideos);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);


  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const totalPages = Math.ceil(total / pageSize);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Unified dialog state
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [videoToReject, setVideoToReject] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  const canManage = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const allSelected = useMemo(
    () => selectedIds.size === responses.length && responses.length > 0,
    [selectedIds.size, responses.length]
  );

  // Fetch responses
  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVideoTestimonialResponses({
        approvalStatus: approvalFilter !== "all" ? approvalFilter : undefined,
        loanOfficerId: memberFilter !== "all" ? memberFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setResponses(result.data.responses);
        setTotal(result.data.total);
        setSelectedIds(new Set());
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch videos",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [approvalFilter, memberFilter, searchQuery, page]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchResponses();
  }, [fetchResponses]);

  // Selection
  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(responses.map((r) => r.id)));
  }, [responses]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Navigation
  const handleVideoClick = useCallback(
    (video: VideoTestimonialResponse) => {
      router.push(`/dashboard/reviews/${video.id}?type=video`);
    },
    [router]
  );

  // Single actions
  const handleApprove = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "approve");
        if (result.success) {
          toast({ title: "Success", description: "Video approved" });
          fetchResponses();
        } else {
          toast({ title: "Error", description: result.error || "Failed to approve video", variant: "destructive" });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchResponses]
  );

  const handleRejectClick = useCallback((id: string) => {
    setVideoToReject(id);
    setOpenDialog("reject");
  }, []);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!videoToReject) return;
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(videoToReject, "reject", { reason });
        if (result.success) {
          toast({ title: "Success", description: "Video rejected" });
          setOpenDialog(null);
          setVideoToReject(null);
          fetchResponses();
        } else {
          toast({ title: "Error", description: result.error || "Failed to reject video", variant: "destructive" });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [videoToReject, fetchResponses]
  );

  const handlePublish = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "publish");
        if (result.success) {
          toast({ title: "Success", description: "Video published" });
          fetchResponses();
        } else {
          toast({ title: "Error", description: result.error || "Failed to publish video", variant: "destructive" });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchResponses]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setVideoToDelete(id);
    setOpenDialog("delete");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!videoToDelete) return;
    setIsUpdating(true);
    try {
      const result = await deleteVideoTestimonialResponse(videoToDelete);
      if (result.success) {
        toast({ title: "Success", description: "Video deleted" });
        setOpenDialog(null);
        setVideoToDelete(null);
        fetchResponses();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete video", variant: "destructive" });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [videoToDelete, fetchResponses]);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsUpdating(true);
    try {
      const result = await bulkUpdateVideoApprovalStatus(Array.from(selectedIds), "approve");
      if (result.success && result.data) {
        const { successful, failed } = result.data;
        toast({
          title: failed.length === 0 ? "Success" : "Partial Success",
          description: `${successful.length} video${successful.length !== 1 ? "s" : ""} approved${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
          variant: failed.length > 0 ? "destructive" : "default",
        });
        fetchResponses();
      } else {
        toast({ title: "Error", description: result.error || "Bulk approve failed", variant: "destructive" });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  const openBulkRejectDialog = useCallback(() => {
    setOpenDialog("bulkReject");
  }, []);

  const handleBulkRejectConfirm = useCallback(
    async (reason: string) => {
      if (selectedIds.size === 0) return;
      setIsUpdating(true);
      try {
        const result = await bulkUpdateVideoApprovalStatus(Array.from(selectedIds), "reject", { reason });
        if (result.success && result.data) {
          const { successful, failed } = result.data;
          toast({
            title: failed.length === 0 ? "Success" : "Partial Success",
            description: `${successful.length} video${successful.length !== 1 ? "s" : ""} rejected${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
            variant: failed.length > 0 ? "destructive" : "default",
          });
          setOpenDialog(null);
          fetchResponses();
        } else {
          toast({ title: "Error", description: result.error || "Bulk reject failed", variant: "destructive" });
          setOpenDialog(null);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedIds, fetchResponses]
  );

  const handleBulkPublish = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map((id) => updateVideoApprovalStatus(id, "publish")));
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      toast({
        title: failed === 0 ? "Success" : "Partial Success",
        description: `${successful} video${successful !== 1 ? "s" : ""} published${failed > 0 ? `, ${failed} failed` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      fetchResponses();
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  const openBulkDeleteDialog = useCallback(() => {
    setOpenDialog("bulkDelete");
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map((id) => deleteVideoTestimonialResponse(id)));
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      toast({
        title: failed === 0 ? "Success" : "Partial Success",
        description: `${successful} video${successful !== 1 ? "s" : ""} deleted${failed > 0 ? `, ${failed} failed` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      setOpenDialog(null);
      fetchResponses();
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  const closeDialog = useCallback(() => {
    setOpenDialog(null);
    setVideoToReject(null);
    setVideoToDelete(null);
  }, []);

  // Wrap filter setters to reset page
  const setApprovalFilterWithReset = useCallback((filter: string) => {
    setApprovalFilter(filter);
    setPage(1);
  }, []);

  const setSearchQueryDirect = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const setMemberFilterWithReset = useCallback((filter: string) => {
    setMemberFilter(filter);
    setPage(1);
  }, []);

  const value = useMemo<VideoLibraryContextValue>(
    () => ({
      state: {
        responses,
        total,
        isLoading,
        isUpdating,
        approvalFilter,
        memberFilter,
        searchQuery,
        page,
        pageSize,
        totalPages,
        selectedIds,
        allSelected,
        openDialog,
        videoToReject,
        videoToDelete,
        canManage,
        canDelete,
        teamMembers,
        videoStats,
      },
      actions: {
        setApprovalFilter: setApprovalFilterWithReset,
        setMemberFilter: setMemberFilterWithReset,
        setSearchQuery: setSearchQueryDirect,
        setPage,
        fetchResponses,
        handleSelect,
        handleSelectAll,
        handleClearSelection,
        handleVideoClick,
        handleApprove,
        handleRejectClick,
        handleRejectConfirm,
        handlePublish,
        handleDeleteClick,
        handleDeleteConfirm,
        handleBulkApprove,
        openBulkRejectDialog,
        handleBulkRejectConfirm,
        handleBulkPublish,
        openBulkDeleteDialog,
        handleBulkDeleteConfirm,
        closeDialog,
      },
    }),
    [
      responses, total, isLoading, isUpdating, approvalFilter,
      memberFilter, searchQuery, page, pageSize, totalPages, selectedIds,
      allSelected, openDialog, videoToReject, videoToDelete, canManage,
      canDelete, teamMembers, videoStats, setApprovalFilterWithReset, setMemberFilterWithReset,
      setSearchQueryDirect, fetchResponses, handleSelect, handleSelectAll,
      handleClearSelection, handleVideoClick, handleApprove, handleRejectClick,
      handleRejectConfirm, handlePublish, handleDeleteClick, handleDeleteConfirm,
      handleBulkApprove, openBulkRejectDialog, handleBulkRejectConfirm,
      handleBulkPublish, openBulkDeleteDialog, handleBulkDeleteConfirm, closeDialog,
    ]
  );

  return (
    <VideoLibraryContext.Provider value={value}>
      {children}
    </VideoLibraryContext.Provider>
  );
}
