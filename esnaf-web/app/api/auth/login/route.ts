import { NextResponse } from "next/server";
import { listBusinesses, listUsers } from "@/lib/mock-db";

export async function POST(req: Request) {
  const body = await req.json();
  const businessName = String(body.businessName ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();

  if (!businessName || !username || !password) {
    return NextResponse.json(
      { error: "İşletme adı, kullanıcı adı ve şifre zorunlu." },
      { status: 400 }
    );
  }

  const business = listBusinesses().find(
    (item) => item.name.toLowerCase() === businessName.toLowerCase()
  );
  const user = listUsers().find((u) => u.username.toLowerCase() === username && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  if (user.role !== "YONETIM") {
    if (!business || business.id !== user.businessId) {
      return NextResponse.json({ error: "İşletme bilgisi doğrulanamadı." }, { status: 401 });
    }
  }

  const { password: _password, ...safeUser } = {
    ...user,
    businessName: user.businessName ?? business?.name ?? null,
  };
  return NextResponse.json({ user: safeUser });
}
