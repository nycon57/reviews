import type { Metadata } from "next";
import Link from "next/link";
import { verifyDirectReview } from "@/lib/reviews/verification";
import { startReviewVideoUpsell } from "@/lib/reviews/upsell-actions";

export const metadata: Metadata = {
  title: "Confirm Your Review",
  robots: { index: false, follow: false },
};

export default async function ReviewVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyDirectReview(token);

  if (result.outcome === "invalid") {
    return (
      <VerifyShell
        title="This link is invalid or already used"
        body="Verification links work once. If you already confirmed your review, there is nothing more to do. If you think something went wrong, you can submit your review again from the professional's profile page."
      />
    );
  }

  const professionalName = result.professionalName ?? "the professional";

  if (result.outcome === "published") {
    const professionalFirstName = professionalName.split(" ")[0];

    return (
      <VerifyShell
        title="Your review is live"
        body={`Thank you for confirming your email. Your review of ${professionalName} is now published and visible to others.`}
      >
        {result.showVideoUpsell ? (
          <div className="rounded-xl bg-repwell-sage-50 px-6 py-8 sm:px-8">
            <h2 className="font-display text-xl text-repwell-teal-500">
              Want to make it 10x more powerful?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-repwell-teal-400">
              Record a quick video version. It takes about a minute and means
              the world to {professionalFirstName}.
            </p>
            <form action={startReviewVideoUpsell} className="mt-6">
              <input type="hidden" name="reviewId" value={result.reviewId} />
              {result.professionalSlug && (
                <input
                  type="hidden"
                  name="professionalSlug"
                  value={result.professionalSlug}
                />
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-repwell-teal-300 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-repwell-teal-400 focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2"
              >
                Record a video
              </button>
            </form>
            {result.professionalSlug && (
              <Link
                href={`/pro/${result.professionalSlug}`}
                className="mt-4 inline-block text-sm text-repwell-teal-400 underline-offset-4 transition-colors hover:text-repwell-teal-500 hover:underline"
              >
                Maybe later
              </Link>
            )}
          </div>
        ) : (
          result.professionalSlug && (
            <Link
              href={`/pro/${result.professionalSlug}`}
              className="inline-flex items-center justify-center rounded-md bg-repwell-teal-300 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-repwell-teal-400 focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2"
            >
              View the profile
            </Link>
          )
        )}
      </VerifyShell>
    );
  }

  return (
    <VerifyShell
      title="Thanks, we're taking a quick look"
      body={`Your email is confirmed. Our team is giving your review of ${professionalName} a quick look before it goes live, which usually takes less than a day. No further action is needed from you.`}
    />
  );
}

function VerifyShell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-repwell-sage-50 px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-repwell-sage-200 bg-white px-8 py-12 text-center shadow-sm sm:px-12">
        <h1 className="font-display text-3xl text-repwell-teal-500">{title}</h1>
        <p className="mt-5 text-base leading-relaxed text-repwell-teal-400">
          {body}
        </p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </main>
  );
}
