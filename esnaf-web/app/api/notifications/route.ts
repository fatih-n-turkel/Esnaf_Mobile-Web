import { NextResponse } from "next/server";
import { listNotifications, markNotificationsRead } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listNotifications() });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (!ids.length) {
    return NextResponse.json({ error: "ids zorunlu" }, { status: 400 });
  }
  const items = markNotificationsRead(ids);
  return NextResponse.json({ items });
}
