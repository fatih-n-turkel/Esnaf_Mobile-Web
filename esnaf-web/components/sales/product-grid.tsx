"use client";

import { Product } from "@/lib/types";
import { fmtTRY } from "@/lib/money";

export default function ProductGrid({ products, onPick }: { products: Product[]; onPick: (p: Product) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map((p) => {
        const low = p.stockOnHand <= p.criticalStockLevel;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            className="rounded-2xl border bg-white p-3 text-left shadow-sm hover:shadow transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium leading-snug">{p.name}</div>
              <span className={["h-2.5 w-2.5 rounded-full mt-1", low ? "bg-red-500" : "bg-emerald-500"].join(" ")} />
            </div>
            <div className="text-sm text-zinc-500 mt-1">{p.category ?? "—"}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-semibold">{fmtTRY(p.salePrice)}</div>
              <div className="text-xs text-zinc-500">Stok: {p.stockOnHand}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
