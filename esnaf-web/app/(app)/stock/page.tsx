"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: branchData } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const products: Product[] = data?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const user = useAuth((state) => state.user);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const activeBranchId = user?.role === "ADMİN" ? selectedBranchId : user?.branchId ?? null;
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
              </tr>
            ))}
            {!displayProducts.length && (
              <tr>
                <td className="p-6 text-zinc-500" colSpan={8}>
                  Ürün yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
