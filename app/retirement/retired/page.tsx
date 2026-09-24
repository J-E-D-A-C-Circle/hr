"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredStaffPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/retirement/staff?tab=retired");
  }, [router]);

  return <div className="p-8 text-xs text-slate-500 animate-pulse">Redirecting to Staff Directory...</div>;
}
