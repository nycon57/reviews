"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { SmsService } from "../sms-service";
import { formatForDisplay } from "../phone-utils";
import {
  sendReplySchema,
  updateConversationStatusSchema,
  reassignConversationSchema,
  markConversationReadSchema,
  type SendReplyInput,
  type UpdateConversationStatusInput,
  type ReassignConversationInput,
} from "./schemas";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthContext() {
  const profile = await unifiedGetUserWithProfile();
  if (!profile || !profile.organization_id) return null;
  return {
    userId: profile.id,
    organizationId: profile.organization_id,
    role: profile.role as string,
    fullName: profile.full_name as string,
  };
}

// ── Conversation types ──────────────────────────────────────────────

export interface ConversationListItem {
  id: string;
  borrowerPhone: string;
  borrowerPhoneDisplay: string;
  borrowerName: string | null;
  assignedLoId: string | null;
  assignedLoName: string | null;
  assignedLoAvatar: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageDirection: "inbound" | "outbound" | null;
  status: "active" | "closed" | "archived";
  unreadCount: number;
}

export interface ConversationMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  segments: number;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
}

// ── Get Conversations ───────────────────────────────────────────────

export async function getConversations(opts?: {
  status?: string;
  search?: string;
}): Promise<ActionResult<ConversationListItem[]>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_conversations")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }

  if (opts?.search) {
    // Search by phone number (partial match)
    query = query.ilike("borrower_phone", `%${opts.search}%`);
  }

  const { data: conversations, error } = await query.limit(100);

  if (error) {
    return { success: false, error: "Failed to load conversations" };
  }

  if (!conversations || conversations.length === 0) {
    return { success: true, data: [] };
  }

  // Get assigned LO info for conversations that have one
  const loIds = [
    ...new Set(
      conversations
        .map((c: { assigned_lo_id: string | null }) => c.assigned_lo_id)
        .filter(Boolean)
    ),
  ];

  let loMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (loIds.length > 0) {
    const { data: loData } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", loIds);

    if (loData) {
      for (const lo of loData) {
        loMap[lo.id] = { full_name: lo.full_name, avatar_url: lo.avatar_url };
      }
    }
  }

  // Get last message preview for each conversation
  const phoneNumbers = conversations.map(
    (c: { borrower_phone: string }) => c.borrower_phone
  );
  const { data: lastMessages } = await supabase
    .from("sms_messages")
    .select("from_number, to_number, body, direction, created_at")
    .eq("organization_id", auth.organizationId)
    .or(
      phoneNumbers
        .map(
          (p: string) =>
            `and(from_number.eq.${p}),and(to_number.eq.${p})`
        )
        .join(",")
    )
    .order("created_at", { ascending: false })
    .limit(conversations.length * 2);

  // Build a map of borrower_phone -> last message
  const lastMsgMap: Record<
    string,
    { body: string; direction: string }
  > = {};
  if (lastMessages) {
    for (const msg of lastMessages) {
      const phone =
        msg.direction === "inbound" ? msg.from_number : msg.to_number;
      if (!lastMsgMap[phone]) {
        lastMsgMap[phone] = {
          body: msg.body,
          direction: msg.direction,
        };
      }
    }
  }

  const items: ConversationListItem[] = conversations.map(
    (c: {
      id: string;
      borrower_phone: string;
      assigned_lo_id: string | null;
      last_message_at: string | null;
      status: string;
      unread_count: number;
    }) => {
      const lo = c.assigned_lo_id ? loMap[c.assigned_lo_id] : null;
      const lastMsg = lastMsgMap[c.borrower_phone];
      return {
        id: c.id,
        borrowerPhone: c.borrower_phone,
        borrowerPhoneDisplay: formatForDisplay(c.borrower_phone),
        borrowerName: null, // Could match to borrowers table in future
        assignedLoId: c.assigned_lo_id,
        assignedLoName: lo?.full_name ?? null,
        assignedLoAvatar: lo?.avatar_url ?? null,
        lastMessageAt: c.last_message_at,
        lastMessagePreview: lastMsg?.body?.slice(0, 80) ?? null,
        lastMessageDirection: (lastMsg?.direction as "inbound" | "outbound") ?? null,
        status: c.status as "active" | "closed" | "archived",
        unreadCount: c.unread_count ?? 0,
      };
    }
  );

  return { success: true, data: items };
}

// ── Get Conversation Messages ───────────────────────────────────────

export async function getConversationMessages(
  conversationId: string
): Promise<ActionResult<{ conversation: ConversationListItem; messages: ConversationMessage[] }>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();

  // Get conversation
  const { data: conv, error: convError } = await supabase
    .from("sms_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (convError || !conv) {
    return { success: false, error: "Conversation not found" };
  }

  // Get messages for this conversation (by phone number match)
  const { data: msgs, error: msgsError } = await supabase
    .from("sms_messages")
    .select("id, direction, body, status, segments, created_at, sent_at, delivered_at")
    .eq("organization_id", auth.organizationId)
    .or(`from_number.eq.${conv.borrower_phone},to_number.eq.${conv.borrower_phone}`)
    .order("created_at", { ascending: true })
    .limit(500);

  if (msgsError) {
    return { success: false, error: "Failed to load messages" };
  }

  // Get LO info if assigned
  let loInfo: { full_name: string | null; avatar_url: string | null } | null = null;
  if (conv.assigned_lo_id) {
    const { data: lo } = await supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", conv.assigned_lo_id)
      .single();
    loInfo = lo;
  }

  const conversation: ConversationListItem = {
    id: conv.id,
    borrowerPhone: conv.borrower_phone,
    borrowerPhoneDisplay: formatForDisplay(conv.borrower_phone),
    borrowerName: null,
    assignedLoId: conv.assigned_lo_id,
    assignedLoName: loInfo?.full_name ?? null,
    assignedLoAvatar: loInfo?.avatar_url ?? null,
    lastMessageAt: conv.last_message_at,
    lastMessagePreview: null,
    lastMessageDirection: null,
    status: conv.status,
    unreadCount: conv.unread_count ?? 0,
  };

  const messages: ConversationMessage[] = (msgs ?? []).map(
    (m: {
      id: string;
      direction: string;
      body: string;
      status: string;
      segments: number;
      created_at: string;
      sent_at: string | null;
      delivered_at: string | null;
    }) => ({
      id: m.id,
      direction: m.direction as "inbound" | "outbound",
      body: m.body,
      status: m.status,
      segments: m.segments,
      createdAt: m.created_at,
      sentAt: m.sent_at,
      deliveredAt: m.delivered_at,
    })
  );

  return { success: true, data: { conversation, messages } };
}

// ── Send Reply ──────────────────────────────────────────────────────

export async function sendReply(
  input: SendReplyInput
): Promise<ActionResult<{ messageId: string }>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = sendReplySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  // Get conversation to find borrower phone
  const { data: conv } = await supabase
    .from("sms_conversations")
    .select("borrower_phone, organization_id")
    .eq("id", parsed.data.conversationId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!conv) {
    return { success: false, error: "Conversation not found" };
  }

  // Send via SmsService (handles consent, quiet hours, credits)
  const smsService = await SmsService.forOrganization(auth.organizationId);
  const result = await smsService.sendCustomMessage({
    to: conv.borrower_phone,
    body: parsed.data.body,
    loanOfficerId: auth.userId,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send message" };
  }

  // Update conversation last_message_at
  await supabase
    .from("sms_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", parsed.data.conversationId);

  revalidatePath("/dashboard/messages");

  return { success: true, data: { messageId: result.messageId! } };
}

// ── Mark Conversation Read ──────────────────────────────────────────

export async function markConversationRead(
  conversationId: string
): Promise<ActionResult> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = markConversationReadSchema.safeParse({ conversationId });
  if (!parsed.success) {
    return { success: false, error: "Invalid conversation ID" };
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to mark as read" };
  }

  return { success: true };
}

// ── Update Conversation Status ──────────────────────────────────────

export async function updateConversationStatus(
  input: UpdateConversationStatusInput
): Promise<ActionResult> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = updateConversationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_conversations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.conversationId)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to update status" };
  }

  revalidatePath("/dashboard/messages");
  return { success: true };
}

// ── Reassign Conversation ───────────────────────────────────────────

export async function reassignConversation(
  input: ReassignConversationInput
): Promise<ActionResult> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  // Only admin/manager can reassign
  if (auth.role !== "admin" && auth.role !== "manager") {
    return { success: false, error: "Only admins and managers can reassign conversations" };
  }

  const parsed = reassignConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Verify the target LO belongs to the same org (if not null)
  if (parsed.data.loanOfficerId) {
    const supabase = createUntypedAdminClient();
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("id", parsed.data.loanOfficerId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (!targetUser) {
      return { success: false, error: "Selected team member not found" };
    }
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_conversations")
    .update({ assigned_lo_id: parsed.data.loanOfficerId })
    .eq("id", parsed.data.conversationId)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to reassign conversation" };
  }

  revalidatePath("/dashboard/messages");
  return { success: true };
}

// ── Get Org Team Members (for assignment dropdown) ──────────────────

export interface TeamMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export async function getTeamMembers(): Promise<ActionResult<TeamMember[]>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("organization_id", auth.organizationId)
    .order("full_name", { ascending: true });

  if (error) {
    return { success: false, error: "Failed to load team members" };
  }

  const members: TeamMember[] = (data ?? []).map(
    (u: { id: string; full_name: string | null; avatar_url: string | null }) => ({
      id: u.id,
      fullName: u.full_name ?? "Unknown",
      avatarUrl: u.avatar_url,
    })
  );

  return { success: true, data: members };
}

// ── Get Total Unread Count (for nav badge) ──────────────────────────

export async function getTotalUnreadCount(): Promise<ActionResult<number>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_conversations")
    .select("unread_count")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .gt("unread_count", 0);

  if (error) {
    return { success: false, error: "Failed to get unread count" };
  }

  const total = (data ?? []).reduce(
    (sum: number, c: { unread_count: number }) => sum + c.unread_count,
    0
  );

  return { success: true, data: total };
}

