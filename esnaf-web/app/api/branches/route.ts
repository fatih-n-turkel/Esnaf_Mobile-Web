import { NextResponse } from "next/server";
import { addBranch, listBranches } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listBranches() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Bayi adı zorunlu." }, { status: 400 });
  }

  const created = addBranch(name);
  return NextResponse.json({ item: created });
}
