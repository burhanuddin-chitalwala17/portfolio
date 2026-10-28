import { getSiteUrl } from "./services/seo/siteUrl";

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/preview", "/api"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
