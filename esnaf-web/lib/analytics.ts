import { Product, Sale } from "./types";

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

export const anchoredPeriods: AnalyticsPeriod[] = [
  { key: "weekly", label: "Haftalık", days: 7 },
  { key: "monthly", label: "Aylık", days: 30 },
  { key: "quarterly", label: "Çeyreklik", days: 90 },
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

export type DateRange = {
  start: Date;
  end: Date;
};

export function getAnchoredRange(anchorDate: Date, periodDays: number, now: Date = new Date()): DateRange {
  const anchorTime = anchorDate.getTime();
  const nowTime = now.getTime();
  if (Number.isNaN(anchorTime) || anchorTime > nowTime) {
    const fallbackStart = new Date(nowTime - periodDays * 24 * 60 * 60 * 1000);
    return { start: fallbackStart, end: now };
  }
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const elapsed = Math.max(0, nowTime - anchorTime);
  const periodsElapsed = Math.floor(elapsed / periodMs);
  const start = new Date(anchorTime + periodsElapsed * periodMs);
  const end = new Date(start.getTime() + periodMs);
  return { start, end };
}

export function calcAnalyticsForRange(sales: Sale[], range: DateRange, productId?: string): AnalyticsSummary {
  let revenue = 0;
  let cost = 0;
  let vat = 0;
  let soldQty = 0;

  const startTime = range.start.getTime();
  const endTime = range.end.getTime();

  for (const sale of sales) {
    const created = new Date(sale.createdAt).getTime();
    if (created < startTime || created >= endTime) continue;
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

export type ProductSalesStat = {
  productId: string;
  name: string;
  revenue: number;
  qty: number;
  profit: number;
};

export function calcProductStatsForRange(sales: Sale[], products: Product[], range: DateRange): ProductSalesStat[] {
  const stats = new Map<string, ProductSalesStat>();
  const startTime = range.start.getTime();
  const endTime = range.end.getTime();

  for (const sale of sales) {
    const created = new Date(sale.createdAt).getTime();
    if (created < startTime || created >= endTime) continue;
    sale.items.forEach((item) => {
      const existing = stats.get(item.productId) ?? {
        productId: item.productId,
        name: products.find((product) => product.id === item.productId)?.name ?? item.name,
        revenue: 0,
        qty: 0,
        profit: 0,
      };
      existing.qty += item.qty;
      existing.revenue += item.qty * item.unitSalePrice;
      existing.profit += item.qty * (item.unitSalePrice - item.unitCostPrice);
      stats.set(item.productId, existing);
    });
  }

  return Array.from(stats.values());
}

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
