import { DirectorySkeleton } from "@/components/directory/directory-skeleton";
import { getDirectoryContentSectionClassName } from "@/components/directory/directory-page-shell";

interface DirectoryLoadingShellProps {
  isIndustryPage?: boolean;
}

export function DirectoryLoadingShell({
  isIndustryPage = false,
}: DirectoryLoadingShellProps) {
  return (
    <div className="bg-background">
      <section className={getDirectoryContentSectionClassName(isIndustryPage)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DirectorySkeleton />
        </div>
      </section>
    </div>
  );
}

export function IndustryDirectoryLoadingShell() {
  return <DirectoryLoadingShell isIndustryPage />;
}
