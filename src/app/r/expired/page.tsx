import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Link Expired | RepWell",
  robots: { index: false, follow: false },
};

export default function ExpiredLinkPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          This link has expired
        </h1>
        <p className="mb-8 text-gray-600">
          The link you followed is no longer active. Please contact your loan
          officer for a new link.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go to RepWell
        </Link>

        <p className="mt-8 text-xs text-gray-400">
          Powered by RepWell
        </p>
      </div>
    </div>
  );
}
