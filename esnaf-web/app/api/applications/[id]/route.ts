import { NextResponse } from "next/server";
import { updateApplication } from "@/lib/mock-db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status;
  const createBusiness = Boolean(body.createBusiness ?? false);
  if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Geçerli bir durum gönderin." }, { status: 400 });
  }
  const updated = updateApplication(params.id, status, { createBusiness });
  if (!updated) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}
