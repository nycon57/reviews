"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Envelope,
  VideoCamera,
  Star,
  Prohibit,
  SpinnerGap,
  WarningCircle,
  Trash,
  Clock,
} from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import {
  getContactTimeline,
  type ContactTimelineResult,
  type ContactTimelineEntry,
} from "@/lib/contacts/queries";
import {
  setContactDoNotContact,
  reassignContact,
  eraseContactAction,
} from "@/lib/contacts/ui-actions";

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

interface ContactDetailSheetProps {
  contactId: string | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
  onMutated: () => void;
}

const UNASSIGNED = "__unassigned__";

function timelineIcon(kind: ContactTimelineEntry["kind"]) {
  switch (kind) {
    case "survey":
      return Envelope;
    case "video":
      return VideoCamera;
    case "review":
      return Star;
  }
}

function timelineLabel(entry: ContactTimelineEntry): string {
  switch (entry.kind) {
    case "survey":
      return "Text review request";
    case "video":
      return "Video request";
    case "review":
      return entry.rating ? `Review · ${entry.rating}★` : "Review";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactDetailSheet({
  contactId,
  onOpenChange,
  canManage,
  teamMembers,
  onMutated,
}: ContactDetailSheetProps) {
  const [data, setData] = useState<ContactTimelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pending, startTransition] = useTransition();
  const [eraseOpen, setEraseOpen] = useState(false);

  const open = contactId !== null;

  const load = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const result = await getContactTimeline(contactId);
      if (!result) setNotFound(true);
      setData(result);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (open) {
      setData(null);
      load();
    }
  }, [open, load]);

  const suppressed = data
    ? data.contact.suppressions.some((s) => s.channel === "email")
    : false;
  const isErased = !!data?.contact.erasedAt;

  const handleToggleSuppression = useCallback(
    (nextSuppressed: boolean) => {
      if (!contactId) return;
      startTransition(async () => {
        const res = await setContactDoNotContact(contactId, nextSuppressed);
        if (res.success) {
          toast({
            title: nextSuppressed ? "Marked do-not-contact" : "Contact reinstated",
          });
          await load();
          onMutated();
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
        }
      });
    },
    [contactId, load, onMutated]
  );

  const handleReassign = useCallback(
    (value: string) => {
      if (!contactId) return;
      const newOwner = value === UNASSIGNED ? null : value;
      startTransition(async () => {
        const res = await reassignContact(contactId, newOwner);
        if (res.success) {
          toast({ title: "Owner updated" });
          await load();
          onMutated();
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
        }
      });
    },
    [contactId, load, onMutated]
  );

  const handleErase = useCallback(() => {
    if (!contactId) return;
    startTransition(async () => {
      const res = await eraseContactAction(contactId);
      setEraseOpen(false);
      if (res.success) {
        toast({ title: "Contact erased" });
        onMutated();
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    });
  }, [contactId, onMutated, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <SpinnerGap className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && notFound && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <WarningCircle className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              This contact couldn&apos;t be found.
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-heading">
                {data.contact.name || data.contact.email || "Contact"}
              </SheetTitle>
              <SheetDescription>
                {data.contact.email || "No email on file"}
                {data.contact.phone ? ` · ${data.contact.phone}` : ""}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {suppressed && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-destructive/30 bg-destructive/5 text-destructive"
                  >
                    <Prohibit className="h-3 w-3" />
                    Do not contact
                  </Badge>
                )}
                {isErased && <Badge variant="secondary">Erased</Badge>}
                {data.contact.source && (
                  <Badge variant="subtle" className="capitalize">
                    {data.contact.source.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {!isErased && (
              <>
                <Separator />
                <div className="space-y-4">
                  {/* Do-not-contact toggle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="dnc-toggle" className="text-sm font-medium">
                        Do not contact
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Stops all review and testimonial emails to this contact.
                      </p>
                    </div>
                    <Switch
                      id="dnc-toggle"
                      checked={suppressed}
                      disabled={pending}
                      onCheckedChange={handleToggleSuppression}
                    />
                  </div>

                  {/* Owner reassignment (managers/admins) */}
                  {canManage && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Owner</Label>
                      <Select
                        value={data.contact.ownerUserId ?? UNASSIGNED}
                        onValueChange={handleReassign}
                        disabled={pending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-heading">Activity</h4>
              {data.timeline.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  No requests or reviews yet.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {data.timeline.map((entry) => {
                    const Icon = timelineIcon(entry.kind);
                    return (
                      <li
                        key={`${entry.kind}-${entry.id}`}
                        className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                          <Icon className="h-4 w-4 text-repwell-teal-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-heading">
                              {timelineLabel(entry)}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDate(entry.occurredAt)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {entry.status && (
                              <span className="text-xs capitalize text-muted-foreground">
                                {entry.status}
                              </span>
                            )}
                            {entry.kind === "review" &&
                              (entry.isPublished ? (
                                <Badge variant="subtle" className="text-[10px]">
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Not live
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Erase (owner or admin; managers are excluded by the action) */}
            {!isErased && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => setEraseOpen(true)}
                    disabled={pending}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Erase contact
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Permanently removes this person&apos;s name, email, and phone
                    from RepWell. This can&apos;t be undone.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>

      <AlertDialog open={eraseOpen} onOpenChange={setEraseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erase this contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently anonymizes {data?.contact.name || "this contact"} —
              their name, email, and phone are removed from every request and
              review. Published reviews stay live but become anonymous.{" "}
              <span className="font-medium text-foreground">
                This action can&apos;t be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleErase();
              }}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? (
                <>
                  <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  Erasing...
                </>
              ) : (
                "Erase contact"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
