"use client";

import { DirectoryErrorState } from "@/components/directory/directory-error-state";

export default function DirectoryError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DirectoryErrorState reset={reset} />;
}
