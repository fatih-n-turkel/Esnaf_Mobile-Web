import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ item: getSettings() });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const defaultVatRate = body.defaultVatRate;

  if (defaultVatRate === undefined || defaultVatRate === null || Number.isNaN(Number(defaultVatRate))) {
    return NextResponse.json({ error: "Geçerli bir KDV oranı girin." }, { status: 400 });
  }

  const updated = updateSettings({ defaultVatRate: Number(defaultVatRate) });
  return NextResponse.json({ item: updated });
}
