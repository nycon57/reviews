import { notFound } from "next/navigation";
import { PencilSimple, Users } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getOrganizationMemberFull } from "@/lib/organization/actions";
import { unifiedGetUser } from "@/lib/auth/actions";
import { EditMemberContent } from "./edit-member-content";

export const metadata = {
  title: "Edit Team Member | RepWell",
  description: "Edit team member profile and settings",
};

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ member, error }, currentUser] = await Promise.all([
    getOrganizationMemberFull(id),
    unifiedGetUser(),
  ]);

  if (!member || error) {
    notFound();
  }

  const isEditingSelf = currentUser?.id === member.id;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <PencilSimple className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-heading-accent">
            Edit Team Member
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/dashboard/team"
              className="hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Team
              </span>
            </Link>
            <span>/</span>
            <span>{member.full_name || member.email}</span>
          </div>
        </div>
      </div>

      {/* Edit content */}
      <EditMemberContent member={member} isEditingSelf={isEditingSelf} />
    </div>
  );
}
