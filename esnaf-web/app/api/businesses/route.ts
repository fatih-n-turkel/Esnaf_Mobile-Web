import { NextResponse } from "next/server";
import { listBusinesses } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listBusinesses() });
}
