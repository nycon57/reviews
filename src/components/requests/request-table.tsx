"use client";

import {
  Plus,
  PaperPlaneRight as Send,
  DotsThree as MoreHorizontal,
  X,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import type { VideoTestimonialRequest } from "@/lib/video-testimonials/actions";

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: typeof Clock }
  > = {
    pending: {
      label: "Pending",
      className: "text-amber-600 border-amber-300 bg-amber-50",
      icon: Clock,
    },
    sent: {
      label: "Sent",
      className: "text-repwell-teal-300 border-repwell-teal-300/30 bg-repwell-teal-300/5",
      icon: Send,
    },
    opened: {
      label: "Opened",
      className: "text-repwell-teal-400 border-repwell-teal-400/30 bg-repwell-teal-400/5",
      icon: Eye,
    },
    recording: {
      label: "Recording",
      className: "text-purple-600 border-purple-300 bg-purple-50",
      icon: AlertCircle,
    },
    submitted: {
      label: "Completed",
      className: "text-repwell-sage-200 border-repwell-sage-200/30 bg-repwell-sage-200/5",
      icon: CheckCircle,
    },
    expired: {
      label: "Expired",
      className: "text-destructive border-destructive/30 bg-destructive/5",
      icon: XCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "text-muted-foreground border-border bg-muted/50",
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Request Table
// ============================================================================

interface RequestTableProps {
  requests: VideoTestimonialRequest[];
  canManage: boolean;
  isResending: boolean;
  onResend: (requestId: string) => void;
  onCancelRequest: (requestId: string) => void;
  onCreateNew: () => void;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RequestTable({
  requests,
  canManage,
  isResending,
  onResend,
  onCancelRequest,
  onCreateNew,
}: RequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Send className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-repwell-teal-500">No video testimonial requests</h3>
        <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
          Create your first video testimonial request to start collecting customer videos.
        </p>
        {canManage && (
          <Button onClick={onCreateNew} className="mt-5">
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs font-medium uppercase tracking-wider">Customer</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Sent</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Opened</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Reminders</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{request.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.customerEmail}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.sentAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.openedAt)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{request.reminderCount}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(request.requestUrl);
                        toast({ title: "Copied", description: "Link copied to clipboard" });
                      }}
                    >
                      Copy Link
                    </DropdownMenuItem>
                    {canManage &&
                      !["submitted", "cancelled", "expired"].includes(request.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onResend(request.id)}
                            disabled={isResending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCancelRequest(request.id)}
                            className="text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Request
                          </DropdownMenuItem>
                        </>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
