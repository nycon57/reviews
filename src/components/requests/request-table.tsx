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
    { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }
  > = {
    pending: { label: "Pending", variant: "secondary", icon: Clock },
    sent: { label: "Sent", variant: "default", icon: Send },
    opened: { label: "Opened", variant: "outline", icon: Eye },
    recording: { label: "Recording", variant: "outline", icon: AlertCircle },
    submitted: { label: "Completed", variant: "default", icon: CheckCircle },
    expired: { label: "Expired", variant: "destructive", icon: XCircle },
    cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Send className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No video testimonial requests</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
          Create your first video testimonial request to start collecting customer videos.
        </p>
        {canManage && (
          <Button onClick={onCreateNew} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Opened</TableHead>
            <TableHead>Reminders</TableHead>
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
