"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserManagementRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users");
  }, [router]);

  return <div className="p-8 text-xs text-slate-500 animate-pulse">Redirecting to Super Admin User Management...</div>;
}
