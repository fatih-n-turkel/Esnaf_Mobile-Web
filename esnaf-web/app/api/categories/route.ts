import { NextResponse } from "next/server";
import { addCategory, listCategories } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listCategories() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Kategori adı zorunlu." }, { status: 400 });
  }
  const created = addCategory(name);
  return NextResponse.json({ item: created });
}
