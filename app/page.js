import HomePage from "./_portfolio/HomePage";
import { getPublishedContent } from "./services/content/siteContent";
import { isChatConfigured } from "./services/chat/config";
import { hasSiteResume } from "./services/documents/siteResume";
import { getSitePortrait, withSitePortrait } from "./services/sitePhoto/sitePhoto";
import { buildStructuredData, personName, serializeJsonLd } from "./services/seo/structuredData";

// Rebuilt whenever a new version is published (see revalidatePath in the publish route),
// and at least once a day as a safety net.
export const revalidate = 86400;

export async function generateMetadata() {
  const [{ content }, portrait] = await Promise.all([getPublishedContent(), getSitePortrait()]);
  const { profile } = content;
  const name = personName(profile);
  const title = `${name} — ${profile.role}`;
  return {
    title: { absolute: title },
    description: profile.logline,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      title,
      description: profile.logline,
      url: "/",
      siteName: name,
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" "),
      images: [{ url: portrait.src, alt: portrait.alt }],
    },
    twitter: { card: "summary_large_image", title, description: profile.logline, images: [portrait.src] },
  };
}

export default async function Home() {
  const [{ content: published }, chatEnabled, hasResume, portrait] = await Promise.all([
    getPublishedContent(),
    isChatConfigured(),
    hasSiteResume(),
    getSitePortrait(),
  ]);
  // The photo comes from Admin → Content (or the built-in one), not from the content version.
  const content = withSitePortrait(published, portrait);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStructuredData(content)) }} />
      <HomePage content={content} chatEnabled={chatEnabled} hasResume={hasResume} />
    </>
  );
}
