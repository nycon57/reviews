"use client";

import { PublicProfileError } from "@/components/public-profile/profile-error";

export default function BranchProfileError({ reset }: { reset: () => void }) {
  return (
    <PublicProfileError
      reset={reset}
      title="We could not load this branch"
      message="The branch profile had trouble loading. Please try again."
    />
  );
}
