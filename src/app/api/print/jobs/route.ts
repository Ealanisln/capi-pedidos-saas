import { PrinterArea, PrintJobStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildTicketPath } from "@/lib/print-jobs";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["PRINTED", "FAILED", "CLAIMED"]),
  error: z.string().max(500).optional(),
});

function isAuthorized(request: Request) {
  const configuredToken = process.env.PRINT_BRIDGE_TOKEN;
  if (!configuredToken) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${configuredToken}`;
}

function parseArea(value: string | null) {
  if (value === "GENERAL") return PrinterArea.GENERAL;
  if (value === "COCINA") return PrinterArea.COCINA;
  if (value === "BARRA") return PrinterArea.BARRA;
  if (value === "CAJA") return PrinterArea.CAJA;
  return null;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tenantSlug = url.searchParams.get("tenantSlug")?.trim();
  const area = parseArea(url.searchParams.get("area"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "10") || 10, 1), 50);

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug es requerido" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, businessName: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const jobs = await prisma.printJob.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: [PrintJobStatus.PENDING, PrintJobStatus.FAILED] },
      ...(area ? { area } : {}),
    },
    include: {
      station: {
        select: {
          id: true,
          name: true,
          area: true,
          deviceName: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          serviceType: true,
          tableName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  await prisma.printJob.updateMany({
    where: { id: { in: jobs.map((job) => job.id) } },
    data: {
      status: PrintJobStatus.CLAIMED,
      claimedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  return NextResponse.json({
    ok: true,
    tenant,
    jobs: jobs.map((job) => ({
      id: job.id,
      type: job.type,
      area: job.area,
      station: job.station,
      deviceName: job.station?.deviceName ?? null,
      status: PrintJobStatus.CLAIMED,
      order: job.order,
      ticketPath: buildTicketPath(job.orderId, job.type, job.area),
      ticketUrl: `${origin}${buildTicketPath(job.orderId, job.type, job.area)}`,
      ticketHtmlPath: `/api/print/jobs/${job.id}/ticket`,
      ticketHtmlUrl: `${origin}/api/print/jobs/${job.id}/ticket`,
      attempts: job.attempts + 1,
      createdAt: job.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const payload = parsed.data;
  const status = payload.status as PrintJobStatus;

  const job = await prisma.printJob.update({
    where: { id: payload.jobId },
    data: {
      status,
      lastError: status === PrintJobStatus.FAILED ? payload.error ?? "Error no especificado" : null,
      printedAt: status === PrintJobStatus.PRINTED ? new Date() : null,
      claimedAt: status === PrintJobStatus.CLAIMED ? new Date() : undefined,
    },
    select: {
      id: true,
      status: true,
      printedAt: true,
      lastError: true,
    },
  });

  return NextResponse.json({ ok: true, job });
}
