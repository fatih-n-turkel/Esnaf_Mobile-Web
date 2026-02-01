import { NextResponse } from "next/server";
import { addApplication, listApplications } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listApplications() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const businessName = String(body.businessName ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();

  if (!businessName || !username || !password) {
    return NextResponse.json({ error: "İşletme adı, kullanıcı adı ve şifre zorunlu." }, { status: 400 });
  }

  const created = addApplication({ businessName, username, password });
  return NextResponse.json({ item: created });
}
