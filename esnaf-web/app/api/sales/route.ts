import { NextResponse } from "next/server";
import { createSaleIdempotent, listBusinesses, listSales } from "@/lib/mock-db";
import { calcSaleTotals } from "@/lib/money";
import { Sale } from "@/lib/types";

function resolveBusinessId(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) return businessId;
  return listBusinesses()[0]?.id ?? "";
}

export async function GET(req: Request) {
  const businessId = resolveBusinessId(req);
  return NextResponse.json({ items: listSales(businessId, 30) });
}

export async function POST(req: Request) {
  const businessId = resolveBusinessId(req);
  const body = await req.json();

  const clientRequestId: string = body.clientRequestId;
  const createdBy = body.createdBy; // demo
  const branchId = body.branchId ?? null;
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
    businessId,
    clientRequestId,
    createdBy,
    branchId,
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
