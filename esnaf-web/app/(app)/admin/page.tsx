"use client";

import { useAuth } from "@/store/auth";

export default function AdminPage() {
  const user = useAuth((state) => state.user);

  if (user?.role !== "ADMİN") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece admin kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Admin Paneli</h1>
      <p className="text-sm text-zinc-500">Yetkilendirme, denetim ve üst düzey ayarlar burada yönetilir.</p>
    </div>
  );
}
