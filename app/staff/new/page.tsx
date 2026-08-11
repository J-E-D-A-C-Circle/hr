"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewStaffPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff?add=true");
  }, [router]);

  return null;
}
