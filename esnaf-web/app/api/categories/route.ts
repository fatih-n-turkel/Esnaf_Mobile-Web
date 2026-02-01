import { NextResponse } from "next/server";
import { addCategory, listBusinesses, listCategories } from "@/lib/mock-db";

function resolveBusinessId(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) return businessId;
  return listBusinesses()[0]?.id ?? "";
}

export async function GET(req: Request) {
  const businessId = resolveBusinessId(req);
  return NextResponse.json({ items: listCategories(businessId) });
}

export async function POST(req: Request) {
  const businessId = resolveBusinessId(req);
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Kategori adı zorunlu." }, { status: 400 });
  }
  const created = addCategory(name, businessId);
  return NextResponse.json({ item: created });
}
