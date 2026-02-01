"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { anchoredPeriods, calcAnalyticsForRange, calcProductStatsForRange, getAnchoredRange } from "@/lib/analytics";
import { Branch, Business, Notification, Product, Sale } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { branchLabel } from "@/lib/branches";
import { withBusinessId } from "@/lib/tenant";
import { fmtTRY } from "@/lib/money";
import { MiniBarChart } from "@/components/mini-bar-chart";

async function fetchNotifications(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/notifications", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchBranches(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/branches", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchSales(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/sales", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchProducts(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/products", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchBusinesses() {
  const r = await fetch("/api/businesses", { cache: "no-store" });
  return r.json();
}

async function markRead(ids: string[]) {
  const r = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return r.json();
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const user = useAuth((state) => state.user);
  const businessId = user?.role === "YONETIM" ? null : user?.businessId ?? null;
  const { data } = useQuery({
    queryKey: ["notifications", businessId],
    queryFn: () => fetchNotifications(businessId),
  });
  const { data: branchData } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => fetchBranches(businessId),
  });
  const { data: salesData } = useQuery({
    queryKey: ["sales", businessId],
    queryFn: () => fetchSales(businessId),
  });
  const { data: productData } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => fetchProducts(businessId),
  });
  const { data: businessData } = useQuery({
    queryKey: ["businesses"],
    queryFn: fetchBusinesses,
  });
  const notifications: Notification[] = data?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const sales: Sale[] = salesData?.items ?? [];
  const products: Product[] = productData?.items ?? [];
  const businesses: Business[] = businessData?.items ?? [];
  const currentBusiness = businesses.find((biz) => biz.id === businessId);
  const canSeeAnalytics = user?.role === "ADMİN" || user?.role === "MÜDÜR";

  const scoped = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => {
      if (user.role === "ADMİN") return true;
      if (n.scope === "GLOBAL") return true;
      if (n.scope === "BRANCH") return n.branchId === user.branchId;
      if (n.scope === "USER") return n.userId === user.id;
      return false;
    });
  }, [notifications, user]);

  useEffect(() => {
    const unreadIds = scoped.filter((n) => !n.readAt).map((n) => n.id);
    if (!unreadIds.length) return;
    markRead(unreadIds).then(() => qc.invalidateQueries({ queryKey: ["notifications", businessId] }));
  }, [qc, scoped]);

  const anchoredInsights = useMemo(() => {
    if (!currentBusiness) return [];
    const anchorDate = new Date(currentBusiness.createdAt);
    return anchoredPeriods.map((period) => {
      const range = getAnchoredRange(anchorDate, period.days);
      const summary = calcAnalyticsForRange(sales, range);
      const productStats = calcProductStatsForRange(sales, products, range)
        .filter((stat) => stat.qty > 0)
        .sort((a, b) => b.revenue - a.revenue);
      return {
        period,
        range,
        summary,
        topProducts: productStats.slice(0, 5),
      };
    });
  }, [currentBusiness, products, sales]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Bildirimler</h1>
        <p className="text-sm text-zinc-500">Kritik stok, satış özeti ve ürün performans uyarıları.</p>
      </div>

      {canSeeAnalytics && currentBusiness && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
          <div>
            <div className="font-medium">Otomatik Analiz Bildirimleri</div>
            <p className="text-xs text-zinc-500">
              Üyelik başlangıç tarihine göre dönemsel kâr/zarar ve ürün performansı.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {anchoredInsights.map(({ period, range, summary, topProducts }) => (
              <div key={period.key} className="rounded-xl border bg-zinc-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{period.label} Analiz</div>
                  <div className="text-[11px] text-zinc-500">
                    {range.start.toLocaleDateString("tr-TR")} - {range.end.toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-[11px] text-zinc-500">Ciro</div>
                    <div className="font-medium">{fmtTRY(summary.revenue)}</div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-[11px] text-zinc-500">Kâr</div>
                    <div className="font-medium text-emerald-600">{fmtTRY(summary.profit)}</div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-[11px] text-zinc-500">Zarar</div>
                    <div className="font-medium text-rose-600">{fmtTRY(summary.loss)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-600 mb-2">Ürün bazında satış grafiği</div>
                  <MiniBarChart
                    data={topProducts.map((product) => ({
                      label: product.name,
                      value: product.revenue,
                      description: `${product.qty} adet`,
                    }))}
                    valueFormatter={(value) => fmtTRY(value)}
                    barClassName="bg-indigo-500"
                    emptyLabel="Bu dönem için satış kaydı yok."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Bildirim Akışı</div>
        <div className="space-y-2 text-sm">
          {scoped.map((note) => (
            <div key={note.id} className="rounded-xl border bg-zinc-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{note.title}</div>
                <span className="text-[11px] text-zinc-500">
                  {new Date(note.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">{note.message}</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {note.scope === "BRANCH" ? branchLabel(branches, note.branchId) : "Genel"}
              </div>
            </div>
          ))}
          {!scoped.length && <div className="text-sm text-zinc-500">Bildirim bulunamadı.</div>}
        </div>
      </div>
    </div>
  );
}
