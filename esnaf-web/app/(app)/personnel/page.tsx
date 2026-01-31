"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/store/auth";
import { analyticsPeriods, calcAnalyticsForPeriod } from "@/lib/analytics";
import { fmtTRY } from "@/lib/money";
import { Sale } from "@/lib/types";

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

export default function PersonnelPage() {
  const user = useAuth((state) => state.user);
  const { data } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const sales: Sale[] = data?.items ?? [];

  const ownSales = useMemo(
    () => (user?.id ? sales.filter((sale) => sale.createdBy.id === user.id) : []),
    [sales, user?.id]
  );
  const revenue = ownSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
  const profit = ownSales.reduce((sum, sale) => sum + sale.netProfit, 0);
  const loss = ownSales.reduce((sum, sale) => sum + (sale.netProfit < 0 ? Math.abs(sale.netProfit) : 0), 0);

  const periodSummaries = useMemo(
    () =>
      analyticsPeriods.map((period) => ({
        period,
        summary: calcAnalyticsForPeriod(ownSales, period),
      })),
    [ownSales]
  );

  if (user?.role !== "PERSONEL") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece personel kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Personel Sayfası</h1>
      <p className="text-sm text-zinc-500">Günlük görevler, hızlı satış ve stok kontrolü.</p>
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Satış Performansı</div>
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Toplam satış</div>
            <div className="text-lg font-semibold">{ownSales.length}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ciro</div>
            <div className="text-lg font-semibold">{fmtTRY(revenue)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Kâr / Zarar</div>
            <div className="text-lg font-semibold">{fmtTRY(profit - loss)}</div>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-5 text-xs">
          {periodSummaries.map(({ period, summary }) => (
            <div key={period.key} className="rounded-lg border bg-white px-3 py-2">
              <div className="font-medium">{period.label}</div>
              <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
              <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
              <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
              <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
