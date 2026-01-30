import { Sale } from "./types";

export type AnalyticsPeriod = {
  key: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  label: string;
  days: number;
};

export const analyticsPeriods: AnalyticsPeriod[] = [
  { key: "daily", label: "Günlük", days: 1 },
  { key: "weekly", label: "Haftalık", days: 7 },
  { key: "monthly", label: "Aylık", days: 30 },
  { key: "quarterly", label: "Çeyrek", days: 90 },
  { key: "yearly", label: "Yıllık", days: 365 },
];

export type AnalyticsSummary = {
  revenue: number;
  cost: number;
  vat: number;
  profit: number;
  loss: number;
  soldQty: number;
};

const clampDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function calcAnalyticsForPeriod(
  sales: Sale[],
  period: AnalyticsPeriod,
  productId?: string
): AnalyticsSummary {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - period.days + 1);
  const startDay = clampDate(start).getTime();
  const endDay = end.getTime();

  let revenue = 0;
  let cost = 0;
  let vat = 0;
  let soldQty = 0;

  for (const sale of sales) {
    const created = new Date(sale.createdAt).getTime();
    if (created < startDay || created > endDay) continue;
    if (!productId) {
      revenue += sale.totalRevenue;
      cost += sale.totalCost;
      vat += sale.totalVat;
      soldQty += sale.items.reduce((sum, it) => sum + it.qty, 0);
      continue;
    }

    for (const item of sale.items) {
      if (item.productId !== productId) continue;
      revenue += item.qty * item.unitSalePrice;
      cost += item.qty * item.unitCostPrice;
      vat += item.qty * item.unitSalePrice * item.vatRate;
      soldQty += item.qty;
    }
  }

  const profit = revenue - cost;
  const loss = profit < 0 ? Math.abs(profit) : 0;

  return {
    revenue,
    cost,
    vat,
    profit,
    loss,
    soldQty,
  };
}
