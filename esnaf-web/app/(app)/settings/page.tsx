"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DemoUser, Settings } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { withBusinessId } from "@/lib/tenant";

async function fetchSettings(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/settings", businessId), { cache: "no-store" });
  return r.json();
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const user = useAuth((state) => state.user);
  const businessId = user?.role === "YONETIM" ? null : user?.businessId ?? null;
  const { data } = useQuery({
    queryKey: ["settings", businessId],
    queryFn: () => fetchSettings(businessId),
  });
  const settings: Settings | undefined = data?.item;
  const canEdit = user?.role === "ADMİN" || user?.role === "MÜDÜR";
  const isPersonnel = user?.role === "PERSONEL";
  const [vatRate, setVatRate] = useState(settings?.defaultVatRate ? String(settings.defaultVatRate * 100) : "");
  const [posFeeType, setPosFeeType] = useState(settings?.posFeeType ?? "RATE");
  const [posFeeValue, setPosFeeValue] = useState(
    settings ? String(settings.posFeeType === "RATE" ? settings.posFeeValue * 100 : settings.posFeeValue) : ""
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
    const r = await fetch(withBusinessId("/api/settings", businessId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultVatRate: rate }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "KDV oranı güncellenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["settings", businessId] });
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
    const r = await fetch(withBusinessId("/api/settings", businessId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultVatRate: safeVatRate, posFeeType, posFeeValue: nextValue }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "POS komisyonu güncellenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["settings", businessId] });
  }

  async function savePassword() {
    if (!user) {
      alert("Şifre güncellemek için tekrar giriş yapın.");
      return;
    }
    if (!currentPassword.trim()) {
      alert("Mevcut şifrenizi girin.");
      return;
    }
    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 4 || trimmedNew.length > 32) {
      alert("Yeni şifre 4-32 karakter arasında olmalı.");
      return;
    }
    if (trimmedNew !== confirmPassword.trim()) {
      alert("Yeni şifreler eşleşmiyor.");
      return;
    }
    setIsSavingPassword(true);
    const rUsers = await fetch(withBusinessId("/api/users", businessId), { cache: "no-store" });
    if (!rUsers.ok) {
      setIsSavingPassword(false);
      alert("Kullanıcılar alınamadı.");
      return;
    }
    const usersPayload = await rUsers.json().catch(() => ({}));
    const users: DemoUser[] = Array.isArray(usersPayload.items) ? usersPayload.items : [];
    const targetIndex = users.findIndex((item) => item.id === user.id);
    if (targetIndex === -1) {
      setIsSavingPassword(false);
      alert("Kullanıcı bulunamadı.");
      return;
    }
    if (users[targetIndex]?.password !== currentPassword.trim()) {
      setIsSavingPassword(false);
      alert("Mevcut şifre hatalı.");
      return;
    }
    const nextUsers = users.map((item) =>
      item.id === user.id ? { ...item, password: trimmedNew } : item
    );
    const r = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: nextUsers }),
    });
    setIsSavingPassword(false);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "Şifre güncellenemedi.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert("Şifreniz güncellendi.");
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

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Şifre Değiştir</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Mevcut şifre"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Yeni şifre (4-32 karakter)"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Yeni şifre tekrar"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">Şifre uzunluğu 4 ile 32 karakter arasında olmalı.</p>
          <button
            type="button"
            onClick={savePassword}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm disabled:opacity-50"
            disabled={isSavingPassword}
          >
            {isSavingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </div>
      </div>

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
