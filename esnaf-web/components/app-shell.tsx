"use client";

import SidebarNav from "./sidebar-nav";
import Topbar from "./topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
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
