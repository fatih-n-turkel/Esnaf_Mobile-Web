import { NextResponse } from "next/server";
import { deleteBusiness, updateBusiness } from "@/lib/mock-db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const updated = updateBusiness(params.id, body ?? {});
  if (!updated) {
    return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  deleteBusiness(params.id);
  return NextResponse.json({ ok: true });
}
