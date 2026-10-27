import { cookies } from "next/headers";
import { checkSession } from "../services/auth/checkSession";
import AdminLockScreen from "./_components/AdminLockScreen";
import LogoutButton from "./_components/LogoutButton";

const COOKIE_NAME = "admin-auth";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  const isAuthenticated = checkSession(sessionCookie?.value);

  if (!isAuthenticated) {
    return <AdminLockScreen />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 md:px-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Dashboard Control Center
            </h1>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-sm text-slate-500 md:text-base">
              Manage documents, assets, and upcoming portfolio updates from this
              panel.
            </p>
            <LogoutButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}

