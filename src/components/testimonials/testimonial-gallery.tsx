'use client';

import { useState, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Star,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Check,
  X,
  Edit2,
  Trash2,
  Download,
  Image as ImageIcon,
  FileText,
  Twitter,
  MessageSquare,
  AlignLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
} from 'lucide-react';
import type {
  Testimonial,
  TestimonialFormat,
  TestimonialStatus,
  TestimonialStats,
  TestimonialFilters,
} from '@/lib/ai/testimonial-types';
import {
  getTestimonials,
  updateTestimonialStatus,
  updateTestimonialContent,
  deleteTestimonial,
  bulkUpdateTestimonialStatus,
  exportTestimonial,
  generateGraphicForTestimonial,
} from '@/lib/ai/testimonial-actions';

interface TestimonialGalleryProps {
  initialTestimonials: Testimonial[];
  initialTotal: number;
  initialStats: TestimonialStats;
}

const FORMAT_ICONS: Record<TestimonialFormat, React.ReactNode> = {
  headline: <AlignLeft className="h-4 w-4" />,
  short: <MessageSquare className="h-4 w-4" />,
  medium: <FileText className="h-4 w-4" />,
  long: <FileText className="h-4 w-4" />,
  social: <Twitter className="h-4 w-4" />,
};

const STATUS_ICONS: Record<TestimonialStatus, React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  published: <Share2 className="h-4 w-4 text-blue-500" />,
};

export function TestimonialGallery({
  initialTestimonials,
  initialTotal,
  initialStats,
}: TestimonialGalleryProps) {
  const [isPending, startTransition] = useTransition();
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [total, setTotal] = useState(initialTotal);
  const stats = initialStats;

  // Filters
  const [statusFilter, setStatusFilter] = useState<TestimonialStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<TestimonialFormat | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshTestimonials = useCallback(() => {
    startTransition(async () => {
      const filters: TestimonialFilters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        format: formatFilter === 'all' ? undefined : formatFilter,
        search: searchQuery || undefined,
        page: currentPage,
        limit: pageSize,
      };

      const result = await getTestimonials(filters);
      if (result.success && result.data) {
        setTestimonials(result.data.testimonials);
        setTotal(result.data.total);
      }
    });
  }, [statusFilter, formatFilter, searchQuery, currentPage]);

  const handleStatusChange = (id: string, status: TestimonialStatus) => {
    startTransition(async () => {
      const result = await updateTestimonialStatus(id, status);
      if (result.success) {
        setTestimonials(prev =>
          prev.map(t => t.id === id ? { ...t, status } : t)
        );
      }
    });
  };

  const handleBulkStatusChange = (status: TestimonialStatus) => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await bulkUpdateTestimonialStatus(Array.from(selectedIds), status);
      if (result.success) {
        setTestimonials(prev =>
          prev.map(t => selectedIds.has(t.id) ? { ...t, status } : t)
        );
        setSelectedIds(new Set());
      }
    });
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setEditContent(testimonial.content);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTestimonial) return;

    startTransition(async () => {
      const result = await updateTestimonialContent(editingTestimonial.id, editContent);
      if (result.success) {
        setTestimonials(prev =>
          prev.map(t => t.id === editingTestimonial.id ? { ...t, content: editContent } : t)
        );
        setEditDialogOpen(false);
        setEditingTestimonial(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;

    startTransition(async () => {
      const result = await deleteTestimonial(deletingId);
      if (result.success) {
        setTestimonials(prev => prev.filter(t => t.id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
      }
    });
  };

  const handleCopy = async (testimonial: Testimonial) => {
    await navigator.clipboard.writeText(testimonial.content);
    setCopiedId(testimonial.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (id: string, format: 'text' | 'html' | 'json') => {
    startTransition(async () => {
      const result = await exportTestimonial(id, { format });
      if (result.success && result.data) {
        const blob = new Blob([result.data.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `testimonial-${id.slice(0, 8)}.${format === 'html' ? 'html' : format === 'json' ? 'json' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleDownloadGraphic = (id: string) => {
    startTransition(async () => {
      const result = await generateGraphicForTestimonial(id, { template: 'modern' });
      if (result.success && result.data) {
        const a = document.createElement('a');
        a.href = result.data.imageData;
        a.download = `testimonial-${id.slice(0, 8)}.svg`;
        a.click();
      }
    });
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === testimonials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(testimonials.map(t => t.id)));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Testimonials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.draft}</div>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus.published}</div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalExports}</div>
            <p className="text-xs text-muted-foreground">Total Exports</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search testimonials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TestimonialStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as TestimonialFormat | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="headline">Headline</SelectItem>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshTestimonials} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              <span className="ml-2">Apply</span>
            </Button>
            <Button variant="outline" onClick={selectAll} disabled={testimonials.length === 0}>
              {selectedIds.size === testimonials.length && testimonials.length > 0 ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Select All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('approved')}>
                <Check className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('published')}>
                <Share2 className="h-4 w-4 mr-1" />
                Publish All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testimonials Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="relative">
            <div className="absolute top-3 left-3">
              <Checkbox
                checked={selectedIds.has(testimonial.id)}
                onCheckedChange={() => toggleSelection(testimonial.id)}
              />
            </div>
            <CardHeader className="pl-10 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {FORMAT_ICONS[testimonial.format]}
                  <span className="text-sm font-medium capitalize">{testimonial.format}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopy(testimonial)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(testimonial)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(testimonial.id, 'text')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(testimonial.id, 'html')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadGraphic(testimonial.id)}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Download Graphic
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(testimonial.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="text-sm border-l-2 pl-3 italic text-muted-foreground mb-4 line-clamp-4">
                &quot;{testimonial.content}&quot;
              </blockquote>

              {testimonial.review && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < (testimonial.review?.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>•</span>
                  <span>{testimonial.review.customerName || 'Anonymous'}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[testimonial.status]}
                  <Badge
                    variant={
                      testimonial.status === 'approved'
                        ? 'default'
                        : testimonial.status === 'published'
                        ? 'default'
                        : testimonial.status === 'rejected'
                        ? 'destructive'
                        : 'outline'
                    }
                    className={testimonial.status === 'published' ? 'bg-blue-500' : ''}
                  >
                    {testimonial.status}
                  </Badge>
                </div>

                {testimonial.status === 'draft' && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(testimonial.id, 'approved')}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(testimonial.id, 'rejected')}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}

                {copiedId === testimonial.id && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Copied!
                  </Badge>
                )}
              </div>

              {testimonial.exportCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Exported {testimonial.exportCount} times
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No testimonials found</h3>
            <p className="text-muted-foreground">
              Generate testimonials from your reviews to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>
              Modify the testimonial content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {editContent.length} characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
