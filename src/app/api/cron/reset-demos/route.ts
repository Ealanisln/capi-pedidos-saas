import { NextResponse } from "next/server";
import { resetDueDemoTenants } from "@/lib/demo-reset";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const results = await resetDueDemoTenants(prisma);
  return NextResponse.json({ ok: true, results });
}
