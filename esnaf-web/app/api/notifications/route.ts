import { NextResponse } from "next/server";
import { listBusinesses, listNotifications, markNotificationsRead } from "@/lib/mock-db";

function resolveBusinessId(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) return businessId;
  return listBusinesses()[0]?.id ?? "";
}

export async function GET(req: Request) {
  const businessId = resolveBusinessId(req);
  return NextResponse.json({ items: listNotifications(businessId) });
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
