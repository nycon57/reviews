import { DirectorySkeleton } from "@/components/directory/directory-skeleton";

export default function DirectoryLoading() {
  return (
    <div className="bg-background">
      <section className="pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DirectorySkeleton />
        </div>
      </section>
    </div>
  );
}
