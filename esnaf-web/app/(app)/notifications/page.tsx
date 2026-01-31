"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { branchLabel } from "@/lib/branches";
import { Branch } from "@/lib/types";

async function fetchNotifications() {
  const r = await fetch("/api/notifications", { cache: "no-store" });
  return r.json();
}

async function fetchBranches() {
  const r = await fetch("/api/branches", { cache: "no-store" });
  return r.json();
}

async function markRead(ids: string[]) {
  const r = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return r.json();
}

export default function NotificationsPage() {
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const { data: branchData } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const qc = useQueryClient();
  const user = useAuth((state) => state.user);
  const notifications: Notification[] = data?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];

  const scoped = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => {
      if (user.role === "ADMİN") return true;
      if (n.scope === "GLOBAL") return true;
      if (n.scope === "BRANCH") return n.branchId === user.branchId;
      if (n.scope === "USER") return n.userId === user.id;
      return false;
    });
  }, [notifications, user]);

  useEffect(() => {
    const unreadIds = scoped.filter((n) => !n.readAt).map((n) => n.id);
    if (!unreadIds.length) return;
    markRead(unreadIds).then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
  }, [qc, scoped]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Bildirimler</h1>
        <p className="text-sm text-zinc-500">Kritik stok, satış özeti ve ürün performans uyarıları.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Bildirim Akışı</div>
        <div className="space-y-2 text-sm">
          {scoped.map((note) => (
            <div key={note.id} className="rounded-xl border bg-zinc-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{note.title}</div>
                <span className="text-[11px] text-zinc-500">
                  {new Date(note.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">{note.message}</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {note.scope === "BRANCH" ? branchLabel(branches, note.branchId) : "Genel"}
              </div>
            </div>
          ))}
          {!scoped.length && <div className="text-sm text-zinc-500">Bildirim bulunamadı.</div>}
        </div>
      </div>
    </div>
  );
}
