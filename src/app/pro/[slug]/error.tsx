"use client";

import { PublicProfileError } from "@/components/public-profile/profile-error";

export default function ProProfileError({ reset }: { reset: () => void }) {
  return <PublicProfileError reset={reset} />;
}
