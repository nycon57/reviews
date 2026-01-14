import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CardSkeleton } from "@/components/shared";
import { Send } from "lucide-react";
import { SendSurveyForm } from "./send-survey-form";

export const metadata = {
  title: "Send Survey | ReviewHub",
  description: "Manually send survey invitations to customers",
};

async function checkAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  return { role: userData.role };
}

export default async function SendPage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Send Survey</h1>
          <p className="text-muted-foreground">
            Manually send survey invitations to customers
          </p>
        </div>
      </div>

      {/* Send form */}
      <Suspense
        fallback={
          <div className="max-w-2xl">
            <CardSkeleton className="h-[500px]" />
          </div>
        }
      >
        <SendSurveyForm />
      </Suspense>
    </div>
  );
}
