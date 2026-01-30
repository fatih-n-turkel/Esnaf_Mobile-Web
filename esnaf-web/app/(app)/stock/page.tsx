"use client";

import { useQuery } from "@tanstack/react-query";
import { Product } from "@/lib/types";
import { fmtTRY } from "@/lib/money";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

export default function StockPage() {
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const products: Product[] = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Stok</h1>
        <p className="text-sm text-zinc-500">Ürünlerin stok, fiyat ve KDV detayları.</p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-left p-3">Ürün</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-right p-3">Satış</th>
              <th className="text-right p-3">Maliyet</th>
              <th className="text-right p-3">Stok</th>
              <th className="text-right p-3">Kritik</th>
              <th className="text-right p-3">KDV</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
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
                <td className="p-3 text-right">{p.criticalStockLevel}</td>
                <td className="p-3 text-right">{(p.vatRate * 100).toFixed(0)}%</td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td className="p-6 text-zinc-500" colSpan={7}>
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
