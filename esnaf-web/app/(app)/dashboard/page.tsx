"use client";

import { useQuery } from "@tanstack/react-query";
import KpiCards from "@/components/kpi-cards";
import { fmtTRY } from "@/lib/money";

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });

  const items = (data?.items ?? []) as any[];
  const today = new Date().toDateString();

  const todays = items.filter((s) => new Date(s.createdAt).toDateString() === today);
  const revenue = todays.reduce((s, x) => s + x.totalRevenue, 0);
  const profit = todays.reduce((s, x) => s + x.netProfit, 0);
  const vat = todays.reduce((s, x) => s + x.totalVat, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-500">Gün özeti + hızlı aksiyon.</p>
      </div>

      <KpiCards revenue={revenue} profit={profit} vat={vat} salesCount={todays.length} />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-medium mb-2">Son Satışlar</div>
        <div className="divide-y">
          {items.slice(0, 8).map((s) => (
            <div key={s.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{new Date(s.createdAt).toLocaleString("tr-TR")}</div>
                <div className="text-zinc-500">
                  {s.paymentType} • {s.items.length} kalem
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{fmtTRY(s.totalRevenue)}</div>
                <div className="text-xs text-zinc-500">Kâr: {fmtTRY(s.netProfit)}</div>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-sm text-zinc-500 py-6">Henüz satış yok.</div>}
        </div>
      </div>
    </div>
  );
}
