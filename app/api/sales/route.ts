import { NextResponse } from "next/server";
import { createSaleIdempotent, listSales } from "@/lib/mock-db";
import { calcSaleTotals } from "@/lib/money";
import { Sale } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ items: listSales(30) });
}

export async function POST(req: Request) {
  const body = await req.json();

  const clientRequestId: string = body.clientRequestId;
  const createdBy = body.createdBy; // demo
  const items = body.items ?? [];
  const paymentType = body.paymentType ?? "CASH";
  const posFeeType = body.posFeeType ?? "RATE";
  const posFeeValue = Number(body.posFeeValue ?? 0);

  if (!clientRequestId || !items.length) {
    return NextResponse.json({ error: "clientRequestId ve items zorunlu" }, { status: 400 });
  }

  const totals = calcSaleTotals(items, paymentType, posFeeType, posFeeValue);

  const saleWithoutIds: Omit<Sale, "id" | "createdAt"> = {
    // clientRequestId route içinde overwrite edilse de tip için burada var:
    clientRequestId,
    createdBy,
    paymentType,
    posFeeType,
    posFeeValue,
    posFeeAmount: totals.posFeeAmount,
    totalRevenue: totals.totalRevenue,
    totalCost: totals.totalCost,
    totalVat: totals.totalVat,
    netProfit: totals.netProfit,
    items,
  } as any;

  const created = createSaleIdempotent(clientRequestId, saleWithoutIds);
  return NextResponse.json({ item: created });
}
