import { NextResponse } from "next/server";
import { updateProductMeta } from "@/lib/mock-db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const qrCode = body?.qrCode ? String(body.qrCode).trim() : undefined;
  const vatRate =
    body?.vatRate === null || body?.vatRate === undefined ? undefined : Number(body.vatRate);
  const updated = updateProductMeta(params.id, { qrCode, vatRate });

  if (!updated) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}
