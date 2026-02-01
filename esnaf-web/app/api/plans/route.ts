import { NextResponse } from "next/server";
import { listPlans, savePlans } from "@/lib/mock-db";
import { BusinessPlan } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ items: listPlans() });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const plans = Array.isArray(body.plans) ? (body.plans as BusinessPlan[]) : null;
  if (!plans) {
    return NextResponse.json({ error: "plans zorunlu." }, { status: 400 });
  }
  const updated = savePlans(plans);
  return NextResponse.json({ items: updated });
}
