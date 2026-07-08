"use client";

import { PublicProfileError } from "@/components/public-profile/profile-error";

export default function OrganizationProfileError({ reset }: { reset: () => void }) {
  return (
    <PublicProfileError
      reset={reset}
      title="We could not load this organization"
      message="The organization profile had trouble loading. Please try again."
    />
  );
}
