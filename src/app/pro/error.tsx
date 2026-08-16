"use client";

import { PublicProfileError } from "@/components/public-profile/profile-error";

export default function ProError({ reset }: { reset: () => void }) {
  return (
    <PublicProfileError
      reset={reset}
      title="We could not load the team directory"
      message="The professional directory had trouble loading. Please try again."
    />
  );
}
