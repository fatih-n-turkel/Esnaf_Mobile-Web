"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "@/lib/types";
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
  const canEdit = user?.role === "ADMİN" || user?.role === "MÜDÜR";
  const isPersonnel = user?.role === "PERSONEL";
  const [vatRate, setVatRate] = useState(settings?.defaultVatRate ? String(settings.defaultVatRate * 100) : "");
  const [posFeeType, setPosFeeType] = useState(settings?.posFeeType ?? "RATE");
  const [posFeeValue, setPosFeeValue] = useState(
    settings ? String(settings.posFeeType === "RATE" ? settings.posFeeValue * 100 : settings.posFeeValue) : ""
  );

  useEffect(() => {
    if (!settings) return;
    setVatRate(String(settings.defaultVatRate * 100));
    setPosFeeType(settings.posFeeType);
    setPosFeeValue(String(settings.posFeeType === "RATE" ? settings.posFeeValue * 100 : settings.posFeeValue));
  }, [settings]);

  async function saveVat() {
    if (!canEdit) {
      alert("Bu kullanıcı KDV oranını güncelleyemez.");
      return;
    }
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

  async function savePosFee() {
    if (!canEdit) {
      alert("Bu kullanıcı POS komisyonunu güncelleyemez.");
      return;
    }
    const parsedValue = Number(posFeeValue);
    if (Number.isNaN(parsedValue)) {
      alert("Geçerli bir POS komisyonu girin.");
      return;
    }
    const nextValue = posFeeType === "RATE" ? parsedValue / 100 : parsedValue;
    const vatValue = Number(vatRate);
    const safeVatRate = Number.isNaN(vatValue) ? settings?.defaultVatRate ?? 0 : vatValue / 100;
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultVatRate: safeVatRate, posFeeType, posFeeValue: nextValue }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "POS komisyonu güncellenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ayarlar</h1>
        <p className="text-sm text-zinc-500">KDV varsayılanı ve muhasebe parametreleri.</p>
      </div>

      {!isPersonnel && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-medium mb-2">KDV Varsayılan Oranı</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Örn: 10"
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              disabled={!canEdit}
            />
            <span className="text-xs text-zinc-500">% (örn: 10 = %10)</span>
            <button
              type="button"
              onClick={saveVat}
              className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={!canEdit}
            >
              Kaydet
            </button>
          </div>
          {!canEdit && <div className="text-xs text-zinc-500 mt-2">Personel KDV oranını değiştiremez.</div>}
        </div>
      )}

      {!isPersonnel && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <div className="font-medium">Kart Satışı POS Komisyonu</div>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={posFeeType}
              onChange={(event) => setPosFeeType(event.target.value as "RATE" | "FIXED")}
              disabled={!canEdit}
            >
              <option value="RATE">Oran (%)</option>
              <option value="FIXED">Sabit Tutar (₺)</option>
            </select>
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder={posFeeType === "RATE" ? "Örn: 2" : "Örn: 5"}
              value={posFeeValue}
              onChange={(event) => setPosFeeValue(event.target.value)}
              disabled={!canEdit}
            />
            <button
              type="button"
              onClick={savePosFee}
              className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={!canEdit}
            >
              Kaydet
            </button>
          </div>
          <div className="text-xs text-zinc-500">
            {posFeeType === "RATE"
              ? "Kart satışlarında oran bazlı POS gideri uygulanır."
              : "Kart satışlarında sabit POS gideri uygulanır."}
          </div>
          {!canEdit && <div className="text-xs text-zinc-500">Personel POS komisyonunu değiştiremez.</div>}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <div className="font-medium">Hakkında • Açık Kaynak Lisansları</div>
        <p className="text-sm text-zinc-500">
          Ticari kullanım öncesi üçüncü taraf lisanslarını inceleyin.
        </p>
        <a
          href="/THIRD_PARTY_NOTICES.md"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Lisans Metinlerini Aç
        </a>
      </div>

    </div>
  );
}
