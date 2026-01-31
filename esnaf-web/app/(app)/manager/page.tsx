"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/auth";
import { getDemoUsers, saveDemoUsers } from "@/lib/auth";
import { Branch, DemoUser } from "@/lib/types";
import { branchLabel } from "@/lib/branches";

export default function ManagerPage() {
  const user = useAuth((state) => state.user);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: "", username: "", branchId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const branchId = user?.branchId ?? "";

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

  const manageableBranches = useMemo(
    () => branches.filter((branch) => branch.id === branchId),
    [branches, branchId]
  );

  const personnel = useMemo(
    () =>
      users.filter(
        (person) => person.role === "PERSONEL" && person.branchId === branchId
      ),
    [users, branchId]
  );

  if (user?.role !== "MÜDÜR") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece müdür kullanıcılar içindir.</div>;
  }

  async function submitPersonnel() {
    if (!form.name.trim() || !form.username.trim()) return;
    const targetBranch = form.branchId || branchId;
    if (!targetBranch) return;

    let next: DemoUser[];
    if (editingId) {
      next = users.map((u) =>
        u.id === editingId
          ? {
              ...u,
              name: form.name.trim(),
              username: form.username.trim(),
              branchId: targetBranch,
            }
          : u
      );
    } else {
      const created: DemoUser = {
        id: `demo-${Date.now()}`,
        username: form.username.trim(),
        password: "1234",
        name: form.name.trim(),
        role: "PERSONEL",
        landingPath: "/personnel",
        branchId: targetBranch,
      };
      next = [created, ...users];
    }
    const saved = await saveDemoUsers(next);
    setUsers(saved);
    setForm({ name: "", username: "", branchId: "" });
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Müdür Sayfası</h1>
        <p className="text-sm text-zinc-500">Operasyon özetleri, ekip yönetimi ve satış kontrolleri.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Personel Yönetimi</div>
          <p className="text-xs text-zinc-500">
            {branchLabel(branches, branchId)} için personel ekleyebilir veya güncelleyebilirsiniz.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_auto]">
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
            value={form.branchId || branchId}
            onChange={(event) => setForm({ ...form, branchId: event.target.value })}
            disabled={manageableBranches.length <= 1}
          >
            {manageableBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={submitPersonnel}
          >
            {editingId ? "Güncelle" : "Personel Ekle"}
          </button>
        </div>

        <div className="space-y-2">
          {personnel.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{person.name}</div>
                <div className="text-xs text-zinc-500">@{person.username}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(person.id);
                    setForm({
                      name: person.name,
                      username: person.username,
                      branchId: person.branchId ?? branchId,
                    });
                  }}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const next = users.filter((u) => u.id !== person.id);
                    const saved = await saveDemoUsers(next);
                    setUsers(saved);
                    if (editingId === person.id) {
                      setEditingId(null);
                      setForm({ name: "", username: "", branchId: "" });
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          {!personnel.length && <div className="text-sm text-zinc-500">Henüz personel yok.</div>}
        </div>
      </div>
    </div>
  );
}
