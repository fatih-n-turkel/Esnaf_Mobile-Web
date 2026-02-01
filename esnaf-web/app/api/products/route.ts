import { NextResponse } from "next/server";
import { addProduct, getSettings, listBusinesses, listProducts } from "@/lib/mock-db";

function resolveBusinessId(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) return businessId;
  return listBusinesses()[0]?.id ?? "";
}

export async function GET(req: Request) {
  const businessId = resolveBusinessId(req);
  return NextResponse.json({ items: listProducts(businessId) });
}

export async function POST(req: Request) {
  const businessId = resolveBusinessId(req);
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const salePrice = Number(body.salePrice ?? 0);
  const costPrice = Number(body.costPrice ?? 0);
  const stockOnHand = Number(body.stockOnHand ?? 0);
  const criticalStockLevel = Number(body.criticalStockLevel ?? 0);
  const qrCode = body.qrCode ? String(body.qrCode).trim() : undefined;
  const vatRate =
    body.vatRate !== undefined && body.vatRate !== null
      ? Number(body.vatRate)
      : getSettings(businessId).defaultVatRate;

  if (!name) {
    return NextResponse.json({ error: "Ürün adı zorunlu." }, { status: 400 });
  }

  if (Number.isNaN(salePrice) || Number.isNaN(costPrice) || Number.isNaN(stockOnHand)) {
    return NextResponse.json({ error: "Fiyat ve stok alanları sayısal olmalı." }, { status: 400 });
  }

  const created = addProduct({
    businessId,
    name,
    category: category || undefined,
    salePrice,
    costPrice,
    vatRate: Number.isNaN(vatRate) ? getSettings(businessId).defaultVatRate : vatRate,
    criticalStockLevel: Number.isNaN(criticalStockLevel) ? 0 : criticalStockLevel,
    stockOnHand,
    qrCode: qrCode || undefined,
  });

  return NextResponse.json({ item: created });
}
