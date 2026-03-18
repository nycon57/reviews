export const MEDIA_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const MEDIA_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
] as const;

/** Dropzone-compatible accept map */
export const MEDIA_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
  "image/webp": [".webp"],
} as const;

/** Comma-separated string for native file inputs */
export const MEDIA_ACCEPT_STRING = MEDIA_ALLOWED_TYPES.join(",");
