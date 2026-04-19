import { PaymentStatus, PrinterArea, PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const productionAreas = new Set<PrinterArea>([
  PrinterArea.GENERAL,
  PrinterArea.COCINA,
  PrinterArea.BARRA,
  PrinterArea.CAJA,
]);

export async function createProductionPrintJobs(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
  });

  if (!order) return;

  const areas = new Set<PrinterArea>();
  order.items.forEach((item) => {
    const area = item.product?.category.printerArea ?? PrinterArea.COCINA;
    if (productionAreas.has(area)) areas.add(area);
  });

  if (areas.size === 0) areas.add(PrinterArea.COCINA);

  for (const area of areas) {
    const existing = await prisma.printJob.findFirst({
      where: {
        orderId: order.id,
        tenantId: order.tenantId,
        type: PrintJobType.PRODUCTION,
        area,
        status: { in: [PrintJobStatus.PENDING, PrintJobStatus.CLAIMED, PrintJobStatus.PRINTED] },
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.printJob.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          type: PrintJobType.PRODUCTION,
          area,
        },
      });
    }
  }
}

export async function createSalePrintJob(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      tenantId: true,
      paymentStatus: true,
    },
  });

  if (!order || order.paymentStatus !== PaymentStatus.PAGADO) return;

  const existing = await prisma.printJob.findFirst({
    where: {
      orderId: order.id,
      tenantId: order.tenantId,
      type: PrintJobType.SALE,
      status: { in: [PrintJobStatus.PENDING, PrintJobStatus.CLAIMED, PrintJobStatus.PRINTED] },
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.printJob.create({
    data: {
      tenantId: order.tenantId,
      orderId: order.id,
      type: PrintJobType.SALE,
      area: PrinterArea.CAJA,
    },
  });
}

export function buildTicketPath(orderId: string, type: PrintJobType, area: PrinterArea | null) {
  if (type === PrintJobType.SALE) return `/admin/orders/${orderId}/ticket?type=sale`;
  return `/admin/orders/${orderId}/ticket?type=production&area=${area ?? PrinterArea.COCINA}`;
}
