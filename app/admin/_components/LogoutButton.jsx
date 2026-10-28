"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { adminRequest } from "../_lib/adminRequest";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await adminRequest("/api/admin/auth", { method: "DELETE" });
    } catch (error) {
      // The session cookie expires on its own; refreshing shows whichever state applies.
      console.error("Logging out failed:", error);
    } finally {
      router.refresh();
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "Logging out…" : "Log out"}
    </Button>
  );
}
