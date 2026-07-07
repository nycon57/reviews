"use server";

/**
 * Client-callable, authorization-aware wrappers over B1's contact service
 * (actions.ts). That module is a server-only service layer — deliberately not a
 * "use server" boundary and it does not authorize the caller (except erase). The
 * Contacts UI needs Server Actions it can invoke directly, so this thin module
 * adds the missing pieces: it resolves the session, enforces org-scope + role,
 * and then delegates. It contains NO suppression/erasure logic of its own.
 */
import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  suppressContact,
  reinstateContact,
  reassignContactOwner,
  eraseContact,
} from "@/lib/contacts/actions";

export type ContactActionResult =
  | { success: true }
  | { success: false; error: string };

interface ContactScope {
  organizationId: string;
  userId: string;
  isManager: boolean;
  ownerUserId: string | null;
}

/**
 * Resolve the caller and confirm the target Contact is in their org. Returns the
 * scope (including whether the caller owns the Contact) so each action can apply
 * its own role rule. Throws on any out-of-scope access.
 */
async function resolveContactScope(contactId: string): Promise<ContactScope> {
  const ctx = await getAccessContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("organization_id, owner_user_id")
    .eq("id", contactId)
    .maybeSingle();
  if (error || !data) throw new Error("Contact not found");

  const row = data as { organization_id: string; owner_user_id: string | null };
  if (row.organization_id !== ctx.organizationId) {
    throw new Error("Contact not found");
  }

  return {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    isManager: ctx.role === "admin" || ctx.role === "manager",
    ownerUserId: row.owner_user_id,
  };
}

/**
 * Toggle the email "do not contact" suppression for a Contact. Allowed for
 * managers/admins and for the professional who owns the Contact.
 */
export async function setContactDoNotContact(
  contactId: string,
  suppress: boolean
): Promise<ContactActionResult> {
  try {
    const scope = await resolveContactScope(contactId);
    if (!scope.isManager && scope.ownerUserId !== scope.userId) {
      return { success: false, error: "You don't have permission to change this Contact." };
    }
    if (suppress) {
      await suppressContact(contactId, "email", "do_not_contact", "dashboard");
    } else {
      await reinstateContact(contactId, "email");
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

/** Reassign a Contact's Owner. Managers/admins only; pass null to unassign. */
export async function reassignContact(
  contactId: string,
  newOwnerUserId: string | null
): Promise<ContactActionResult> {
  try {
    const scope = await resolveContactScope(contactId);
    if (!scope.isManager) {
      return { success: false, error: "Only managers and admins can reassign Contacts." };
    }
    // A supplied owner must belong to the same org.
    if (newOwnerUserId) {
      const supabase = createUntypedAdminClient();
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", newOwnerUserId)
        .eq("organization_id", scope.organizationId)
        .maybeSingle();
      if (!data) {
        return { success: false, error: "That teammate isn't in your organization." };
      }
    }
    await reassignContactOwner(contactId, newOwnerUserId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

/**
 * Erase a Contact (right-to-erasure). Authorization is enforced inside B1's
 * eraseContact (Owner or org admin only — managers are intentionally excluded),
 * gated on the resolved acting user.
 */
export async function eraseContactAction(
  contactId: string
): Promise<ContactActionResult> {
  try {
    const ctx = await getAccessContext();
    if (!ctx) return { success: false, error: "Not authenticated" };
    await eraseContact(contactId, ctx.userId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
