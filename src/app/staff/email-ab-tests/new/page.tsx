import { requirePlatformAdmin } from "@/lib/auth/actions";
import { CreateABTestForm } from "./create-ab-test-form";

export const metadata = {
  title: "Create A/B Test | RepWell",
  description: "Create a new email A/B test to optimize engagement",
};

export default async function CreateABTestPage() {
  await requirePlatformAdmin();

  return (
    <div className="flex-1 space-y-6">
      <CreateABTestForm />
    </div>
  );
}
