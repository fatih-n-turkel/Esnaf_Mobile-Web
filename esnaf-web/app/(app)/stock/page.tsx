"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Branch, Product } from "@/lib/types";
import { fmtTRY } from "@/lib/money";
import { getBranchStock, sumBranchStock } from "@/lib/branches";
import { useAuth } from "@/store/auth";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

async function fetchBranches() {
  const r = await fetch("/api/branches", { cache: "no-store" });
  return r.json();
}

export default function StockPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: branchData } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const products: Product[] = data?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const user = useAuth((state) => state.user);
  const canEdit = user?.role === "ADMİN" || user?.role === "MÜDÜR";
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const activeBranchId = user?.role === "ADMİN" ? selectedBranchId : user?.branchId ?? null;
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editBranchId, setEditBranchId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    stockOnHand: "",
    salePrice: "",
    costPrice: "",
    criticalStockLevel: "",
    vatRate: "",
  });
  const totalStock = sumBranchStock(products, activeBranchId ?? undefined);
  const displayProducts =
    activeBranchId || user?.role !== "ADMİN"
      ? products.map((p) => ({ ...p, stockOnHand: getBranchStock(p, activeBranchId ?? undefined) }))
      : products;
  const visibleBranches =
    user?.role === "ADMİN"
      ? activeBranchId
        ? branches.filter((branch) => branch.id === activeBranchId)
        : branches
      : branches.filter((branch) => branch.id === user?.branchId);

  useEffect(() => {
    if (!editProduct) return;
    const branchId = editBranchId ?? undefined;
    setEditForm((prev) => ({
      ...prev,
      stockOnHand: String(getBranchStock(editProduct, branchId)),
    }));
  }, [editBranchId, editProduct]);

  function openEdit(product: Product) {
    const branchId =
      user?.role === "ADMİN" ? activeBranchId ?? branches[0]?.id ?? null : user?.branchId ?? null;
    setEditBranchId(branchId);
    setEditForm({
      stockOnHand: String(getBranchStock(product, branchId ?? undefined)),
      salePrice: String(product.salePrice),
      costPrice: String(product.costPrice),
      criticalStockLevel: String(product.criticalStockLevel),
      vatRate: String(product.vatRate * 100),
    });
    setEditProduct(product);
  }

  async function saveEdit() {
    if (!editProduct) return;
    if (!canEdit) {
      alert("Bu kullanıcı stok güncellemesi yapamaz.");
      return;
    }
    if (user?.role === "ADMİN" && branches.length > 0 && !editBranchId) {
      alert("Lütfen güncellenecek şubeyi seçin.");
      return;
    }
    const salePrice = Number(editForm.salePrice);
    const costPrice = Number(editForm.costPrice);
    const stockOnHand = Number(editForm.stockOnHand);
    const criticalStockLevel = Number(editForm.criticalStockLevel);
    const vatRate = Number(editForm.vatRate) / 100;
    if ([salePrice, costPrice, stockOnHand, criticalStockLevel, vatRate].some((value) => Number.isNaN(value))) {
      alert("Tüm alanlar sayısal olmalıdır.");
      return;
    }
    setEditBusy(true);
    const r = await fetch(`/api/products/${editProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salePrice,
        costPrice,
        stockOnHand,
        criticalStockLevel,
        vatRate,
        branchId: editBranchId ?? undefined,
      }),
    });
    setEditBusy(false);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error ?? "Stok güncellenemedi.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["products"] });
    setEditProduct(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Stok</h1>
        <p className="text-sm text-zinc-500">Ürünlerin stok, fiyat ve KDV detayları.</p>
      </div>

      {user?.role === "ADMİN" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-wrap items-center gap-3">
          <div className="text-sm font-medium">Bayi filtresi</div>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={selectedBranchId ?? ""}
            onChange={(event) => setSelectedBranchId(event.target.value || null)}
          >
            <option value="">Tüm bayiler</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <div className="text-xs text-zinc-500">Toplam stok: {totalStock} adet</div>
        </div>
      )}

      {user?.role === "ADMİN" && !activeBranchId && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="font-medium">{branch.name}</div>
              <div className="text-xs text-zinc-500">
                Stok toplamı: {sumBranchStock(products, branch.id)} adet
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-left p-3">Ürün</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-right p-3">Satış</th>
              <th className="text-right p-3">Maliyet</th>
              <th className="text-right p-3">Stok</th>
              <th className="text-left p-3">Bayi stokları</th>
              <th className="text-right p-3">Kritik</th>
              <th className="text-right p-3">KDV</th>
              {canEdit && <th className="text-right p-3">Düzenle</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayProducts.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-zinc-500">{p.category ?? "—"}</td>
                <td className="p-3 text-right">{fmtTRY(p.salePrice)}</td>
                <td className="p-3 text-right">{fmtTRY(p.costPrice)}</td>
                <td className="p-3 text-right">
                  <span className={p.stockOnHand <= p.criticalStockLevel ? "text-red-600 font-medium" : ""}>
                    {p.stockOnHand}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1 text-xs text-zinc-600">
                    {visibleBranches.map((branch) => (
                      <span key={branch.id}>
                        {branch.name}: {getBranchStock(p, branch.id)}
                      </span>
                    ))}
                    {!visibleBranches.length && <span>—</span>}
                  </div>
                </td>
                <td className="p-3 text-right">{p.criticalStockLevel}</td>
                <td className="p-3 text-right">{(p.vatRate * 100).toFixed(0)}%</td>
                {canEdit && (
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center justify-center rounded-lg border px-2 py-1 text-xs hover:bg-zinc-50"
                      title="Stok düzenle"
                      aria-label="Stok düzenle"
                    >
                      ✏️
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!displayProducts.length && (
              <tr>
                <td className="p-6 text-zinc-500" colSpan={canEdit ? 9 : 8}>
                  Ürün yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Stok Detayını Düzenle</div>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Kapat
              </button>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3 text-sm space-y-1">
              <div className="font-medium">{editProduct.name}</div>
              <div className="text-xs text-zinc-500">Kategori: {editProduct.category ?? "Kategori yok"}</div>
            </div>
            {user?.role === "ADMİN" && branches.length > 0 && (
              <div className="grid gap-1 text-sm">
                <label className="text-xs text-zinc-500">Bayi</label>
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={editBranchId ?? ""}
                  onChange={(event) => setEditBranchId(event.target.value || null)}
                >
                  <option value="">Bayi seçin</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-xs text-zinc-500">Stok</label>
                  <input
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Stok"
                    value={editForm.stockOnHand}
                    onChange={(event) => setEditForm({ ...editForm, stockOnHand: event.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs text-zinc-500">Kritik stok</label>
                  <input
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Kritik stok"
                    value={editForm.criticalStockLevel}
                    onChange={(event) => setEditForm({ ...editForm, criticalStockLevel: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-xs text-zinc-500">Satış fiyatı</label>
                  <input
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Satış fiyatı"
                    value={editForm.salePrice}
                    onChange={(event) => setEditForm({ ...editForm, salePrice: event.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs text-zinc-500">Maliyet</label>
                  <input
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Maliyet"
                    value={editForm.costPrice}
                    onChange={(event) => setEditForm({ ...editForm, costPrice: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-zinc-500">KDV oranı (%)</label>
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="KDV oranı (%)"
                  value={editForm.vatRate}
                  onChange={(event) => setEditForm({ ...editForm, vatRate: event.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-xl bg-zinc-900 text-white py-2 text-sm font-semibold disabled:opacity-50"
              disabled={editBusy}
            >
              {editBusy ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
