"use client";

import { useState, useEffect } from "react";
import { PaperPlaneTilt, SpinnerGap, User } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  sendTestEmail,
  getTeamMembersForTestEmail,
} from "@/lib/email-builder/actions";
import type { EmailDocument } from "@/lib/email-builder/types";

type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  title: string | null;
};

interface SendTestEmailDialogProps {
  getDocument: () => EmailDocument;
  subject: string;
  onSaveFirst: () => Promise<void>;
}

export function SendTestEmailDialog({
  getDocument,
  subject,
  onSaveFirst,
}: SendTestEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendAsUserId, setSendAsUserId] = useState<string>("sample");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Load team members when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingTeam(true);
    getTeamMembersForTestEmail()
      .then(setTeamMembers)
      .finally(() => setLoadingTeam(false));
  }, [open]);

  async function handleSend() {
    if (!recipientEmail.trim()) return;

    setSending(true);
    try {
      // Auto-save first
      setSaveStatus("saving");
      await onSaveFirst();
      setSaveStatus("saved");

      // Send test email
      const result = await sendTestEmail({
        document: getDocument(),
        subject,
        recipientEmail: recipientEmail.trim(),
        sendAsUserId: sendAsUserId === "sample" ? undefined : sendAsUserId,
      });

      if (result.success) {
        toast({
          title: "Test email sent",
          description: `Sent to ${recipientEmail}`,
        });
        setOpen(false);
      } else {
        toast({
          title: "Failed to send",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      setSaveStatus("error");
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setSaveStatus("idle");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PaperPlaneTilt size={16} className="mr-1.5" />
              Send Test
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Send a test email</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Preview this email with real user data. Your template will be
            auto-saved before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Send as user */}
          <div className="space-y-2">
            <Label htmlFor="test-email-send-as">Send on behalf of</Label>
            <Select
              value={sendAsUserId}
              onValueChange={setSendAsUserId}
              disabled={sending}
            >
              <SelectTrigger id="test-email-send-as">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">
                  <span className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    Sample data (generic)
                  </span>
                </SelectItem>
                {loadingTeam ? (
                  <SelectItem value="_loading" disabled>
                    Loading team...
                  </SelectItem>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span className="flex items-center gap-2">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-4 w-4 rounded-full object-cover"
                          />
                        ) : (
                          <User
                            size={14}
                            className="text-muted-foreground"
                          />
                        )}
                        <span>{member.full_name}</span>
                        {member.title && (
                          <span className="text-muted-foreground">
                            — {member.title}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Replaces professional name, photo, and organization fields with
              real data
            </p>
          </div>

          {/* Recipient email */}
          <div className="space-y-2">
            <Label htmlFor="test-email-recipient">Send to</Label>
            <Input
              id="test-email-recipient"
              type="email"
              placeholder="you@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
              autoFocus
            />
          </div>

          {saveStatus === "saving" && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SpinnerGap size={12} className="animate-spin" />
              Saving template...
            </p>
          )}
          {saveStatus === "saved" && (
            <p className="text-xs text-muted-foreground">
              Template saved. Sending test email...
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !recipientEmail.trim()}
          >
            {sending ? (
              <>
                <SpinnerGap size={16} className="mr-1.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={16} className="mr-1.5" />
                Send Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
