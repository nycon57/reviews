"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  MagnifyingGlass,
  SquaresFour,
  List,
  FunnelSimple,
  Envelope,
  Sparkle,
  DotsThree,
  Copy,
  Trash,
  PencilSimple,
  Eye,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { TemplateCard } from "./template-card";
import { TemplatePreviewSheet } from "./template-preview-sheet";
import { STARTER_TEMPLATES } from "@/lib/email-builder/starter-templates";
import type { CustomEmailTemplate } from "@/lib/email-builder/types";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
} from "@/lib/email-builder/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  staggerContainer,
  fadeInUp,
} from "@/lib/motion";
import type { EmailDocument, BlockNode } from "@/lib/email-builder/types";

type ViewMode = "grid" | "list";

const CATEGORY_LABELS: Record<string, string> = {
  review_request: "Review Request",
  review_reminder: "Reminder",
  thank_you: "Thank You",
  welcome: "Welcome",
  campaign: "Campaign",
  custom: "Custom",
  survey: "Survey",
  survey_followup: "Follow-Up",
  milestone: "Milestone",
  introduction: "Introduction",
  newsletter: "Newsletter",
  event: "Event",
  reengagement: "Re-engage",
  referral: "Referral",
};

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_COLORS: Record<string, string> = {
  review_request: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  review_reminder: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  thank_you: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  welcome: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  survey: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  survey_followup: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  milestone: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  newsletter: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  event: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  reengagement: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  referral: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  introduction: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
  campaign: "bg-repwell-teal-300/10 text-repwell-teal-300",
  custom: "bg-muted text-muted-foreground",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground";
}

export function TemplateGallery({
  templates,
  orgLogoUrl,
  orgName,
}: {
  templates: CustomEmailTemplate[];
  orgLogoUrl?: string | null;
  orgName?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showStarters, setShowStarters] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<CustomEmailTemplate | null>(null);

  // Collect unique categories from both user templates and starters
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach((t) => cats.add(t.category));
    STARTER_TEMPLATES.forEach((s) => cats.add(s.category));
    return Array.from(cats).sort();
  }, [templates]);

  const hasFilter = selectedCategories.size > 0;

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(t.category);
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, selectedCategories]);

  const filteredStarters = useMemo(() => {
    return STARTER_TEMPLATES.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(s.category);
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategories]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      toast({ title: "Template deleted" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateTemplate(id);
      toast({ title: "Template duplicated" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Duplicate failed",
        variant: "destructive",
      });
    }
  }

  /** Replace known merge fields with real org values in a document */
  function resolveOrgFields(doc: EmailDocument): EmailDocument {
    if (!orgLogoUrl && !orgName) return doc;

    function resolveInProps(props: Record<string, unknown>): Record<string, unknown> {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(props)) {
        if (typeof val === "string") {
          let resolved = val;
          if (orgLogoUrl) resolved = resolved.replace(/\{\{company_logo_url\}\}/g, orgLogoUrl);
          if (orgName) resolved = resolved.replace(/\{\{company_name\}\}/g, orgName);
          out[key] = resolved;
        } else {
          out[key] = val;
        }
      }
      return out;
    }

    return {
      ...doc,
      blocks: doc.blocks.map((b: BlockNode) => ({
        ...b,
        props: resolveInProps(b.props),
      })),
    };
  }

  async function handleCreateFromStarter(starterName: string) {
    const starter = STARTER_TEMPLATES.find((s) => s.name === starterName);
    if (!starter) {
      toast({ title: "Error", description: "Template not found", variant: "destructive" });
      return;
    }
    const document = resolveOrgFields(starter.document);
    try {
      const created = await createTemplate({
        name: starter.name,
        description: starter.description,
        category: starter.category,
        subject: starter.subject,
        document,
      });
      router.push(`/dashboard/emails/${created.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Create failed",
        variant: "destructive",
      });
    }
  }

  // Key that changes when filters change, so stagger re-triggers
  const filterKey = `${search}-${Array.from(selectedCategories).sort().join(",")}`;

  return (
      <div className="space-y-8">
        {/* Toolbar */}
        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>

          {/* Category filter dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FunnelSimple size={14} />
                {hasFilter ? (
                  <>
                    <span>
                      {selectedCategories.size === 1
                        ? getCategoryLabel(Array.from(selectedCategories)[0])
                        : `${selectedCategories.size} categories`}
                    </span>
                    <button
                      type="button"
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategories(new Set());
                      }}
                      aria-label="Clear filters"
                    >
                      <span className="text-[10px]">&times;</span>
                    </button>
                  </>
                ) : (
                  "Category"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-2">
              <div className="space-y-0.5">
                {allCategories.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedCategories.has(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getCategoryColor(cat)}`}>
                      {getCategoryLabel(cat)}
                    </span>
                  </label>
                ))}
              </div>
              {hasFilter && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-md border-t border-border pt-2 text-center text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedCategories(new Set())}
                >
                  Clear all
                </button>
              )}
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Grid view"
              >
                <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "regular"} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="List view"
              >
                <List size={16} weight={viewMode === "list" ? "bold" : "regular"} />
              </button>
            </div>

            <Button onClick={() => router.push("/dashboard/emails/new")}>
              <Plus size={16} className="mr-1.5" />
              New Template
            </Button>
          </div>
        </motion.div>

        {/* User templates section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Envelope size={18} className="text-repwell-teal-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                My Templates
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {filteredTemplates.length}
              </span>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border/60">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {search || hasFilter
                    ? "No templates match your filters"
                    : "No custom templates yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Create one from scratch or start from a template below
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              key={`grid-${filterKey}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredTemplates.map((template) => (
                <motion.div key={template.id} variants={fadeInUp}>
                  <TemplateCard
                    template={template}
                    onEdit={() => router.push(`/dashboard/emails/${template.id}`)}
                    onDelete={() => handleDelete(template.id)}
                    onDuplicate={() => handleDuplicate(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filterKey}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredTemplates.map((template) => (
                <motion.div key={template.id} variants={fadeInUp}>
                  <TemplateListRow
                    template={template}
                    onEdit={() => router.push(`/dashboard/emails/${template.id}`)}
                    onDelete={() => handleDelete(template.id)}
                    onDuplicate={() => handleDuplicate(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Starter templates section */}
        <section>
          <button
            type="button"
            onClick={() => setShowStarters(!showStarters)}
            className="mb-4 flex w-full items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Sparkle size={18} className="text-repwell-teal-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Starter Templates
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {filteredStarters.length}
              </span>
            </div>
            <motion.span
              animate={{ rotate: showStarters ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground group-hover:text-foreground"
            >
              {showStarters ? "Hide" : "Show"}
            </motion.span>
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: showStarters ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              {filteredStarters.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border/60">
                  <p className="text-sm text-muted-foreground">
                    No starter templates match your filters
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <motion.div
                  key={`starter-grid-${filterKey}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredStarters.map((starter) => (
                    <motion.div key={starter.name} variants={fadeInUp}>
                      <StarterCard
                        starter={starter}
                        onClick={() => handleCreateFromStarter(starter.name)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`starter-list-${filterKey}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {filteredStarters.map((starter) => (
                    <motion.div key={starter.name} variants={fadeInUp}>
                      <StarterListRow
                        starter={starter}
                        onClick={() => handleCreateFromStarter(starter.name)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Preview sheet */}
        <TemplatePreviewSheet
          key={previewTemplate?.id ?? "closed"}
          template={previewTemplate}
          open={previewTemplate !== null}
          onClose={() => setPreviewTemplate(null)}
        />
      </div>
  );
}

// ---------------------------------------------------------------------------
// List row for user templates
// ---------------------------------------------------------------------------

function TemplateListRow({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}: {
  template: CustomEmailTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview?: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-repwell-teal-300/40">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Envelope size={18} className="text-muted-foreground/60" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {template.name}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(template.category)}`}>
            {getCategoryLabel(template.category)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {template.subject}
        </p>
      </div>

      {/* Meta */}
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
        <span>v{template.version}</span>
        <span>{formatDate(template.updated_at)}</span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DotsThree size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onPreview && (
            <DropdownMenuItem onClick={onPreview}>
              <Eye size={14} className="mr-2" />
              Preview
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <PencilSimple size={14} className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy size={14} className="mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Starter template cards
// ---------------------------------------------------------------------------

interface StarterInfo {
  name: string;
  description: string;
  category: string;
  subject: string;
}

function StarterCard({
  starter,
  onClick,
}: {
  starter: StarterInfo;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="group relative w-full rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-repwell-teal-300/50 hover:shadow-sm"
      onClick={onClick}
    >
      {/* Decorative top accent */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-repwell-teal-300/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(starter.category)}`}>
          {getCategoryLabel(starter.category)}
        </span>
        <Plus
          size={14}
          className="text-muted-foreground/0 transition-all group-hover:text-repwell-teal-300 group-hover:translate-x-0 -translate-x-1"
        />
      </div>

      <p className="text-sm font-medium text-foreground">{starter.name}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {starter.description}
      </p>
    </button>
  );
}

function StarterListRow({
  starter,
  onClick,
}: {
  starter: StarterInfo;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-all hover:border-repwell-teal-300/40 hover:shadow-sm"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-repwell-teal-300/8">
        <Sparkle size={18} className="text-repwell-teal-300/50" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {starter.name}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(starter.category)}`}>
            {getCategoryLabel(starter.category)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {starter.description}
        </p>
      </div>

      <Plus
        size={16}
        className="shrink-0 text-muted-foreground/0 transition-all group-hover:text-repwell-teal-300"
      />
    </button>
  );
}
