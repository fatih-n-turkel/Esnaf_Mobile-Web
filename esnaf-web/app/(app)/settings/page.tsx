"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "@/lib/types";
import { demoUsers, roleLabel } from "@/lib/auth";
import { useAuth } from "@/store/auth";

async function fetchSettings() {
  const r = await fetch("/api/settings", { cache: "no-store" });
  return r.json();
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const settings: Settings | undefined = data?.item;
  const user = useAuth((state) => state.user);
  const [vatRate, setVatRate] = useState(settings?.defaultVatRate ? String(settings.defaultVatRate * 100) : "");

  useEffect(() => {
    if (!settings) return;
    setVatRate(String(settings.defaultVatRate * 100));
  }, [settings]);

  async function saveVat() {
    const rate = Number(vatRate) / 100;
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultVatRate: rate }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "KDV oranı güncellenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ayarlar</h1>
        <p className="text-sm text-zinc-500">KDV varsayılanı ve kullanıcı yetkilendirme.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-medium mb-2">KDV Varsayılan Oranı</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Örn: 10"
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
          />
          <span className="text-xs text-zinc-500">% (örn: 10 = %10)</span>
          <button
            type="button"
            onClick={saveVat}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
          >
            Kaydet
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-medium mb-2">Kullanıcı & Yetkilendirme</div>
        {user?.role !== "ADMİN" ? (
          <div className="text-sm text-zinc-500">Bu bölümü sadece admin kullanıcılar görüntüleyebilir.</div>
        ) : (
          <div className="space-y-2">
            {demoUsers.map((demo) => (
              <div key={demo.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{demo.name}</div>
                  <div className="text-xs text-zinc-500">@{demo.username}</div>
                </div>
                <span className="text-xs rounded-full bg-zinc-100 px-2 py-1">{roleLabel(demo.role)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
