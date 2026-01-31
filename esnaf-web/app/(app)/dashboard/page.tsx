"use client";

import { useQuery } from "@tanstack/react-query";
import KpiCards from "@/components/kpi-cards";
import { fmtTRY } from "@/lib/money";
import { filterSalesByBranch } from "@/lib/branches";
import { useAuth } from "@/store/auth";

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const user = useAuth((state) => state.user);

  const items = filterSalesByBranch((data?.items ?? []) as any[], user?.role === "ADMİN" ? null : user?.branchId ?? null);
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
        <div className="space-y-3">
          {items.slice(0, 8).map((s) => (
            <div key={s.id} className="rounded-xl border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  Satış • {new Date(s.createdAt).toLocaleTimeString("tr-TR")} •{" "}
                  <span className="text-zinc-600">{s.createdBy?.name ?? "-"}</span>
                </div>
                <span className="text-xs text-zinc-500">{s.paymentType}</span>
              </div>
              <div className="mt-2 space-y-1">
                {s.items.map((item) => (
                  <div key={`${s.id}-${item.productId}`} className="flex items-center justify-between">
                    <span className="text-zinc-700">
                      {item.name} x{item.qty}
                    </span>
                    <span className="font-medium">{fmtTRY(item.qty * item.unitSalePrice)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t pt-2 flex items-center justify-between">
                <span className="font-medium">Toplam</span>
                <span className="font-medium">{fmtTRY(s.totalRevenue)}</span>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-sm text-zinc-500 py-6">Henüz satış yok.</div>}
        </div>
      </div>
    </div>
  );
}
