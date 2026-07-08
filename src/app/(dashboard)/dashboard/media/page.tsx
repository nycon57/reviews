import { getMediaLibraryData, getMediaStats } from "@/lib/media/actions";
import { MediaManager } from "@/components/media/media-manager";
import { requireIndividualOrEnterpriseAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Media Library",
};

export default async function MediaPage() {
  await requireIndividualOrEnterpriseAdmin();

  const [data, stats] = await Promise.all([
    getMediaLibraryData(),
    getMediaStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Manage all images across your organization — brand assets, team
          photos, location images, and custom uploads.
        </p>
      </div>

      <MediaManager initialData={data} initialStats={stats} />
    </div>
  );
}
