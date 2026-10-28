/**
 * The site's public origin, for canonical URLs, the sitemap and structured data.
 * SITE_URL wins (set it when a custom domain is added); otherwise Vercel's production domain.
 */
export function getSiteUrl() {
  const explicit = process.env.SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
