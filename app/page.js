import Portfolio from "./_portfolio/Portfolio";
import { getPublishedContent } from "./services/content/siteContent";
import { isChatConfigured } from "./services/chat/config";

// Rebuilt whenever a new version is published (see revalidatePath in the publish route),
// and at least once a day as a safety net.
export const revalidate = 86400;

export default async function Home() {
  const { content } = await getPublishedContent();
  return <Portfolio content={content} chatEnabled={await isChatConfigured()} />;
}
