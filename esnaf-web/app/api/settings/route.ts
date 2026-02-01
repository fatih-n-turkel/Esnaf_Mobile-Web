import { NextResponse } from "next/server";
import { getSettings, listBusinesses, updateSettings } from "@/lib/mock-db";

function resolveBusinessId(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) return businessId;
  return listBusinesses()[0]?.id ?? "";
}

export async function GET(req: Request) {
  const businessId = resolveBusinessId(req);
  return NextResponse.json({ item: getSettings(businessId) });
}

export async function PUT(req: Request) {
  const businessId = resolveBusinessId(req);
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

  const updated = updateSettings(businessId, {
    defaultVatRate: Number(defaultVatRate),
    ...(posFeeType !== undefined ? { posFeeType } : {}),
    ...(posFeeValue !== undefined ? { posFeeValue: Number(posFeeValue) } : {}),
  });
  return NextResponse.json({ item: updated });
}
