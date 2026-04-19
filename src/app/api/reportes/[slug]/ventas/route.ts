import { ExportScope, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashExportToken, toCsv } from "@/lib/export-tokens";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00-05:00`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function endOfDate(value: string | null, fallback: Date) {
  const date = parseDate(value, fallback);
  date.setHours(23, 59, 59, 999);
  return date;
}

function clampDateRange(from: Date, to: Date) {
  const maxDays = 366;
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  if (diffDays <= maxDays) return { from, to };
  const clampedFrom = new Date(to);
  clampedFrom.setDate(clampedFrom.getDate() - maxDays);
  clampedFrom.setHours(0, 0, 0, 0);
  return { from: clampedFrom, to };
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const format = (url.searchParams.get("formato") ?? "csv").toLowerCase();

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, slug: true, businessName: true, isActive: true },
  });

  if (!tenant || !tenant.isActive) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const credential = await prisma.exportCredential.findFirst({
    where: {
      tenantId: tenant.id,
      tokenHash: hashExportToken(token),
      scope: ExportScope.VENTAS,
      revokedAt: null,
    },
  });

  if (!credential || (credential.expiresAt && credential.expiresAt < new Date())) {
    return NextResponse.json({ error: "Token invalido o vencido" }, { status: 401 });
  }

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 60);
  defaultFrom.setHours(0, 0, 0, 0);
  const { from, to } = clampDateRange(
    parseDate(url.searchParams.get("desde"), defaultFrom),
    endOfDate(url.searchParams.get("hasta"), now),
  );

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: from, lte: to },
    },
    include: {
      assignedUser: { select: { name: true, email: true, role: true } },
      table: { select: { name: true, area: true } },
      payments: true,
      items: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = orders.map((order) => {
    const totalPagado = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const propinas = order.payments.reduce((sum, payment) => sum + Number(payment.tipAmount), 0);
    return {
      restaurante: tenant.businessName,
      slug_restaurante: tenant.slug,
      folio: order.orderNumber,
      fecha: order.createdAt.toISOString(),
      cliente: order.customerName ?? "",
      telefono: order.customerPhone ?? "",
      tipo_servicio: order.serviceType,
      mesa: order.table?.name ?? order.tableName ?? "",
      area_mesa: order.table?.area ?? "",
      estado_pedido: order.status,
      estado_pago: order.paymentStatus,
      metodo_pago: order.paymentMethod ?? "",
      subtotal_mxn: Number(order.subtotal).toFixed(2),
      total_mxn: Number(order.total).toFixed(2),
      total_pagado_mxn: totalPagado.toFixed(2),
      propina_mxn: propinas.toFixed(2),
      cambio_mxn: Number(order.changeDue ?? 0).toFixed(2),
      cantidad_productos: order.items.reduce((sum, item) => sum + item.quantity, 0),
      productos: order.items.map((item) => `${item.quantity}x ${item.productName}`).join(" | "),
      mesero_o_usuario: order.assignedUser?.name ?? "",
      cancelado: order.status === "CANCELLED" ? "SI" : "NO",
      pagado: order.paymentStatus === PaymentStatus.PAGADO ? "SI" : "NO",
    };
  });

  await prisma.$transaction([
    prisma.exportCredential.update({
      where: { id: credential.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    }),
    prisma.exportAuditLog.create({
      data: {
        tenantId: tenant.id,
        credentialId: credential.id,
        scope: ExportScope.VENTAS,
        format: format === "json" ? "json" : "csv",
        rowCount: rows.length,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    }),
  ]);

  if (format === "json") {
    return NextResponse.json(
      {
        restaurante: tenant.businessName,
        desde: from.toISOString(),
        hasta: to.toISOString(),
        totalRegistros: rows.length,
        generadoEn: new Date().toISOString(),
        filas: rows,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename=\"ventas-${tenant.slug}.csv\"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
