import HomePage from "./_portfolio/HomePage";
import { getPublishedContent } from "./services/content/siteContent";
import { isChatConfigured } from "./services/chat/config";
import { buildStructuredData, personName, serializeJsonLd } from "./services/seo/structuredData";

// Rebuilt whenever a new version is published (see revalidatePath in the publish route),
// and at least once a day as a safety net.
export const revalidate = 86400;

export async function generateMetadata() {
  const { content } = await getPublishedContent();
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
      images: [{ url: "/img/burhanuddin-main.jpg", alt: profile.portrait.alt }],
    },
    twitter: { card: "summary_large_image", title, description: profile.logline, images: ["/img/burhanuddin-main.jpg"] },
  };
}

export default async function Home() {
  const [{ content }, chatEnabled] = await Promise.all([getPublishedContent(), isChatConfigured()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStructuredData(content)) }} />
      <HomePage content={content} chatEnabled={chatEnabled} />
    </>
  );
}
