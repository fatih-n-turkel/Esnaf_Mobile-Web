"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/auth";
import { DemoUser, getDemoUsers, roleLabel, saveDemoUsers } from "@/lib/auth";
import { Role } from "@/lib/types";

export default function AdminPage() {
  const user = useAuth((state) => state.user);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [form, setForm] = useState({ name: "", username: "", role: "PERSONEL" as Role });

  const canManage = useMemo(() => user?.role === "ADMİN", [user?.role]);

  useEffect(() => {
    setUsers(getDemoUsers());
  }, []);

  if (!canManage) {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece admin kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Admin Paneli</h1>
        <p className="text-sm text-zinc-500">Yetkilendirme, denetim ve üst düzey ayarlar burada yönetilir.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Kullanıcı & Yetkilendirme</div>
          <p className="text-xs text-zinc-500">
            Admin dışındaki kullanıcılar yetki yönetimini göremez veya düzenleyemez.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.6fr_auto]">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Ad Soyad"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Kullanıcı adı"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
          >
            <option value="ADMİN">Admin</option>
            <option value="MÜDÜR">Müdür</option>
            <option value="PERSONEL">Personel</option>
          </select>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={() => {
              if (!form.name.trim() || !form.username.trim()) return;
              const created: DemoUser = {
                id: `demo-${Date.now()}`,
                username: form.username.trim(),
                password: "1234",
                name: form.name.trim(),
                role: form.role,
                landingPath: form.role === "ADMİN" ? "/admin" : form.role === "MÜDÜR" ? "/manager" : "/personnel",
              };
              const next = [created, ...users];
              setUsers(next);
              saveDemoUsers(next);
              setForm({ name: "", username: "", role: "PERSONEL" });
            }}
          >
            Yetkili Ekle
          </button>
        </div>

        <div className="space-y-2">
          {users.map((demo) => (
            <div key={demo.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{demo.name}</div>
                <div className="text-xs text-zinc-500">@{demo.username}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={demo.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as Role;
                    const next = users.map((u) =>
                      u.id === demo.id
                        ? {
                            ...u,
                            role: nextRole,
                            landingPath: nextRole === "ADMİN" ? "/admin" : nextRole === "MÜDÜR" ? "/manager" : "/personnel",
                          }
                        : u
                    );
                    setUsers(next);
                    saveDemoUsers(next);
                  }}
                  className="rounded-lg border px-2 py-1 text-xs"
                  disabled={demo.id === "user-admin"}
                >
                  <option value="ADMİN">Admin</option>
                  <option value="MÜDÜR">Müdür</option>
                  <option value="PERSONEL">Personel</option>
                </select>
                <span className="text-xs rounded-full bg-zinc-100 px-2 py-1">{roleLabel(demo.role)}</span>
                {demo.id !== "user-admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = users.filter((u) => u.id !== demo.id);
                      setUsers(next);
                      saveDemoUsers(next);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Yetkiyi Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
