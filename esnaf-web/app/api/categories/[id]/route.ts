import { NextResponse } from "next/server";
import { renameCategory } from "@/lib/mock-db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Kategori adı zorunlu." }, { status: 400 });
  }
  const updated = renameCategory(params.id, name);
  if (!updated) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}
