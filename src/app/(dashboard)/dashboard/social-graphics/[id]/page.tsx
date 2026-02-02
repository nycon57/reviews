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

  // Fetch the first associated review for caption generation context
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
    <div className="flex-1 py-8">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        }
      >
        <GraphicEditorLoader id={id} />
      </Suspense>
    </div>
  );
}
