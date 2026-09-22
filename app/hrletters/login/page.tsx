"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HrLettersLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?system=hrletters");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}
