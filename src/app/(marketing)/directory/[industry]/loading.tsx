import { DirectorySkeleton } from "@/components/directory/directory-skeleton";

export default function IndustryDirectoryLoading() {
  return (
    <div className="bg-background">
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DirectorySkeleton />
        </div>
      </section>
    </div>
  );
}
