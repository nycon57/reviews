import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url, role")
    .eq("id", authUser.id)
    .single();

  const user = {
    name: profile?.full_name || authUser.user_metadata?.full_name || "User",
    email: authUser.email || "",
    avatar: profile?.avatar_url || undefined,
    initials: getInitials(profile?.full_name || authUser.user_metadata?.full_name),
  };

  return (
    <DashboardLayout user={user} onSignOut={signOut}>
      {children}
    </DashboardLayout>
  );
}
