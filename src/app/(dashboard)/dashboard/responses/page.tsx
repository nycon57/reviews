import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponseApprovalQueue,
  ResponseAnalyticsDashboard,
} from "@/components/reviews";
import { MessageSquare, BarChart3, FileText } from "lucide-react";
import { ResponseTemplatesManager } from "./templates-manager";

export const metadata = {
  title: "Response Management - RepWell",
  description: "Manage review responses, approvals, and templates",
};

export default async function ResponsesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check user role - only managers/admins can access
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["admin", "manager"].includes(userData.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Response Management</h1>
        <p className="text-muted-foreground">
          Manage review responses, approve pending responses, and view analytics
        </p>
      </div>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="approvals" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <ResponseApprovalQueue />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ResponseAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <ResponseTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
