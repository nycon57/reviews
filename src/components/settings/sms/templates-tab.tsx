'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  PencilSimple,
  Copy,
  Archive,
  ChartBar,
  Lock,
  FileText,
  MagnifyingGlass,
  FunnelSimple,
  DotsThree,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { staggerContainer, fadeInUp } from '@/lib/motion/variants';
import {
  listSmsTemplates,
  archiveSmsTemplate,
  createSmsTemplate,
} from '@/lib/sms/templates/actions';
import { getAllTemplatePerformance } from '@/lib/sms/templates/performance-actions';
import type { SmsTemplate, SmsTemplateCategory } from '@/lib/sms/types';
import { TemplateEditorDialog } from './template-editor-dialog';
import { TemplatePerformancePanel } from './template-performance';

// ── Category display helpers ──────────────────────────────────────────

const CATEGORY_LABELS: Record<SmsTemplateCategory, string> = {
  review_request: 'Review Request',
  follow_up: 'Follow-Up',
  thank_you: 'Thank You',
  video_request: 'Video Request',
  custom: 'Custom',
};

const CATEGORY_COLORS: Record<SmsTemplateCategory, string> = {
  review_request: 'bg-blue-50 text-blue-700 border-blue-200',
  follow_up: 'bg-amber-50 text-amber-700 border-amber-200',
  thank_you: 'bg-green-50 text-green-700 border-green-200',
  video_request: 'bg-purple-50 text-purple-700 border-purple-200',
  custom: 'bg-gray-50 text-gray-700 border-gray-200',
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Main Component ────────────────────────────────────────────────────

export function SmsTemplatesTab() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [perfMetrics, setPerfMetrics] = useState<
    Record<string, { sends: number; click_rate: number; last_used: string | null }>
  >({});

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');

  // Dialog state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);

  // Archive confirmation
  const [archiveTarget, setArchiveTarget] = useState<SmsTemplate | null>(null);

  // Performance panel
  const [perfTemplate, setPerfTemplate] = useState<SmsTemplate | null>(null);

  // ── Data loading ──────────────────────────────────────────────────

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    const [templatesResult, perfResult] = await Promise.all([
      listSmsTemplates({
        status: statusFilter,
        category: categoryFilter !== 'all' ? (categoryFilter as SmsTemplateCategory) : undefined,
      }),
      getAllTemplatePerformance(),
    ]);

    if (templatesResult.success && templatesResult.data) {
      setTemplates(templatesResult.data.templates);
      setTotal(templatesResult.data.total);
    } else {
      toast({ title: 'Error', description: templatesResult.error, variant: 'destructive' });
    }

    if (perfResult.success && perfResult.data) {
      setPerfMetrics(perfResult.data);
    }

    setIsLoading(false);
  }, [statusFilter, categoryFilter, toast]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Filtered templates ────────────────────────────────────────────

  const filtered = useMemo(
    () =>
      search
        ? templates.filter(
            (t) =>
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              t.body.toLowerCase().includes(search.toLowerCase())
          )
        : templates,
    [templates, search]
  );

  // ── Actions ───────────────────────────────────────────────────────

  function handleCreate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  function handleEdit(template: SmsTemplate) {
    setEditingTemplate(template);
    setEditorOpen(true);
  }

  const handleDuplicate = useCallback(
    (template: SmsTemplate) => {
      startTransition(async () => {
        const result = await createSmsTemplate({
          name: `${template.name} (Copy)`,
          category: template.category,
          body: template.body,
        });
        if (result.success) {
          toast({ title: 'Duplicated', description: `"${template.name}" has been duplicated.` });
          loadTemplates();
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      });
    },
    [toast, loadTemplates]
  );

  const handleArchive = useCallback(() => {
    if (!archiveTarget) return;
    startTransition(async () => {
      const result = await archiveSmsTemplate({ id: archiveTarget.id });
      if (result.success) {
        toast({ title: 'Archived', description: `"${archiveTarget.name}" has been archived.` });
        setArchiveTarget(null);
        loadTemplates();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  }, [archiveTarget, toast, loadTemplates]);

  // ── Loading state ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-12 w-full bg-muted rounded-xl" />
        <div className="h-96 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-repwell-teal-500">SMS Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage message templates for surveys, follow-ups, and review requests.
            {total > 0 && ` ${total} template${total === 1 ? '' : 's'} total.`}
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </motion.div>

      {/* Filters bar */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <FunnelSimple className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="review_request">Review Request</SelectItem>
                    <SelectItem value="follow_up">Follow-Up</SelectItem>
                    <SelectItem value="thank_you">Thank You</SelectItem>
                    <SelectItem value="video_request">Video Request</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as 'active' | 'archived')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Templates table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-background-subtle flex items-center justify-center">
                  <FileText weight="duotone" className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-repwell-teal-400">No templates found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search || categoryFilter !== 'all'
                      ? 'Try adjusting your filters.'
                      : 'Create your first SMS template to get started.'}
                  </p>
                </div>
                {!search && categoryFilter === 'all' && statusFilter === 'active' && (
                  <Button
                    onClick={handleCreate}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Template
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Body</TableHead>
                    <TableHead className="w-[80px] text-right">Sends</TableHead>
                    <TableHead className="w-[90px] text-right hidden md:table-cell">
                      Click Rate
                    </TableHead>
                    <TableHead className="w-[110px] hidden md:table-cell">Last Used</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((template) => {
                    const perf = perfMetrics[template.id];
                    return (
                      <TableRow
                        key={template.id}
                        className="group cursor-pointer hover:bg-background-subtle/50"
                        onClick={(e) => {
                          // Only trigger row click if not from interactive child
                          if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;
                          handleEdit(template);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {template.is_locked && (
                              <Lock weight="fill" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium text-repwell-teal-500 truncate max-w-[160px]">
                              {template.name}
                            </span>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={CATEGORY_COLORS[template.category]}
                          >
                            {CATEGORY_LABELS[template.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground font-mono">
                            {truncate(template.body, 60)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {perf?.sends?.toLocaleString() ?? '0'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden md:table-cell">
                          {perf ? `${(perf.click_rate * 100).toFixed(1)}%` : '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {perf?.last_used ? formatDate(perf.last_used) : '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="Template actions"
                                disabled={isPending}
                              >
                                <DotsThree weight="bold" className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(template); }}>
                                <PencilSimple className="h-4 w-4 mr-2" />
                                {template.is_locked ? 'View' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPerfTemplate(template); }}>
                                <ChartBar className="h-4 w-4 mr-2" />
                                Performance
                              </DropdownMenuItem>
                              {!template.is_default && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); setArchiveTarget(template); }}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance panel */}
      {perfTemplate && (
        <TemplatePerformancePanel
          template={perfTemplate}
          templates={templates}
          onClose={() => setPerfTemplate(null)}
        />
      )}

      {/* Editor dialog */}
      <TemplateEditorDialog
        key={editingTemplate?.id ?? 'new'}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSaved={loadTemplates}
      />

      {/* Archive confirmation */}
      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &ldquo;{archiveTarget?.name}&rdquo;?
              Archived templates can no longer be used for new sends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
