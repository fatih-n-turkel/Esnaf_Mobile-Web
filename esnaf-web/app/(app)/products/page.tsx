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

  const [showForm, setShowForm] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({ qrCode: "", vatRate: "" });
  const [form, setForm] = useState({
    name: "",
    category: "",
    salePrice: "",
    costPrice: "",
    stockOnHand: "",
    criticalStockLevel: "",
    vatRate: "",
    qrCode: "",
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
      qrCode: form.qrCode || undefined,
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
      qrCode: "",
    });

    setShowForm(false);

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

  async function openQr(product: Product) {
    setQrBusy(true);
    let next = product;
    if (!product.qrCode) {
      const r = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err?.error ?? "QR oluşturulamadı.");
        setQrBusy(false);
        return;
      }
      const res = await r.json();
      next = res.item;
      await qc.invalidateQueries({ queryKey: ["products"] });
    }
    setQrProduct(next);
    setQrBusy(false);
  }

  const qrValue = qrProduct?.qrCode?.trim();
  const qrImageUrl = qrValue
    ? `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=240`
    : null;
  const qrSvgUrl = qrValue
    ? `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=240&format=svg`
    : null;

  function downloadQrPng() {
    if (!qrImageUrl || !qrProduct) return;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${qrProduct.name}-qr.png`;
    link.click();
  }

  function downloadQrSvg() {
    if (!qrSvgUrl || !qrProduct) return;
    const link = document.createElement("a");
    link.href = qrSvgUrl;
    link.download = `${qrProduct.name}-qr.svg`;
    link.click();
  }

  function printQr() {
    if (!qrImageUrl || !qrProduct) return;
    const printWindow = window.open("", "_blank", "width=480,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>${qrProduct.name} QR</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 24px;">
          <h2>${qrProduct.name}</h2>
          <p>${qrProduct.qrCode}</p>
          <img src="${qrImageUrl}" style="width: 240px; height: 240px;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setEditForm({
      qrCode: product.qrCode ?? "",
      vatRate: (product.vatRate * 100).toFixed(0),
    });
  }

  async function saveProductMeta() {
    if (!editProduct) return;
    setEditBusy(true);
    const payload = {
      qrCode: editForm.qrCode || undefined,
      vatRate: editForm.vatRate ? Number(editForm.vatRate) / 100 : undefined,
    };
    const r = await fetch(`/api/products/${editProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "Ürün güncellenemedi.");
      setEditBusy(false);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["products"] });
    setEditProduct(null);
    setEditBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Ürünler</h1>
          <p className="text-sm text-zinc-500">Ürün adları, kategori yönetimi ve QR etiketleri.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-semibold"
        >
          Yeni Ürün Ekle
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-medium mb-3">Ürün Listesi</div>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.category ?? "Kategori yok"}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-zinc-500">KDV {(p.vatRate * 100).toFixed(0)}%</div>
                <span
                  className={[
                    "text-xs rounded-full px-2 py-1",
                    p.qrCode ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600",
                  ].join(" ")}
                >
                  {p.qrCode ? "QR var" : "QR yok"}
                </span>
                <button
                  type="button"
                  onClick={() => openQr(p)}
                  className="rounded-lg border px-3 py-1 text-xs hover:bg-zinc-50"
                >
                  {p.qrCode ? "QR Görüntüle" : "QR Oluştur"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg border px-2 py-1 text-xs hover:bg-zinc-50"
                  title="Ürünü düzenle"
                  aria-label="Ürünü düzenle"
                >
                  ✏️
                </button>
              </div>
            </div>
          ))}
          {!products.length && <div className="text-sm text-zinc-500">Henüz ürün yok.</div>}
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Yeni Ürün Ekle</div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Kapat
              </button>
            </div>
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
              <div className="grid gap-1">
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="QR kodu (boşsa otomatik oluşturulur)"
                  value={form.qrCode}
                  onChange={(event) => setForm({ ...form, qrCode: event.target.value })}
                />
                <div className="text-xs text-zinc-500">
                  Otomatik QR oluşturma ile ürün etiketi hızlıca hazırlanır.
                </div>
              </div>
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
      )}

      {qrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">QR Etiketi</div>
              <button
                type="button"
                onClick={() => setQrProduct(null)}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Kapat
              </button>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3 text-sm">
              <div className="font-medium mb-1">{qrProduct.name}</div>
              <div className="text-xs text-zinc-500">QR Kodu: {qrProduct.qrCode}</div>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-3">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt={`${qrProduct.name} QR`} className="h-48 w-48" />
                ) : (
                  <div className="text-xs text-zinc-500">QR hazırlanıyor...</div>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={printQr}
                  className="rounded-lg border px-3 py-2 hover:bg-zinc-50"
                  disabled={!qrImageUrl}
                >
                  QR Yazdır
                </button>
                <button
                  type="button"
                  onClick={downloadQrPng}
                  className="rounded-lg border px-3 py-2 hover:bg-zinc-50"
                  disabled={!qrImageUrl}
                >
                  PNG İndir
                </button>
                <button
                  type="button"
                  onClick={downloadQrSvg}
                  className="rounded-lg border px-3 py-2 hover:bg-zinc-50"
                  disabled={!qrSvgUrl}
                >
                  SVG İndir
                </button>
              </div>
              <div className="text-xs text-zinc-500">
                Etiket şablonu yazdırıp ürünlere yapıştırmaya uygundur.
              </div>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Ürün Düzenle</div>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Kapat
              </button>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3 text-sm">
              <div className="font-medium mb-1">{editProduct.name}</div>
              <div className="text-xs text-zinc-500">Kategori: {editProduct.category ?? "Kategori yok"}</div>
            </div>
            <div className="grid gap-2 text-sm">
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="QR kodu"
                value={editForm.qrCode}
                onChange={(event) => setEditForm({ ...editForm, qrCode: event.target.value })}
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                placeholder="KDV oranı (%)"
                value={editForm.vatRate}
                onChange={(event) => setEditForm({ ...editForm, vatRate: event.target.value })}
              />
              <button
                type="button"
                onClick={saveProductMeta}
                className="rounded-xl bg-zinc-900 text-white py-2 text-sm font-semibold"
                disabled={editBusy}
              >
                {editBusy ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrBusy && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 text-sm text-white">
          QR hazırlanıyor...
        </div>
      )}
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
