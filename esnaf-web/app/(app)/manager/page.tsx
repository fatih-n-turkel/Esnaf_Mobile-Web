"use client";

import { useAuth } from "@/store/auth";

export default function ManagerPage() {
  const user = useAuth((state) => state.user);

  if (user?.role !== "MÜDÜR") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece müdür kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Müdür Sayfası</h1>
      <p className="text-sm text-zinc-500">Operasyon özetleri, ekip yönetimi ve satış kontrolleri.</p>
    </div>
  );
}
