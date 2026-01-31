"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PersonnelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sales/quick");
  }, [router]);

  return null;
}
