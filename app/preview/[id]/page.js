import { notFound } from "next/navigation";
import HomePage from "../../_portfolio/HomePage";
import { isAdminRequest } from "../../services/auth/requireAdmin";
import { getContentVersion, validateContent } from "../../services/content/siteContent";
import { hasSiteResume } from "../../services/documents/siteResume";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Shows the homepage with a draft or older version, for the signed-in admin only. */
export default async function PreviewPage({ params }) {
  if (!(await isAdminRequest())) notFound();
  const { id } = await params;
  const version = await getContentVersion(id).catch(() => null);
  if (!version) notFound();
  const validated = validateContent(version.content);
  if (!validated.ok) notFound();

  return (
    <>
      <p className="fixed inset-x-0 top-0 z-[400] bg-accent px-4 py-1.5 text-center text-xs font-semibold text-on-accent">
        Preview of a {version.status === "published" ? "live" : version.status} version. Visitors can&apos;t see this page.
      </p>
      <HomePage content={validated.content} hasResume={await hasSiteResume()} />
    </>
  );
}
