"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
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

  const periodSummaries = useMemo(() => {
    return analyticsPeriods.map((period) => ({
      period,
      summary: calcAnalyticsForPeriod(scopedSales, period),
    }));
  }, [scopedSales]);

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
