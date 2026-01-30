"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarNav from "./sidebar-nav";
import Topbar from "./topbar";
import { useAuth } from "@/store/auth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [hydrated, router, user]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex">
        <SidebarNav />
        <div className="flex-1">
          <Topbar />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
