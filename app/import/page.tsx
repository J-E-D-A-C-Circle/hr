"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImportPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/payslip");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white text-xs font-semibold">
      Redirecting to Staff Payslip Generator...
    </div>
  );
}
