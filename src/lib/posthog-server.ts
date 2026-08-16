import { PostHog } from "posthog-node";

/** The slice of the PostHog client this module actually calls. */
type PostHogEventClient = Pick<PostHog, "captureImmediate" | "identifyImmediate">;

let posthogClient: PostHog | null = null;
let noopPostHogClient: PostHogEventClient | null = null;

type PostHogProperties = Record<string, unknown>;
type PostHogGroups = Record<string, string | number>;

interface CapturePostHogEventInput {
  distinctId: string;
  event: string;
  properties?: PostHogProperties;
  groups?: PostHogGroups;
  logContext?: string;
}

export function getPostHogClient(): PostHogEventClient {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken) {
    if (!noopPostHogClient) {
      noopPostHogClient = {
        captureImmediate: async () => undefined,
        identifyImmediate: async () => undefined,
      };
    }

    return noopPostHogClient;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(projectToken, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function capturePostHogEvent({
  distinctId,
  event,
  properties,
  groups,
  logContext = event,
}: CapturePostHogEventInput): Promise<void> {
  try {
    await getPostHogClient().captureImmediate({
      distinctId,
      event,
      properties,
      groups,
    });
  } catch (error) {
    console.error(`Failed to record PostHog event (${logContext}):`, error);
  }
}
