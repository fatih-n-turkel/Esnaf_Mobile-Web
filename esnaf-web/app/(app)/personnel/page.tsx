"use client";

import { useAuth } from "@/store/auth";

export default function PersonnelPage() {
  const user = useAuth((state) => state.user);

  if (user?.role !== "PERSONEL") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece personel kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Personel Sayfası</h1>
      <p className="text-sm text-zinc-500">Günlük görevler, hızlı satış ve stok kontrolü.</p>
    </div>
  );
}
