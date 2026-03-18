/** Shared accept config — single source of truth for allowed image types */
export const EMAIL_IMAGE_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
  "image/webp": [".webp"],
} as const;

export const EMAIL_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB

/** Comma-separated accept string for native file inputs */
export const EMAIL_IMAGE_ACCEPT_STRING = Object.keys(EMAIL_IMAGE_ACCEPT).join(",");
