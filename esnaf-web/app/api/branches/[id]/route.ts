import { NextResponse } from "next/server";
import { deleteBranch, updateBranchName } from "@/lib/mock-db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Bayi adı zorunlu." }, { status: 400 });
  }
  const updated = updateBranchName(params.id, name);
  if (!updated) {
    return NextResponse.json({ error: "Bayi bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const removed = deleteBranch(params.id);
  if (!removed) {
    return NextResponse.json({ error: "Bayi bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: removed });
}
