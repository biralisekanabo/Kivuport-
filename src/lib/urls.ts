export function resolveAppUrl(request: Request): string {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost")) return envUrl.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const forwarded = request.headers.get("x-forwarded-host") || request.headers.get("x-forwarded-origin");
  if (forwarded) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwarded}`.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}
