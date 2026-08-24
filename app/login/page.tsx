"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center text-white space-y-2">
        <h1 className="text-xl font-bold">Accessing TempStaff Portal...</h1>
        <p className="text-xs text-slate-400">Redirecting to Dashboard</p>
      </div>
    </div>
  );
}
