import { getPublishedContent } from "./services/content/siteContent";
import { getSiteUrl } from "./services/seo/siteUrl";

// Regenerated with the homepage (at least daily), so lastModified follows content changes.
export const revalidate = 86400;

export default async function sitemap() {
  const { publishedAt } = await getPublishedContent();
  return [
    {
      url: getSiteUrl(),
      lastModified: publishedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
