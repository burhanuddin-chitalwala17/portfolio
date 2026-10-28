import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, checkSession } from "../services/auth/checkSession";
import AdminLockScreen from "./_components/AdminLockScreen";
import LogoutButton from "./_components/LogoutButton";
import AdminNav from "./_components/AdminNav";
import { listVisitorQueries, QUERY_STATUSES } from "../services/queries/visitorQueries";
import { withTimeout } from "../services/db/client";

const COOKIE_NAME = ADMIN_COOKIE_NAME;

// Admin pages read the session and the database on every request; never pre-render them at build time.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  const isAuthenticated = checkSession(sessionCookie?.value);

  if (!isAuthenticated) {
    return <AdminLockScreen />;
  }

  const openQueries = (await withTimeout(listVisitorQueries(), 5000).catch(() => [])).filter(
    (query) => query.status === QUERY_STATUSES.OPEN
  ).length;

  return (
    <div className="theme-light min-h-screen w-full bg-canvas text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 md:px-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-fg/60">
              Admin
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Dashboard Control Center
            </h1>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-sm text-fg/60 md:text-base">
              Manage documents, assets, and upcoming portfolio updates from this
              panel.
            </p>
            <LogoutButton />
          </div>
        </header>

        <AdminNav openQueries={openQueries} />

        <main className="flex flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}

