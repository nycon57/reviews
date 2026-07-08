"use client";

import { useState } from "react";
import { ChatCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { MessageModal } from "./message-modal";
import type { ContactRecipientType } from "@/lib/pro/contact-actions";

interface ProfileMessageActionProps {
  recipientType?: ContactRecipientType;
  recipientId: string;
  recipientName: string;
}

export function ProfileMessageAction({
  recipientType = "professional",
  recipientId,
  recipientName,
}: ProfileMessageActionProps) {
  const [messageOpen, setMessageOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
        onClick={() => setMessageOpen(true)}
      >
        <ChatCircle className="h-4 w-4" />
        Message
      </Button>
      <MessageModal
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipientType={recipientType}
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </>
  );
}
