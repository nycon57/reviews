import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { GraphicEditor } from "@/components/social-graphics/graphic-editor";
import {
  getGraphic,
  getOrgName,
  getReviewsForGeneration,
} from "@/lib/social-graphics/actions";

export const metadata = {
  title: "Edit Graphic | Social Graphics | RepWell",
  description: "Edit a social proof graphic",
};

async function GraphicEditorLoader({ id }: { id: string }) {
  const [graphicResult, orgNameResult] = await Promise.all([
    getGraphic(id),
    getOrgName(),
  ]);

  if (!graphicResult.success) {
    notFound();
  }

  const graphic = graphicResult.data;

  let reviewText: string | null = null;
  let customerName: string | null = null;
  let rating: number | undefined;

  if (graphic.review_ids && graphic.review_ids.length > 0) {
    const reviewResult = await getReviewsForGeneration({
      reviewIds: [graphic.review_ids[0]],
    });
    if (reviewResult.success && reviewResult.data.length > 0) {
      const review = reviewResult.data[0];
      reviewText = review.text;
      customerName = review.customer_name;
      rating = review.rating;
    }
  }

  return (
    <GraphicEditor
      graphic={graphic}
      orgName={orgNameResult.success ? orgNameResult.data : "Your Company"}
      reviewText={reviewText}
      customerName={customerName}
      rating={rating}
    />
  );
}

export default async function EditGraphicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] flex-col">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-1">
            <Skeleton className="hidden h-full w-52 lg:block" />
            <Skeleton className="flex-1" />
            <Skeleton className="hidden h-full w-64 lg:block" />
          </div>
        </div>
      }
    >
      <GraphicEditorLoader id={id} />
    </Suspense>
  );
}
