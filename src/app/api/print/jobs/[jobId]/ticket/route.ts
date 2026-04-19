import { PrinterArea } from "@prisma/client";
import { NextResponse } from "next/server";
import { renderTicketHtml } from "@/lib/ticket-html";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ jobId: string }>;
};

function isAuthorized(request: Request) {
  const configuredToken = process.env.PRINT_BRIDGE_TOKEN;
  if (!configuredToken) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${configuredToken}`;
}

export async function GET(request: Request, { params }: RouteProps) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await prisma.printJob.findUnique({
    where: { id: jobId },
    include: {
      order: {
        include: {
          tenant: {
            include: { settings: true },
          },
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  const html = renderTicketHtml(job.order, {
    type: job.type === "PRODUCTION" ? "production" : "sale",
    area: job.area ?? PrinterArea.COCINA,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
