import { z } from "zod";

export const sendReplySchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1, "Message is required").max(1600, "Message too long"),
});

export const updateConversationStatusSchema = z.object({
  conversationId: z.string().uuid(),
  status: z.enum(["active", "closed", "archived"]),
});

export const reassignConversationSchema = z.object({
  conversationId: z.string().uuid(),
  loanOfficerId: z.string().uuid().nullable(),
});

export const markConversationReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export type SendReplyInput = z.infer<typeof sendReplySchema>;
export type UpdateConversationStatusInput = z.infer<typeof updateConversationStatusSchema>;
export type ReassignConversationInput = z.infer<typeof reassignConversationSchema>;
