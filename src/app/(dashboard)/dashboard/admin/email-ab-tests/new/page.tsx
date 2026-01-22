import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateABTestForm } from "./create-ab-test-form";

export const metadata = {
  title: "Create A/B Test | RepWell",
  description: "Create a new email A/B test to optimize engagement",
};

async function checkAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}

export default async function CreateABTestPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      <CreateABTestForm />
    </div>
  );
}
