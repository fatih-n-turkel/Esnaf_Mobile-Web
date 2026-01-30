"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Category, Product, Settings } from "@/lib/types";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

async function fetchCategories() {
  const r = await fetch("/api/categories", { cache: "no-store" });
  return r.json();
}

async function fetchSettings() {
  const r = await fetch("/api/settings", { cache: "no-store" });
  return r.json();
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: categoryData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: settingsData } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const products: Product[] = data?.items ?? [];
  const categories: Category[] = categoryData?.items ?? [];
  const settings: Settings | undefined = settingsData?.item;

  const [form, setForm] = useState({
    name: "",
    category: "",
    salePrice: "",
    costPrice: "",
    stockOnHand: "",
    criticalStockLevel: "",
    vatRate: "",
  });

  const vatDefault = useMemo(() => (settings?.defaultVatRate ?? 0.2) * 100, [settings]);

  async function addProduct() {
    const payload = {
      name: form.name,
      category: form.category,
      salePrice: Number(form.salePrice),
      costPrice: Number(form.costPrice),
      stockOnHand: Number(form.stockOnHand),
      criticalStockLevel: Number(form.criticalStockLevel || 0),
      vatRate: form.vatRate ? Number(form.vatRate) / 100 : undefined,
    };

    const r = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "Ürün eklenemedi.");
      return;
    }

    setForm({
      name: "",
      category: "",
      salePrice: "",
      costPrice: "",
      stockOnHand: "",
      criticalStockLevel: "",
      vatRate: "",
    });

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["products"] }),
      qc.invalidateQueries({ queryKey: ["categories"] }),
    ]);
  }

  async function addCategory(name: string) {
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "Kategori eklenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ürünler</h1>
        <p className="text-sm text-zinc-500">Ürün adları, kategori yönetimi ve yeni ürün ekleme.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-medium mb-3">Ürün Listesi</div>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.category ?? "Kategori yok"}</div>
                </div>
                <div className="text-xs text-zinc-500">KDV {(p.vatRate * 100).toFixed(0)}%</div>
              </div>
            ))}
            {!products.length && <div className="text-sm text-zinc-500">Henüz ürün yok.</div>}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-medium mb-3">Yeni Ürün Ekle</div>
          <div className="grid gap-2">
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Ürün adı"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="Kategori (ör. İçecek)"
              list="category-list"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
            <datalist id="category-list">
              {categories.map((category) => (
                <option key={category.id} value={category.name} />
              ))}
            </datalist>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="Satış fiyatı"
                value={form.salePrice}
                onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="Maliyet"
                value={form.costPrice}
                onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="Stok"
                value={form.stockOnHand}
                onChange={(event) => setForm({ ...form, stockOnHand: event.target.value })}
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="Kritik stok"
                value={form.criticalStockLevel}
                onChange={(event) => setForm({ ...form, criticalStockLevel: event.target.value })}
              />
            </div>
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder={`KDV oranı (varsayılan %${vatDefault.toFixed(0)})`}
              value={form.vatRate}
              onChange={(event) => setForm({ ...form, vatRate: event.target.value })}
            />
            <button
              type="button"
              onClick={addProduct}
              className="rounded-xl bg-zinc-900 text-white py-2 text-sm font-semibold"
            >
              Ürünü Kaydet
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-medium">Kategoriler</div>
            <div className="text-xs text-zinc-500">Ürünler için kategori ekleyin.</div>
          </div>
          <CategoryAdder onAdd={addCategory} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="rounded-full border px-3 py-1 text-xs">
              {category.name}
            </span>
          ))}
          {!categories.length && <span className="text-xs text-zinc-500">Kategori yok.</span>}
        </div>
      </div>
    </div>
  );
}

function CategoryAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2">
      <input
        className="rounded-lg border px-3 py-2 text-sm"
        placeholder="Kategori adı"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="button"
        onClick={() => {
          const trimmed = value.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setValue("");
        }}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
      >
        Ekle
      </button>
    </div>
  );
}
