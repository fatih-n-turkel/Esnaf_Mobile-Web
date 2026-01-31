import { NextResponse } from "next/server";
import { deleteProduct, updateProductDetails } from "@/lib/mock-db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const qrCode = body?.qrCode ? String(body.qrCode).trim() : undefined;
  const category = body?.category === null ? null : body?.category ? String(body.category).trim() : undefined;
  const vatRate =
    body?.vatRate === null || body?.vatRate === undefined ? undefined : Number(body.vatRate);
  const salePrice = body?.salePrice === undefined ? undefined : Number(body.salePrice);
  const costPrice = body?.costPrice === undefined ? undefined : Number(body.costPrice);
  const criticalStockLevel =
    body?.criticalStockLevel === undefined ? undefined : Number(body.criticalStockLevel);
  const stockOnHand = body?.stockOnHand === undefined ? undefined : Number(body.stockOnHand);
  const branchId = body?.branchId === undefined ? undefined : body?.branchId;

  const updated = updateProductDetails(params.id, {
    qrCode,
    vatRate,
    category,
    salePrice,
    costPrice,
    criticalStockLevel,
    stockOnHand,
    branchId,
  });

  if (!updated) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const removed = deleteProduct(params.id);
  if (!removed) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: removed });
}
