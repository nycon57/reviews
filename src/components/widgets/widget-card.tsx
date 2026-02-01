"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Code2,
  Star,
  Building2,
  User,
  LayoutGrid,
  Video,
  Columns3,
  TrendingUp,
  Megaphone,
  Badge as BadgeIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteWidget, duplicateWidget } from "@/lib/widgets/actions";
import type { WidgetConfig, WidgetType } from "@/lib/widgets/types";

const TYPE_ICONS: Record<WidgetType, React.ComponentType<{ size?: number; className?: string }>> = {
  lo_review: User,
  branch_review: Building2,
  company_review: Building2,
  review_carousel: Columns3,
  star_rating_badge: Star,
  video_testimonial: Video,
  review_wall: LayoutGrid,
  nps_score_badge: TrendingUp,
  social_proof_banner: Megaphone,
};

const TYPE_LABELS: Record<WidgetType, string> = {
  lo_review: "LO Reviews",
  branch_review: "Branch Reviews",
  company_review: "Company Reviews",
  review_carousel: "Review Carousel",
  star_rating_badge: "Star Badge",
  video_testimonial: "Video Testimonial",
  review_wall: "Review Wall",
  nps_score_badge: "NPS Badge",
  social_proof_banner: "Social Proof",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  draft: "secondary",
  inactive: "outline",
};

interface WidgetCardProps {
  widget: WidgetConfig;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const Icon = TYPE_ICONS[widget.widget_type as WidgetType] ?? BadgeIcon;
  const typeLabel = TYPE_LABELS[widget.widget_type as WidgetType] ?? widget.widget_type;
  const statusVariant = STATUS_VARIANTS[widget.status] ?? "secondary";

  const handleEdit = () => {
    router.push(`/dashboard/widgets/${widget.id}`);
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateWidget({ id: widget.id });
      if (result.success) {
        toast({ title: "Widget duplicated", description: `"${result.data.name}" has been created.` });
        router.refresh();
      } else {
        toast({ title: "Duplication failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWidget({ id: widget.id });
      if (result.success) {
        toast({ title: "Widget deleted", description: "The widget has been removed." });
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleCopyEmbed = async () => {
    const code = `<script src="${window.location.origin}/embed.js" async></script>\n<div data-repwell-widget="${widget.widget_id}"></div>`;
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Embed code copied", description: "Paste it into your website." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  const createdDate = new Date(widget.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div
        className="group relative bg-white border border-border rounded-xl p-5 shadow-sm
          hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        onClick={handleEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(); }}
      >
        {/* Top row: icon + actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-repwell-sage-100/50 flex items-center justify-center text-repwell-teal-400">
            <Icon size={20} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleEdit} className="gap-2 text-xs">
                <Pencil size={14} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={isPending} className="gap-2 text-xs">
                <Copy size={14} /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyEmbed} className="gap-2 text-xs">
                <Code2 size={14} /> Copy Embed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-xs text-red-600 focus:text-red-600"
              >
                <Trash2 size={14} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-repwell-teal-500 truncate mb-1">
          {widget.name}
        </h3>

        {/* Type label */}
        <p className="text-xs text-muted-foreground mb-3">{typeLabel}</p>

        {/* Bottom: status + date */}
        <div className="flex items-center justify-between">
          <Badge variant={statusVariant} className="text-[10px] capitalize">
            {widget.status}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{createdDate}</span>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete widget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{widget.name}&quot;. Existing embeds will stop displaying.
              This action can be reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
