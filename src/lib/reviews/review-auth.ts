import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";

export async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) return null;
  if (!userData.organization_id) return null;
  if (!["admin", "manager"].includes(userData.role)) return null;

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
  };
}

export async function requireAnyRole(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) return null;
  if (!userData.organization_id) return null;

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
  };
}
