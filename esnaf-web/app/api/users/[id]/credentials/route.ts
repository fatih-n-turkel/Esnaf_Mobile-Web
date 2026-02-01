import { NextResponse } from "next/server";
import { updateUserCredentials } from "@/lib/mock-db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const username = body.username ? String(body.username).trim() : undefined;
  const password = body.password ? String(body.password).trim() : undefined;

  if (!username && !password) {
    return NextResponse.json({ error: "Yeni kullanıcı adı veya şifre gerekli." }, { status: 400 });
  }

  const updated = updateUserCredentials(params.id, { username, password });
  if (!updated) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}
