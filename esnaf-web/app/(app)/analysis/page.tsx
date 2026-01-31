"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsPeriods, calcAnalyticsForPeriod } from "@/lib/analytics";
import { fmtTRY } from "@/lib/money";
import { Branch, DemoUser, Product, Sale } from "@/lib/types";
import { getDemoUsers } from "@/lib/auth";
import { branchLabel, filterSalesByBranch, filterUsersByBranch, getBranchStock, sumBranchStock } from "@/lib/branches";
import { useAuth } from "@/store/auth";

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

async function fetchBranches() {
  const r = await fetch("/api/branches", { cache: "no-store" });
  return r.json();
}

export default function AnalysisPage() {
  const { data: salesData } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const { data: productData } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: branchData } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const user = useAuth((state) => state.user);
  const [people, setPeople] = useState<DemoUser[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const sales: Sale[] = salesData?.items ?? [];
  const products: Product[] = productData?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const ownBranchId = user?.role === "ADMİN" ? null : user?.branchId ?? null;
  const activeBranchId = user?.role === "ADMİN" ? selectedBranchId : ownBranchId;
  const scopedSales = useMemo(() => filterSalesByBranch(sales, activeBranchId ?? undefined), [sales, activeBranchId]);
  const totalStock = useMemo(
    () => sumBranchStock(products, activeBranchId ?? undefined),
    [products, activeBranchId]
  );
  const canSeePersonnel = user?.role === "ADMİN" || user?.role === "MÜDÜR";

  useEffect(() => {
    let active = true;
    getDemoUsers().then((list) => {
      if (active) setPeople(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const personnelUsers = useMemo(
    () => filterUsersByBranch(people, activeBranchId ?? undefined).filter((person) => person.role === "PERSONEL"),
    [people, activeBranchId]
  );

  const personnelSummaries = useMemo(() => {
    return personnelUsers.map((person) => {
      const personSales = scopedSales.filter((sale) => sale.createdBy.id === person.id);
      const totalRevenue = personSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const totalProfit = personSales.reduce((sum, sale) => sum + sale.netProfit, 0);
      const lastSale = personSales[0]?.createdAt;
      const analytics = analyticsPeriods.map((period) => ({
        period,
        summary: calcAnalyticsForPeriod(personSales, period),
      }));
      return { person, personSales, totalRevenue, totalProfit, lastSale, analytics };
    });
  }, [personnelUsers, sales]);

  if (!canSeePersonnel) {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece admin ve müdür kullanıcılar içindir.</div>;
  }

  const branchSummaries = branches
    .filter((branch) => (activeBranchId ? branch.id === activeBranchId : true))
    .map((branch) => {
      const branchSales = filterSalesByBranch(sales, branch.id);
      const branchStock = sumBranchStock(products, branch.id);
      return {
        branch,
        branchSales,
        branchStock,
        analytics: analyticsPeriods.map((period) => ({
          period,
          summary: calcAnalyticsForPeriod(branchSales, period),
        })),
      };
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Analiz</h1>
        <p className="text-sm text-zinc-500">Günlükten yıllığa satış, stok, kâr ve zarar analizi.</p>
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
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyticsPeriods.map((period) => {
          const summary = calcAnalyticsForPeriod(scopedSales, period);
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

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Bayi Analizleri</div>
          <p className="text-xs text-zinc-500">
            Bayilerin günlük, aylık, çeyreklik ve yıllık rapor kırılımları.
          </p>
        </div>
        <div className="space-y-4">
          {branchSummaries.map(({ branch, branchSales, branchStock, analytics }) => (
            <div key={branch.id} className="rounded-xl border bg-zinc-50 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{branch.name}</div>
                  <div className="text-xs text-zinc-500">
                    Toplam satış: {branchSales.length} • Stok: {branchStock} adet
                  </div>
                </div>
                <div className="text-xs text-zinc-500">{branchLabel(branches, branch.id)}</div>
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                {analytics.map(({ period, summary }) => (
                  <div key={period.key} className="rounded-lg border bg-white px-3 py-2 text-xs">
                    <div className="font-medium">{period.label}</div>
                    <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
                    <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
                    <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
                    <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!branchSummaries.length && <div className="text-sm text-zinc-500">Bayi bulunamadı.</div>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-medium">Dönemsel Raporlar</div>
          <ul className="text-sm text-zinc-600 list-disc pl-5 space-y-1">
            <li>Günlük / haftalık / aylık / yıllık / çeyrek dönem raporları</li>
            <li>Ciro ve net kâr grafikleri</li>
            <li>En çok satan ürünler</li>
            <li>En çok kâr bırakan ürünler</li>
            <li>Ödeme tipi dağılımı</li>
            <li>Personel bazlı satış performansı</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-medium">Maliyet & Gider Analizi</div>
          <ul className="text-sm text-zinc-600 list-disc pl-5 space-y-1">
            <li>Ürün bazlı maliyet takibi</li>
            <li>Ödeme türüne göre giderler: Nakit, Kart (POS komisyonu / sabit gider)</li>
            <li>Satış anında ve raporlarda: Satış geliri, ürün maliyeti, POS giderleri</li>
            <li>Net kâr / zarar kırılımı</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        <div>
          <div className="font-medium">Personel Satışları & Performans</div>
          <p className="text-xs text-zinc-500">
            Personellerin satış adetleri ve dönemsel performans özetleri.
          </p>
        </div>
        {personnelSummaries.length === 0 && (
          <div className="text-sm text-zinc-500">Henüz personel veya satış kaydı yok.</div>
        )}
        <div className="space-y-4">
          {personnelSummaries.map(({ person, personSales, totalRevenue, totalProfit, lastSale, analytics }) => (
            <div key={person.id} className="rounded-xl border bg-zinc-50 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{person.name}</div>
                <div className="text-xs text-zinc-500">@{person.username}</div>
                {person.branchId && (
                  <div className="text-[11px] text-zinc-400">{branchLabel(branches, person.branchId)}</div>
                )}
              </div>
                <div className="text-xs text-zinc-500 text-right">
                  Toplam satış: <span className="font-medium text-zinc-900">{personSales.length}</span>
                  <div>
                    Son satış:{" "}
                    <span className="font-medium text-zinc-900">
                      {lastSale ? new Date(lastSale).toLocaleDateString("tr-TR") : "-"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  Ciro: <span className="font-medium text-zinc-900">{fmtTRY(totalRevenue)}</span> • Net kâr:{" "}
                  <span className="font-medium text-zinc-900">{fmtTRY(totalProfit)}</span>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                {analytics.map(({ period, summary }) => (
                  <div key={period.key} className="rounded-lg border bg-white px-3 py-2 text-xs">
                    <div className="font-medium">{period.label}</div>
                    <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
                    <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
                    <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
                    <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
