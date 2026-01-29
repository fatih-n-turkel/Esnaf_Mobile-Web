import { NextResponse } from "next/server";
import { listProducts } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ items: listProducts() });
}
