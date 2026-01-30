import { NextResponse } from "next/server";
import { ensureProductQrCode } from "@/lib/mock-db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const qrCode = body?.qrCode ? String(body.qrCode).trim() : undefined;
  const updated = ensureProductQrCode(params.id, qrCode);

  if (!updated) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}
