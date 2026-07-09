import { Suspense } from "react";
import { ImageSquare, LinkSimple, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UrlSyncedTabs } from "@/components/shared/url-synced-tabs";
import { ShareStudioCards } from "@/components/dashboard/share-studio-cards";
import { AssetsGallery } from "@/components/share-studio/assets-gallery";
import { SmartLinksTable } from "@/components/share-studio/smart-links-table";
import { checkPageAccess } from "@/lib/access";
import {
  SHARE_STUDIO_ASSETS_PAGE_SIZE,
  SHARE_STUDIO_HUB_PATH,
  SMART_LINKS_PAGE_SIZE,
  getShareStudioHubSmartLinksData,
  listShareStudioAssetsForOrganization,
  normalizeAssetFilter,
  normalizeSmartLinkStatus,
} from "@/lib/share-studio/hub-service";
import type { ShareStudioAssetsResult } from "@/lib/share-studio/hub-types";

export const metadata = {
  title: "Share Studio | RepWell",
  description: "Manage Smart Links and rendered Share Studio assets.",
};

type ShareStudioSearchParams = {
  tab?: string;
  page?: string;
  search?: string;
  status?: string;
  assetPage?: string;
  assetType?: string;
};

interface ShareStudioPageProps {
  searchParams: Promise<ShareStudioSearchParams>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

function emptyAssetsResult(type: ShareStudioAssetsResult["type"]): ShareStudioAssetsResult {
  return {
    items: [],
    page: 1,
    pageSize: SHARE_STUDIO_ASSETS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    type,
  };
}

function TabsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-11 w-full rounded-none" />
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}

export default async function ShareStudioPage({ searchParams }: ShareStudioPageProps) {
  const params = await searchParams;
  // Share Studio is available to individual owners and enterprise manager/admin
  // users. `minRole` only applies to enterprise accounts in the shared guard.
  const ctx = await checkPageAccess({ minRole: "manager" });

  const activeTab = params.tab === "assets" ? "assets" : "smart-links";
  const smartLinkStatus = normalizeSmartLinkStatus(params.status);
  const assetType = normalizeAssetFilter(params.assetType);

  const [hubData, assetsData] = await Promise.all([
    getShareStudioHubSmartLinksData(ctx.organizationId, {
      page: parsePage(params.page),
      pageSize: SMART_LINKS_PAGE_SIZE,
      search: params.search,
      status: smartLinkStatus,
    }),
    activeTab === "assets"
      ? listShareStudioAssetsForOrganization(ctx.organizationId, {
          page: parsePage(params.assetPage),
          pageSize: SHARE_STUDIO_ASSETS_PAGE_SIZE,
          type: assetType,
        })
      : Promise.resolve(emptyAssetsResult(assetType)),
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ShareNetwork className="h-6 w-6 text-repwell-teal-300" weight="duotone" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
              Share Studio
            </h1>
            <p className="max-w-2xl text-sm leading-snug text-repwell-teal-300">
              Manage public Smart Links, inspect link performance, and collect completed
              share assets from across the organization.
            </p>
          </div>
        </div>
      </div>

      <ShareStudioCards data={hubData.cards} />

      <Suspense fallback={<TabsFallback />}>
        <UrlSyncedTabs
          basePath={SHARE_STUDIO_HUB_PATH}
          defaultTab="smart-links"
          tabs={[
            {
              value: "smart-links",
              label: "Smart Links",
              icon: <LinkSimple className="h-4 w-4" />,
            },
            {
              value: "assets",
              label: "Assets",
              icon: <ImageSquare className="h-4 w-4" />,
            },
          ]}
        >
          <TabsContent value="smart-links" className="m-0 space-y-6">
            <SmartLinksTable
              initialData={hubData.smartLinks}
              basePath={SHARE_STUDIO_HUB_PATH}
            />
          </TabsContent>
          <TabsContent value="assets" className="m-0 space-y-6">
            <AssetsGallery
              initialData={assetsData}
              basePath={SHARE_STUDIO_HUB_PATH}
            />
          </TabsContent>
        </UrlSyncedTabs>
      </Suspense>
    </div>
  );
}
