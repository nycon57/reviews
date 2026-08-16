import {
  buildProfileOpenGraphImage,
  type ProfileOpenGraphCardData,
} from "./profile-card";

type CardResult<TData> = {
  success: boolean;
  data?: TData;
};

interface ProfileOgRouteConfig<TData> {
  fetch: (slug: string) => Promise<CardResult<TData>>;
  toCard: (data: TData) => ProfileOpenGraphCardData;
  generic: ProfileOpenGraphCardData;
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export function createProfileOgRoute<TData>({
  fetch,
  toCard,
  generic,
}: ProfileOgRouteConfig<TData>) {
  return async function OpenGraphImage({ params }: RouteParams) {
    const { slug } = await params;
    const result = await fetch(slug);

    if (!result.success || !result.data) {
      return buildProfileOpenGraphImage(generic);
    }

    return buildProfileOpenGraphImage(toCard(result.data));
  };
}
