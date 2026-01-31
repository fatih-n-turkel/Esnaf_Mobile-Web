import { NextResponse } from "next/server";
import { listUsers } from "@/lib/mock-db";

export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();

  if (!username || !password) {
    return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu." }, { status: 400 });
  }

  const user = listUsers().find(
    (u) => u.username.toLowerCase() === username && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  const { password: _password, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
