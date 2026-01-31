"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/auth";
import { getDemoUsers, roleLabel, saveDemoUsers } from "@/lib/auth";
import { Branch, DemoUser, Role } from "@/lib/types";
import { branchLabel } from "@/lib/branches";

export default function AdminPage() {
  const user = useAuth((state) => state.user);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    role: "PERSONEL" as Role,
    branchId: "",
    managerId: "",
  });

  const canManage = useMemo(() => user?.role === "ADMİN", [user?.role]);

  useEffect(() => {
    let active = true;
    getDemoUsers().then((list) => {
      if (active) setUsers(list);
    });
    fetch("/api/branches", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (active) setBranches(data.items ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (branches.length > 0 && !form.branchId && form.role !== "ADMİN") {
      setForm((prev) => ({ ...prev, branchId: branches[0].id }));
    }
  }, [branches, form.branchId, form.role]);

  const managers = useMemo(() => users.filter((u) => u.role === "MÜDÜR"), [users]);

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
        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.6fr_0.8fr_0.8fr_auto]">
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
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.branchId}
            onChange={(event) => setForm({ ...form, branchId: event.target.value })}
            disabled={form.role === "ADMİN"}
          >
            <option value="">{form.role === "ADMİN" ? "Bayi yok" : "Bayi seçin"}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.managerId}
            onChange={(event) => setForm({ ...form, managerId: event.target.value })}
            disabled={form.role !== "PERSONEL"}
          >
            <option value="">Müdür seçin</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={async () => {
              if (!form.name.trim() || !form.username.trim()) return;
              if (form.role !== "ADMİN" && !form.branchId) return;
              const created: DemoUser = {
                id: `demo-${Date.now()}`,
                username: form.username.trim(),
                password: "1234",
                name: form.name.trim(),
                role: form.role,
                landingPath: form.role === "PERSONEL" ? "/sales/quick" : "/dashboard",
                branchId: form.role === "ADMİN" ? null : form.branchId,
                managerId: form.role === "PERSONEL" ? form.managerId || null : null,
              };
              const next = [created, ...users];
              const saved = await saveDemoUsers(next);
              setUsers(saved);
              setForm({ name: "", username: "", role: "PERSONEL", branchId: "", managerId: "" });
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
                {demo.role !== "ADMİN" && (
                  <div className="text-xs text-zinc-500">{branchLabel(branches, demo.branchId)}</div>
                )}
                {demo.role === "PERSONEL" && demo.managerId && (
                  <div className="text-[11px] text-zinc-400">
                    Müdür: {users.find((u) => u.id === demo.managerId)?.name ?? "-"}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={demo.role}
                  onChange={async (event) => {
                    const nextRole = event.target.value as Role;
                    const next = users.map((u) =>
                      u.id === demo.id
                        ? {
                            ...u,
                            role: nextRole,
                            landingPath: nextRole === "PERSONEL" ? "/sales/quick" : "/dashboard",
                            branchId: nextRole === "ADMİN" ? null : u.branchId ?? branches[0]?.id ?? null,
                            managerId: nextRole === "PERSONEL" ? u.managerId ?? null : null,
                          }
                        : u
                    );
                    const saved = await saveDemoUsers(next);
                    setUsers(saved);
                  }}
                  className="rounded-lg border px-2 py-1 text-xs"
                  disabled={demo.id === "user-admin"}
                >
                  <option value="ADMİN">Admin</option>
                  <option value="MÜDÜR">Müdür</option>
                  <option value="PERSONEL">Personel</option>
                </select>
                {demo.role !== "ADMİN" && (
                  <select
                    value={demo.branchId ?? ""}
                    onChange={async (event) => {
                      const nextBranch = event.target.value;
                      const next = users.map((u) =>
                        u.id === demo.id
                          ? {
                              ...u,
                              branchId: nextBranch || null,
                            }
                          : u
                      );
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs"
                    disabled={demo.id === "user-admin"}
                  >
                    <option value="">Bayi seç</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
                {demo.role === "PERSONEL" && (
                  <select
                    value={demo.managerId ?? ""}
                    onChange={async (event) => {
                      const nextManagerId = event.target.value;
                      const next = users.map((u) =>
                        u.id === demo.id
                          ? {
                              ...u,
                              managerId: nextManagerId || null,
                            }
                          : u
                      );
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs"
                  >
                    <option value="">Müdür seç</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-xs rounded-full bg-zinc-100 px-2 py-1">{roleLabel(demo.role)}</span>
                {demo.id !== "user-admin" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = users.filter((u) => u.id !== demo.id);
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
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

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Bayi Yönetimi</div>
          <p className="text-xs text-zinc-500">Birden fazla bayi ekleyebilir, müdür ve personelleri bağlayabilirsiniz.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-lg border px-3 py-2 text-sm flex-1"
            placeholder="Bayi adı"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={async () => {
              const name = branchName.trim();
              if (!name) return;
              const res = await fetch("/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              if (!res.ok) return;
              const data = await res.json();
              setBranches((prev) => [data.item, ...prev]);
              setBranchName("");
            }}
          >
            Bayi Ekle
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-xl border px-3 py-2 text-sm">
              <div className="font-medium">{branch.name}</div>
              <div className="text-xs text-zinc-500">{new Date(branch.createdAt).toLocaleDateString("tr-TR")}</div>
            </div>
          ))}
          {!branches.length && <div className="text-sm text-zinc-500">Henüz bayi yok.</div>}
        </div>
      </div>

    </div>
  );
}
