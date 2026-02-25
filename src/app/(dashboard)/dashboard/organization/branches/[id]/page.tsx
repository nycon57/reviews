import { notFound } from "next/navigation";
import { PencilSimple, Buildings } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getBranchWithTeamMembers } from "@/lib/branches/actions";
import { EditBranchContent } from "./edit-branch-content";

export const metadata = {
  title: "Edit Branch | RepWell",
  description: "Edit branch details and settings",
};

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getBranchWithTeamMembers(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <PencilSimple className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Branch</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/dashboard/organization?tab=branches"
              className="hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1">
                <Buildings className="h-3.5 w-3.5" />
                Branches
              </span>
            </Link>
            <span>/</span>
            <span>{result.data.name}</span>
          </div>
        </div>
      </div>

      {/* Edit content */}
      <EditBranchContent branch={result.data} />
    </div>
  );
}
