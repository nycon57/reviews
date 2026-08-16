export interface CookieOptions {
  path?: string;
  maxAge?: number;
  sameSite?: "Strict" | "Lax" | "None";
  secure?: boolean;
}

export function setCookie(
  name: string,
  value: string,
  {
    path = "/",
    maxAge,
    sameSite = "Lax",
    secure = typeof window !== "undefined" && window.location.protocol === "https:",
  }: CookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];

  if (typeof maxAge === "number") {
    parts.push(`Max-Age=${maxAge}`);
  }

  if (secure) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}
