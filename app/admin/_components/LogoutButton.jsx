"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } finally {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-full border border-fg/20 px-4 py-1.5 text-sm font-medium text-fg/80 transition hover:border-fg hover:text-fg disabled:opacity-50"
    >
      {isLoading ? "Logging out…" : "Log out"}
    </button>
  );
}
