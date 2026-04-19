import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ServiceType,
} from "@prisma/client";
import { fakerES_MX as faker } from "@faker-js/faker";
import { randomUUID } from "node:crypto";

const serviceTypes: ServiceType[] = [
  ServiceType.RECOGER,
  ServiceType.DOMICILIO,
  ServiceType.MESA,
  ServiceType.MOSTRADOR,
];

const paymentMethods: PaymentMethod[] = [
  PaymentMethod.EFECTIVO,
  PaymentMethod.TARJETA,
  PaymentMethod.TRANSFERENCIA,
  PaymentMethod.OTRO,
];

const customerNotes = [
  "Favor de confirmar tiempo de entrega por WhatsApp.",
  "Pagar con cambio, trae billete grande.",
  "Entregar en recepcion y llamar al llegar.",
  "Pedido para oficina, separar en bolsas.",
  "Sin cubiertos, gracias.",
  "Agregar servilletas extra.",
  "Tocar el timbre dos veces.",
  "Cliente frecuente, prefiere salsa aparte.",
];

const itemNotes = [
  "Sin cebolla, por favor.",
  "Salsa aparte.",
  "Bien dorado.",
  "Poco picante.",
  "Con extra limon.",
  "Sin crema.",
  "Todo separado.",
];

const cashCutNotes = [
  "Diferencia por cambio entregado en mostrador.",
  "Pago con billete grande registrado al cierre.",
  "Venta de mostrador capturada despues del corte.",
  "Propina separada de la caja.",
];

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function setTime(date: Date, hour: number, minute: number) {
  const copy = new Date(date);
  copy.setHours(hour, minute, 0, 0);
  return copy;
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function seedFromText(text: string) {
  return text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function fakeMexicanPhone(orderIndex: number) {
  const prefix = faker.helpers.arrayElement(["984", "998", "999", "981", "987", "993", "55", "81", "33"]);
  const remainingDigits = prefix.length === 2 ? 8 : 7;
  return `${prefix}${faker.string.numeric(remainingDigits)}`.slice(0, 10) || `984${String(1000000 + orderIndex).slice(0, 7)}`;
}

function realisticCustomerName(orderIndex: number) {
  if (orderIndex % 19 === 0) return `Oficina ${faker.company.name()}`;
  if (orderIndex % 23 === 0) return `Mesa de ${faker.person.firstName()}`;
  return faker.person.fullName();
}

function maybeNote(notes: string[], chancePercent: number) {
  return faker.number.int({ min: 1, max: 100 }) <= chancePercent
    ? faker.helpers.arrayElement(notes)
    : null;
}

function orderStatusForIndex(index: number, dayOffset: number): OrderStatus {
  if (dayOffset < -2) {
    if (index % 17 === 0) return OrderStatus.CANCELLED;
    return OrderStatus.COMPLETED;
  }
  if (index % 11 === 0) return OrderStatus.CANCELLED;
  if (index % 5 === 0) return OrderStatus.READY;
  if (index % 3 === 0) return OrderStatus.PREPARING;
  if (index % 2 === 0) return OrderStatus.CONFIRMED;
  return OrderStatus.PENDING;
}

export async function resetDemoTenantData(
  prisma: PrismaClient | Prisma.TransactionClient,
  tenantSlug: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tenant || !tenant.isDemo || tenant.products.length === 0) {
    return { ok: false, reason: "Tenant demo no encontrado o sin productos" };
  }

  faker.seed(seedFromText(`${tenant.slug}-${new Date().toISOString().slice(0, 10)}`));

  await prisma.order.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.cashCut.deleteMany({ where: { tenantId: tenant.id } });

  const now = new Date();
  let orderIndex = 1;
  const orderRows = [];
  const orderItemRows = [];
  const cashCutRows = [];

  for (let day = -59; day <= 0; day += 1) {
    const baseDate = addDays(now, day);
    const isWeekend = [0, 5, 6].includes(baseDate.getDay());
    const baseOrders = tenant.version === "LITE" ? faker.number.int({ min: 4, max: 7 }) : faker.number.int({ min: 8, max: 15 });
    const ordersPerDay = isWeekend ? baseOrders + faker.number.int({ min: 2, max: 5 }) : baseOrders;
    const paidTotals = new Map<PaymentMethod, number>();

    for (let i = 0; i < ordersPerDay; i += 1) {
      const status = orderStatusForIndex(i + Math.abs(day), day);
      const serviceType = faker.helpers.arrayElement(serviceTypes);
      const paymentMethod = faker.helpers.arrayElement(paymentMethods);
      const isPaid = status === OrderStatus.COMPLETED || status === OrderStatus.READY || faker.datatype.boolean({ probability: 0.28 });
      const isCancelled = status === OrderStatus.CANCELLED;
      const rushHour = faker.helpers.arrayElement([12, 13, 14, 19, 20, 21]);
      const createdAt = setTime(
        baseDate,
        faker.datatype.boolean({ probability: 0.62 }) ? rushHour : faker.number.int({ min: 9, max: 22 }),
        faker.number.int({ min: 0, max: 59 }),
      );
      const shuffledProducts = faker.helpers.shuffle(tenant.products).slice(0, faker.number.int({ min: 1, max: 3 }));
      const productA = shuffledProducts[0] ?? pick(tenant.products, i + Math.abs(day));
      const productB = shuffledProducts[1];
      const productC = shuffledProducts[2];
      const qtyA = faker.number.int({ min: 1, max: serviceType === ServiceType.MESA ? 4 : 3 });
      const qtyB = productB ? faker.number.int({ min: 1, max: 2 }) : 0;
      const qtyC = productC && faker.datatype.boolean({ probability: 0.35 }) ? 1 : 0;
      const lineA = Number(productA.price) * qtyA;
      const lineB = qtyB ? Number(productB.price) * qtyB : 0;
      const lineC = qtyC && productC ? Number(productC.price) * qtyC : 0;
      const total = lineA + lineB + lineC;

      if (isPaid && !isCancelled) {
        paidTotals.set(paymentMethod, (paidTotals.get(paymentMethod) ?? 0) + total);
      }

      const orderId = randomUUID();
      orderRows.push({
        id: orderId,
        tenantId: tenant.id,
        orderNumber: `${tenant.slug.slice(0, 3).toUpperCase()}-D${String(orderIndex).padStart(5, "0")}`,
        customerName: realisticCustomerName(orderIndex),
        customerPhone: fakeMexicanPhone(orderIndex),
        customerNotes: maybeNote(customerNotes, 22),
        subtotal: new Prisma.Decimal(total),
        total: new Prisma.Decimal(total),
        status,
        serviceType,
        tableName: serviceType === ServiceType.MESA ? `Mesa ${faker.number.int({ min: 1, max: 18 })}` : null,
        paymentStatus: isCancelled
          ? PaymentStatus.CANCELADO
          : isPaid
            ? PaymentStatus.PAGADO
            : PaymentStatus.PENDIENTE,
        paymentMethod: isPaid && !isCancelled ? paymentMethod : null,
        paidAt: isPaid && !isCancelled ? new Date(createdAt.getTime() + 25 * 60 * 1000) : null,
        createdAt,
        updatedAt: createdAt,
      });
      orderItemRows.push({
        orderId,
        productId: productA.id,
        productName: productA.name,
        quantity: qtyA,
        unitPrice: productA.price,
        totalPrice: new Prisma.Decimal(lineA),
        specialNotes: maybeNote(itemNotes, 18),
        createdAt,
        updatedAt: createdAt,
      });
      if (qtyB) {
        orderItemRows.push({
          orderId,
          productId: productB.id,
          productName: productB.name,
          quantity: qtyB,
          unitPrice: productB.price,
          totalPrice: new Prisma.Decimal(lineB),
          createdAt,
          updatedAt: createdAt,
        });
      }
      if (qtyC && productC) {
        orderItemRows.push({
          orderId,
          productId: productC.id,
          productName: productC.name,
          quantity: qtyC,
          unitPrice: productC.price,
          totalPrice: new Prisma.Decimal(lineC),
          specialNotes: maybeNote(itemNotes, 12),
          createdAt,
          updatedAt: createdAt,
        });
      }

      orderIndex += 1;
    }

    const cashSales = paidTotals.get(PaymentMethod.EFECTIVO) ?? 0;
    const cardSales = paidTotals.get(PaymentMethod.TARJETA) ?? 0;
    const transferSales = paidTotals.get(PaymentMethod.TRANSFERENCIA) ?? 0;
    const otherSales = paidTotals.get(PaymentMethod.OTRO) ?? 0;
    const openingAmount = faker.number.int({ min: 500, max: 1800, multipleOf: 50 });
    const expectedAmount = openingAmount + cashSales;
    const cashDifference = faker.datatype.boolean({ probability: 0.16 })
      ? faker.helpers.arrayElement([-75, -50, -25, 20, 35, 50])
      : 0;
    const countedAmount = expectedAmount + cashDifference;

    cashCutRows.push({
      tenantId: tenant.id,
      openedAt: setTime(baseDate, faker.number.int({ min: 7, max: 10 }), faker.helpers.arrayElement([0, 15, 30])),
      closedAt: setTime(baseDate, faker.number.int({ min: 21, max: 23 }), faker.helpers.arrayElement([0, 15, 30, 45])),
      openingAmount: new Prisma.Decimal(openingAmount),
      cashSales: new Prisma.Decimal(cashSales),
      cardSales: new Prisma.Decimal(cardSales),
      transferSales: new Prisma.Decimal(transferSales),
      otherSales: new Prisma.Decimal(otherSales),
      expectedAmount: new Prisma.Decimal(expectedAmount),
      countedAmount: new Prisma.Decimal(countedAmount),
      difference: new Prisma.Decimal(countedAmount - expectedAmount),
      notes: cashDifference !== 0 ? faker.helpers.arrayElement(cashCutNotes) : null,
    });
  }

  await prisma.order.createMany({ data: orderRows });
  await prisma.orderItem.createMany({ data: orderItemRows });
  await prisma.cashCut.createMany({ data: cashCutRows });

  const resetEveryDays = tenant.demoResetEveryDays || 5;
  const nextReset = addDays(now, resetEveryDays);
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      demoLastResetAt: now,
      demoNextResetAt: nextReset,
    },
  });

  return { ok: true, tenantSlug, nextReset };
}

export async function resetDueDemoTenants(prisma: PrismaClient) {
  const now = new Date();
  const dueTenants = await prisma.tenant.findMany({
    where: {
      isDemo: true,
      OR: [{ demoNextResetAt: null }, { demoNextResetAt: { lte: now } }],
    },
    select: { slug: true },
  });

  const results = [];
  for (const tenant of dueTenants) {
    results.push(await resetDemoTenantData(prisma, tenant.slug));
  }

  return results;
}
