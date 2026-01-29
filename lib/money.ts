export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtTRY(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

export function calcPosFee(
  paymentType: "CASH" | "CARD" | "IBAN",
  feeType: "RATE" | "FIXED",
  feeValue: number,
  revenue: number
) {
  if (paymentType !== "CARD") return 0;
  if (feeType === "RATE") return round2(revenue * feeValue);
  return round2(feeValue);
}

export function calcSaleTotals(
  items: { qty: number; unitSalePrice: number; unitCostPrice: number; vatRate: number }[],
  paymentType: "CASH" | "CARD" | "IBAN",
  posFeeType: "RATE" | "FIXED",
  posFeeValue: number
) {
  const totalRevenue = round2(items.reduce((s, it) => s + it.qty * it.unitSalePrice, 0));
  const totalCost = round2(items.reduce((s, it) => s + it.qty * it.unitCostPrice, 0));
  const totalVat = round2(items.reduce((s, it) => s + it.qty * it.unitSalePrice * it.vatRate, 0));
  const posFeeAmount = calcPosFee(paymentType, posFeeType, posFeeValue, totalRevenue);
  const netProfit = round2(totalRevenue - totalCost - posFeeAmount);

  return { totalRevenue, totalCost, totalVat, posFeeAmount, netProfit };
}
