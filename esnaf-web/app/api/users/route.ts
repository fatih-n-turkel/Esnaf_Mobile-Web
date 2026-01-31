import { NextResponse } from "next/server";
import { listUsers, saveUsers } from "@/lib/mock-db";
import { DemoUser } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ items: listUsers() });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const users = Array.isArray(body.users) ? (body.users as DemoUser[]) : null;

  if (!users) {
    return NextResponse.json({ error: "users zorunlu." }, { status: 400 });
  }

  const updated = saveUsers(users);
  return NextResponse.json({ items: updated });
}
