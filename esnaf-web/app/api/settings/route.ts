import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/mock-db";

export async function GET() {
  return NextResponse.json({ item: getSettings() });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const defaultVatRate = body.defaultVatRate;
  const posFeeType = body.posFeeType;
  const posFeeValue = body.posFeeValue;

  if (defaultVatRate === undefined || defaultVatRate === null || Number.isNaN(Number(defaultVatRate))) {
    return NextResponse.json({ error: "Geçerli bir KDV oranı girin." }, { status: 400 });
  }
  if (posFeeType !== undefined && posFeeType !== null && posFeeType !== "RATE" && posFeeType !== "FIXED") {
    return NextResponse.json({ error: "Geçerli bir POS komisyon tipi seçin." }, { status: 400 });
  }
  if (posFeeValue !== undefined && posFeeValue !== null && Number.isNaN(Number(posFeeValue))) {
    return NextResponse.json({ error: "Geçerli bir POS komisyon değeri girin." }, { status: 400 });
  }

  const updated = updateSettings({
    defaultVatRate: Number(defaultVatRate),
    ...(posFeeType !== undefined ? { posFeeType } : {}),
    ...(posFeeValue !== undefined ? { posFeeValue: Number(posFeeValue) } : {}),
  });
  return NextResponse.json({ item: updated });
}
