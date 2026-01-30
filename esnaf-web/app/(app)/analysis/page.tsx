"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsPeriods, calcAnalyticsForPeriod } from "@/lib/analytics";
import { fmtTRY } from "@/lib/money";
import { Product, Sale } from "@/lib/types";

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

export default function AnalysisPage() {
  const { data: salesData } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const { data: productData } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const sales: Sale[] = salesData?.items ?? [];
  const products: Product[] = productData?.items ?? [];
  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stockOnHand, 0), [products]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Analiz</h1>
        <p className="text-sm text-zinc-500">Günlükten yıllığa satış, stok, kâr ve zarar analizi.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyticsPeriods.map((period) => {
          const summary = calcAnalyticsForPeriod(sales, period);
          return (
            <div key={period.key} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="font-medium">{period.label}</div>
              <div className="text-xs text-zinc-500 mb-3">Son {period.days} gün</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Ciro</span>
                  <span className="font-medium">{fmtTRY(summary.revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Satılan</span>
                  <span>{summary.soldQty} adet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stok</span>
                  <span>{totalStock} adet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kâr</span>
                  <span className="text-emerald-600 font-medium">{fmtTRY(summary.profit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zarar</span>
                  <span className="text-red-600 font-medium">{fmtTRY(summary.loss)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
