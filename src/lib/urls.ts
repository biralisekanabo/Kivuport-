export function resolveAppUrl(request: Request): string {
  const envUrl = process.env.APP_URL;
  if (envUrl && !envUrl.includes("localhost")) return envUrl.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && !vercelUrl.includes("localhost")) return `https://${vercelUrl}`;

  const origin = new URL(request.url).origin;
  if (!origin.includes("localhost")) return origin;

  return "https://kivuport-seven.vercel.app";
}
