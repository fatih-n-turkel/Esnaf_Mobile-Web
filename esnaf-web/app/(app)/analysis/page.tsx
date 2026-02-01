"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import {
  anchoredPeriods,
  analyticsPeriods,
  calcAnalyticsForPeriod,
  calcAnalyticsForRange,
  calcProductStatsForRange,
  getAnchoredRange,
} from "@/lib/analytics";
import { fmtTRY } from "@/lib/money";
import { Branch, Business, DemoUser, Product, Sale, UserActivity } from "@/lib/types";
import { getDemoUsers } from "@/lib/auth";
import { branchLabel, filterSalesByBranch, filterUsersByBranch, getBranchStock, sumBranchStock } from "@/lib/branches";
import { useAuth } from "@/store/auth";
import { withBusinessId } from "@/lib/tenant";
import { MiniBarChart } from "@/components/mini-bar-chart";

async function fetchSales(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/sales", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchProducts(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/products", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchBranches(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/branches", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchBusinesses() {
  const r = await fetch("/api/businesses", { cache: "no-store" });
  return r.json();
}

async function fetchActivity(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/activity", businessId), { cache: "no-store" });
  return r.json();
}

export default function AnalysisPage() {
  const user = useAuth((state) => state.user);
  const businessId = user?.role === "YONETIM" ? null : user?.businessId ?? null;
  const { data: salesData } = useQuery({
    queryKey: ["sales", businessId],
    queryFn: () => fetchSales(businessId),
  });
  const { data: productData } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => fetchProducts(businessId),
  });
  const { data: branchData } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => fetchBranches(businessId),
  });
  const { data: businessData } = useQuery({
    queryKey: ["businesses"],
    queryFn: fetchBusinesses,
  });
  const { data: activityData } = useQuery({
    queryKey: ["activity", businessId],
    queryFn: () => fetchActivity(businessId),
  });
  const [people, setPeople] = useState<DemoUser[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [comparisonPeriodKey, setComparisonPeriodKey] = useState("weekly");
  const [comparisonUserId, setComparisonUserId] = useState<string>("");
  const [activityPerson, setActivityPerson] = useState<DemoUser | null>(null);

  const sales: Sale[] = salesData?.items ?? [];
  const products: Product[] = productData?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const businesses: Business[] = businessData?.items ?? [];
  const activity: UserActivity[] = activityData?.items ?? [];
  const ownBranchId =
    user?.role === "ADMİN" || user?.role === "YONETIM" ? null : user?.branchId ?? null;
  const activeBranchId = user?.role === "ADMİN" ? selectedBranchId : ownBranchId;
  const scopedSales = useMemo(() => filterSalesByBranch(sales, activeBranchId ?? undefined), [sales, activeBranchId]);
  const totalStock = useMemo(
    () => sumBranchStock(products, activeBranchId ?? undefined),
    [products, activeBranchId]
  );
  const canSeePersonnel = user?.role === "ADMİN" || user?.role === "MÜDÜR";
  const currentBusiness = businesses.find((biz) => biz.id === businessId);

  useEffect(() => {
    let active = true;
    getDemoUsers(businessId).then((list) => {
      if (active) setPeople(list);
    });
    return () => {
      active = false;
    };
  }, [businessId]);

  const personnelUsers = useMemo(
    () => filterUsersByBranch(people, activeBranchId ?? undefined).filter((person) => person.role === "PERSONEL"),
    [people, activeBranchId]
  );

  useEffect(() => {
    if (!comparisonUserId && personnelUsers.length) {
      setComparisonUserId(personnelUsers[0].id);
    }
  }, [comparisonUserId, personnelUsers]);

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
  }, [personnelUsers, scopedSales]);

  const periodSummaries = useMemo(() => {
    return analyticsPeriods.map((period) => ({
      period,
      summary: calcAnalyticsForPeriod(scopedSales, period),
    }));
  }, [scopedSales]);

  const anchoredInsights = useMemo(() => {
    const anchorDate = currentBusiness?.createdAt ? new Date(currentBusiness.createdAt) : new Date();
    return anchoredPeriods.map((period) => {
      const range = getAnchoredRange(anchorDate, period.days);
      const summary = calcAnalyticsForRange(scopedSales, range);
      const productStats = calcProductStatsForRange(scopedSales, products, range)
        .filter((stat) => stat.qty > 0)
        .sort((a, b) => b.revenue - a.revenue);
      return {
        period,
        range,
        summary,
        topProducts: productStats.slice(0, 6),
      };
    });
  }, [currentBusiness?.createdAt, products, scopedSales]);

  const comparisonPeriod =
    analyticsPeriods.find((period) => period.key === comparisonPeriodKey) ?? analyticsPeriods[1];
  const comparisonRows = useMemo(() => {
    return personnelSummaries
      .map(({ person, analytics }) => {
        const summary =
          analytics.find((entry) => entry.period.key === comparisonPeriod.key)?.summary ??
          calcAnalyticsForPeriod([], comparisonPeriod);
        return { person, summary };
      })
      .sort((a, b) => b.summary.revenue - a.summary.revenue);
  }, [comparisonPeriod, personnelSummaries]);

  const comparisonAverage = useMemo(() => {
    if (!comparisonRows.length) return { revenue: 0, profit: 0, loss: 0, soldQty: 0 };
    const totals = comparisonRows.reduce(
      (acc, row) => {
        acc.revenue += row.summary.revenue;
        acc.profit += row.summary.profit;
        acc.loss += row.summary.loss;
        acc.soldQty += row.summary.soldQty;
        return acc;
      },
      { revenue: 0, profit: 0, loss: 0, soldQty: 0 }
    );
    return {
      revenue: totals.revenue / comparisonRows.length,
      profit: totals.profit / comparisonRows.length,
      loss: totals.loss / comparisonRows.length,
      soldQty: totals.soldQty / comparisonRows.length,
    };
  }, [comparisonRows]);

  const selectedComparison = comparisonRows.find((row) => row.person.id === comparisonUserId);
  const selectedTrend = personnelSummaries.find((entry) => entry.person.id === comparisonUserId);

  const activitySessions = useMemo(() => {
    if (!activityPerson) return [];
    return activity
      .filter((entry) => entry.userId === activityPerson.id)
      .sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
  }, [activity, activityPerson]);

  const managerSummaries = useMemo(() => {
    const managers = people.filter((person) => person.role === "MÜDÜR");
    return managers.map((manager) => {
      const ownSales = sales.filter((sale) => sale.createdBy.id === manager.id);
      const assignedPersonnel = people.filter((person) => person.managerId === manager.id);
      const managedBranchIds = Array.from(
        new Set([manager.branchId, ...assignedPersonnel.map((person) => person.branchId)].filter(Boolean))
      ) as string[];
      const managedSales = sales.filter((sale) => managedBranchIds.includes(sale.branchId ?? ""));
      return {
        manager,
        ownSales,
        assignedPersonnel,
        managedBranches: branches.filter((branch) => managedBranchIds.includes(branch.id)),
        managedSales,
      };
    });
  }, [people, sales, branches]);

  const financialSummary = useMemo(() => {
    return scopedSales.reduce(
      (acc, sale) => {
        acc.revenue += sale.totalRevenue;
        acc.cost += sale.totalCost;
        acc.vat += sale.totalVat;
        acc.posFee += sale.posFeeAmount;
        acc.profit += sale.netProfit > 0 ? sale.netProfit : 0;
        acc.loss += sale.netProfit < 0 ? Math.abs(sale.netProfit) : 0;
        return acc;
      },
      { revenue: 0, cost: 0, vat: 0, posFee: 0, profit: 0, loss: 0 }
    );
  }, [scopedSales]);

  const downloadBlob = (content: BlobPart, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (value: string | number | null | undefined) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, "\"\"")}"`;
    }
    return stringValue;
  };

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [];
    rows.push(["Analiz Raporu", new Date().toLocaleString("tr-TR")]);
    rows.push([]);
    rows.push(["Dönem", "Ciro", "Satış", "Kâr", "Zarar"]);
    periodSummaries.forEach(({ period, summary }) => {
      rows.push([period.label, summary.revenue, summary.soldQty, summary.profit, summary.loss]);
    });
    rows.push([]);
    rows.push(["Finansal Özet", "Tutar"]);
    rows.push(["Toplam Satış", financialSummary.revenue]);
    rows.push(["Toplam Maliyet", financialSummary.cost]);
    rows.push(["KDV", financialSummary.vat]);
    rows.push(["POS Gideri", financialSummary.posFee]);
    rows.push(["Kâr", financialSummary.profit]);
    rows.push(["Zarar", financialSummary.loss]);
    rows.push([]);
    rows.push(["Bayi", "Dönem", "Ciro", "Kâr", "Zarar", "Satış", "Stok"]);
    branchSummaries.forEach(({ branch, branchStock, analytics }) => {
      analytics.forEach(({ period, summary }) => {
        rows.push([branch.name, period.label, summary.revenue, summary.profit, summary.loss, summary.soldQty, branchStock]);
      });
    });
    rows.push([]);
    rows.push(["Personel", "Kullanıcı Adı", "Toplam Ciro", "Toplam Kâr", "Son Satış"]);
    personnelSummaries.forEach(({ person, totalRevenue, totalProfit, lastSale }) => {
      rows.push([
        person.name,
        person.username,
        totalRevenue,
        totalProfit,
        lastSale ? new Date(lastSale).toLocaleDateString("tr-TR") : "-",
      ]);
    });
    rows.push([]);
    rows.push(["Personel Karşılaştırma", comparisonPeriod.label]);
    rows.push(["Personel", "Ciro", "Kâr", "Zarar", "Satış"]);
    comparisonRows.forEach((row) => {
      rows.push([row.person.name, row.summary.revenue, row.summary.profit, row.summary.loss, row.summary.soldQty]);
    });
    rows.push([
      "Ortalama",
      comparisonAverage.revenue,
      comparisonAverage.profit,
      comparisonAverage.loss,
      comparisonAverage.soldQty,
    ]);
    rows.push([]);
    rows.push(["Ürün Bazlı Satış Özeti"]);
    rows.push(["Dönem", "Başlangıç", "Bitiş", "Ciro", "Kâr", "Zarar"]);
    anchoredInsights.forEach(({ period, range, summary }) => {
      rows.push([
        period.label,
        range.start.toLocaleDateString("tr-TR"),
        range.end.toLocaleDateString("tr-TR"),
        summary.revenue,
        summary.profit,
        summary.loss,
      ]);
    });
    anchoredInsights.forEach(({ period, topProducts }) => {
      rows.push([]);
      rows.push([`${period.label} - En Çok Satan Ürünler`]);
      rows.push(["Ürün", "Ciro", "Satış Adedi", "Kâr"]);
      topProducts.forEach((product) => {
        rows.push([product.name, product.revenue, product.qty, product.profit]);
      });
    });
    const csvContent = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadBlob(csvContent, `analiz-raporu-${Date.now()}.csv`, "text/csv;charset=utf-8");
  };

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const handleExportPdf = () => {
    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) return;

    const periodRows = periodSummaries
      .map(
        ({ period, summary }) =>
          `<tr><td>${escapeHtml(period.label)}</td><td>${escapeHtml(fmtTRY(summary.revenue))}</td><td>${
            summary.soldQty
          }</td><td>${escapeHtml(fmtTRY(summary.profit))}</td><td>${escapeHtml(fmtTRY(summary.loss))}</td></tr>`
      )
      .join("");

    const branchRows = branchSummaries
      .map(({ branch, branchStock, analytics }) => {
        const analyticsRows = analytics
          .map(
            ({ period, summary }) =>
              `<tr><td>${escapeHtml(branch.name)}</td><td>${escapeHtml(period.label)}</td><td>${escapeHtml(
                fmtTRY(summary.revenue)
              )}</td><td>${escapeHtml(fmtTRY(summary.profit))}</td><td>${escapeHtml(
                fmtTRY(summary.loss)
              )}</td><td>${summary.soldQty}</td><td>${branchStock}</td></tr>`
          )
          .join("");
        return analyticsRows;
      })
      .join("");

    const personnelRows = personnelSummaries
      .map(
        ({ person, totalRevenue, totalProfit, lastSale }) =>
          `<tr><td>${escapeHtml(person.name)}</td><td>@${escapeHtml(person.username)}</td><td>${escapeHtml(
            fmtTRY(totalRevenue)
          )}</td><td>${escapeHtml(fmtTRY(totalProfit))}</td><td>${
            lastSale ? escapeHtml(new Date(lastSale).toLocaleDateString("tr-TR")) : "-"
          }</td></tr>`
      )
      .join("");

    const comparisonRowsHtml = comparisonRows
      .map(
        ({ person, summary }) =>
          `<tr><td>${escapeHtml(person.name)}</td><td>${escapeHtml(
            fmtTRY(summary.revenue)
          )}</td><td>${escapeHtml(fmtTRY(summary.profit))}</td><td>${escapeHtml(
            fmtTRY(summary.loss)
          )}</td><td>${summary.soldQty}</td></tr>`
      )
      .join("");

    const comparisonAverageRow = `<tr><th>Ortalama</th><td>${escapeHtml(
      fmtTRY(comparisonAverage.revenue)
    )}</td><td>${escapeHtml(fmtTRY(comparisonAverage.profit))}</td><td>${escapeHtml(
      fmtTRY(comparisonAverage.loss)
    )}</td><td>${comparisonAverage.soldQty}</td></tr>`;

    const productSummaryRows = anchoredInsights
      .map(
        ({ period, range, summary }) =>
          `<tr><td>${escapeHtml(period.label)}</td><td>${escapeHtml(
            range.start.toLocaleDateString("tr-TR")
          )}</td><td>${escapeHtml(range.end.toLocaleDateString("tr-TR"))}</td><td>${escapeHtml(
            fmtTRY(summary.revenue)
          )}</td><td>${escapeHtml(fmtTRY(summary.profit))}</td><td>${escapeHtml(
            fmtTRY(summary.loss)
          )}</td></tr>`
      )
      .join("");

    const productTopSections = anchoredInsights
      .map(({ period, topProducts }) => {
        const rows = topProducts
          .map(
            (product) =>
              `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(
                fmtTRY(product.revenue)
              )}</td><td>${product.qty}</td><td>${escapeHtml(fmtTRY(product.profit))}</td></tr>`
          )
          .join("");
        return `
          <h3>${escapeHtml(period.label)} En Çok Satan Ürünler</h3>
          <table>
            <thead>
              <tr><th>Ürün</th><th>Ciro</th><th>Satış</th><th>Kâr</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      })
      .join("");

    reportWindow.document.write(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>Analiz Raporu</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1, h2 { margin-bottom: 8px; }
            p { margin-top: 0; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Analiz Raporu</h1>
          <p>Tarih: ${escapeHtml(new Date().toLocaleString("tr-TR"))}</p>

          <h2>Dönemsel Özet</h2>
          <table>
            <thead>
              <tr><th>Dönem</th><th>Ciro</th><th>Satış</th><th>Kâr</th><th>Zarar</th></tr>
            </thead>
            <tbody>${periodRows}</tbody>
          </table>

          <h2>Finansal Özet</h2>
          <table>
            <tbody>
              <tr><th>Toplam Satış</th><td>${escapeHtml(fmtTRY(financialSummary.revenue))}</td></tr>
              <tr><th>Toplam Maliyet</th><td>${escapeHtml(fmtTRY(financialSummary.cost))}</td></tr>
              <tr><th>KDV</th><td>${escapeHtml(fmtTRY(financialSummary.vat))}</td></tr>
              <tr><th>POS Gideri</th><td>${escapeHtml(fmtTRY(financialSummary.posFee))}</td></tr>
              <tr><th>Kâr</th><td>${escapeHtml(fmtTRY(financialSummary.profit))}</td></tr>
              <tr><th>Zarar</th><td>${escapeHtml(fmtTRY(financialSummary.loss))}</td></tr>
            </tbody>
          </table>

          <h2>Bayi Analizleri</h2>
          <table>
            <thead>
              <tr><th>Bayi</th><th>Dönem</th><th>Ciro</th><th>Kâr</th><th>Zarar</th><th>Satış</th><th>Stok</th></tr>
            </thead>
            <tbody>${branchRows}</tbody>
          </table>

          <h2>Personel Performansı</h2>
          <table>
            <thead>
              <tr><th>Personel</th><th>Kullanıcı Adı</th><th>Ciro</th><th>Kâr</th><th>Son Satış</th></tr>
            </thead>
            <tbody>${personnelRows}</tbody>
          </table>

          <h2>Personel Karşılaştırma (${escapeHtml(comparisonPeriod.label)})</h2>
          <table>
            <thead>
              <tr><th>Personel</th><th>Ciro</th><th>Kâr</th><th>Zarar</th><th>Satış</th></tr>
            </thead>
            <tbody>${comparisonRowsHtml}${comparisonAverageRow}</tbody>
          </table>

          <h2>Ürün Bazlı Satış Özeti</h2>
          <table>
            <thead>
              <tr><th>Dönem</th><th>Başlangıç</th><th>Bitiş</th><th>Ciro</th><th>Kâr</th><th>Zarar</th></tr>
            </thead>
            <tbody>${productSummaryRows}</tbody>
          </table>
          ${productTopSections}
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.onload = () => {
      reportWindow.print();
    };
  };

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          type="button"
          onClick={handleExportCsv}
        >
          CSV İndir
        </button>
        <button
          className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          type="button"
          onClick={handleExportPdf}
        >
          PDF İndir
        </button>
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
        {periodSummaries.map(({ period, summary }) => (
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
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-medium">Dönemsel Raporlar</div>
          <div className="grid gap-2 text-xs md:grid-cols-2">
            {periodSummaries.map(({ period, summary }) => (
              <div key={period.key} className="rounded-lg border bg-zinc-50 px-3 py-2">
                <div className="font-medium">{period.label}</div>
                <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
                <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
                <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
                <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-medium">Maliyet & Gider Analizi</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Toplam maliyet</span>
              <span className="font-medium">{fmtTRY(financialSummary.cost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>POS gideri</span>
              <span className="font-medium">{fmtTRY(financialSummary.posFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>KDV</span>
              <span className="font-medium">{fmtTRY(financialSummary.vat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Net kâr</span>
              <span className="font-medium text-emerald-600">{fmtTRY(financialSummary.profit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Zarar</span>
              <span className="font-medium text-rose-600">{fmtTRY(financialSummary.loss)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Finansal Rapor</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Toplam Satış</div>
            <div className="text-lg font-semibold">{fmtTRY(financialSummary.revenue)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Toplam Maliyet</div>
            <div className="text-lg font-semibold">{fmtTRY(financialSummary.cost)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">KDV</div>
            <div className="text-lg font-semibold">{fmtTRY(financialSummary.vat)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">POS Gideri</div>
            <div className="text-lg font-semibold">{fmtTRY(financialSummary.posFee)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Kâr</div>
            <div className="text-lg font-semibold text-emerald-600">{fmtTRY(financialSummary.profit)}</div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Zarar</div>
            <div className="text-lg font-semibold text-rose-600">{fmtTRY(financialSummary.loss)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        <div>
          <div className="font-medium">Ürün Bazlı Satış Grafikleri</div>
          <p className="text-xs text-zinc-500">
            Üyelik başlangıç tarihine göre haftalık, aylık, çeyreklik ve yıllık ürün performansı.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {anchoredInsights.map(({ period, range, summary, topProducts }) => (
            <div key={period.key} className="rounded-xl border bg-zinc-50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{period.label}</div>
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
                <div className="text-xs font-semibold text-zinc-600 mb-2">En çok satan ürünler</div>
                <MiniBarChart
                  data={topProducts.map((product) => ({
                    label: product.name,
                    value: product.revenue,
                    description: `${product.qty} adet satış`,
                  }))}
                  valueFormatter={(value) => fmtTRY(value)}
                  barClassName="bg-emerald-500"
                  emptyLabel="Bu dönemde satış yok."
                />
              </div>
            </div>
          ))}
        </div>
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

      {user?.role === "ADMİN" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
          <div>
            <div className="font-medium">Müdür Analizleri</div>
            <p className="text-xs text-zinc-500">
              Müdürlerin kendi satışları, yönettikleri bayiler ve personellerin performans özeti.
            </p>
          </div>
          <div className="space-y-4">
            {managerSummaries.map((summary) => (
              <div key={summary.manager.id} className="rounded-xl border bg-zinc-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{summary.manager.name}</div>
                    <div className="text-xs text-zinc-500">@{summary.manager.username}</div>
                    {summary.manager.branchId && (
                      <div className="text-[11px] text-zinc-400">{branchLabel(branches, summary.manager.branchId)}</div>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 text-right">
                    Kendi satış: <span className="font-medium text-zinc-900">{summary.ownSales.length}</span>
                    <div>Yönettiği satış: {summary.managedSales.length}</div>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3 text-xs">
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="font-medium">Kendi Performansı</div>
                    <div className="text-zinc-500 mt-1">
                      Ciro: {fmtTRY(summary.ownSales.reduce((s, sale) => s + sale.totalRevenue, 0))}
                    </div>
                    <div className="text-zinc-500">Kâr: {fmtTRY(summary.ownSales.reduce((s, sale) => s + sale.netProfit, 0))}</div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="font-medium">Bağlı Bayiler</div>
                    <div className="text-zinc-500 mt-1">
                      {summary.managedBranches.map((branch) => branch.name).join(", ") || "Bayi yok"}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="font-medium">Bağlı Personeller</div>
                    <div className="text-zinc-500 mt-1">
                      {summary.assignedPersonnel.map((person) => person.name).join(", ") || "Personel yok"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!managerSummaries.length && <div className="text-sm text-zinc-500">Müdür bulunamadı.</div>}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        <div>
          <div className="font-medium">Personel Kıyaslama</div>
          <p className="text-xs text-zinc-500">
            Personelleri dönem bazında karşılaştırın, seçilen personelin kendi trendini izleyin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={comparisonPeriodKey}
            onChange={(event) => setComparisonPeriodKey(event.target.value)}
          >
            {analyticsPeriods.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={comparisonUserId}
            onChange={(event) => setComparisonUserId(event.target.value)}
          >
            {personnelUsers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border bg-zinc-50 p-3 space-y-2 text-xs">
            <div className="font-medium text-sm">Dönem Performansı Sıralaması</div>
            {comparisonRows.map((row, index) => (
              <div key={row.person.id} className="flex items-center justify-between">
                <span>
                  {index + 1}. {row.person.name}
                </span>
                <span className="font-medium">{fmtTRY(row.summary.revenue)}</span>
              </div>
            ))}
            {!comparisonRows.length && <div className="text-zinc-500">Personel verisi bulunamadı.</div>}
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3 space-y-2 text-xs">
            <div className="font-medium text-sm">Seçilen Personel vs Ortalama</div>
            <div className="flex items-center justify-between">
              <span>Seçilen ciro</span>
              <span className="font-medium">
                {selectedComparison ? fmtTRY(selectedComparison.summary.revenue) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Ortalama ciro</span>
              <span className="font-medium">{fmtTRY(comparisonAverage.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Kâr</span>
              <span className="font-medium text-emerald-600">
                {selectedComparison ? fmtTRY(selectedComparison.summary.profit) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Zarar</span>
              <span className="font-medium text-rose-600">
                {selectedComparison ? fmtTRY(selectedComparison.summary.loss) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Satış adedi</span>
              <span className="font-medium">
                {selectedComparison ? selectedComparison.summary.soldQty : "-"}
              </span>
            </div>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-3 space-y-2 text-xs">
            <div className="font-medium text-sm">Seçilen Personel Trend</div>
            <MiniBarChart
              data={
                selectedTrend?.analytics.map(({ period, summary }) => ({
                  label: period.label,
                  value: summary.revenue,
                  description: `${summary.soldQty} satış`,
                })) ?? []
              }
              valueFormatter={(value) => fmtTRY(value)}
              barClassName="bg-indigo-500"
              emptyLabel="Trend verisi yok."
            />
          </div>
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
                  <button
                    type="button"
                    className="mt-2 rounded-lg border px-3 py-1 text-[11px] hover:bg-white"
                    onClick={() => setActivityPerson(person)}
                  >
                    Aktiflik Durumu
                  </button>
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

      {activityPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Aktiflik Detayları</div>
                <div className="text-xs text-zinc-500">
                  {activityPerson.name} • @{activityPerson.username}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivityPerson(null)}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Kapat
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {activitySessions.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-zinc-50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">
                      Giriş: {new Date(entry.loginAt).toLocaleString("tr-TR")}
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {entry.deviceLabel ?? "Cihaz bilgisi yok"}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Çıkış:{" "}
                    {entry.logoutAt ? new Date(entry.logoutAt).toLocaleString("tr-TR") : "Şu an aktif"}
                  </div>
                </div>
              ))}
              {!activitySessions.length && (
                <div className="text-sm text-zinc-500">Aktiflik kaydı bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
