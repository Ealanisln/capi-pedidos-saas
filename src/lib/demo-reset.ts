import {
  CashMovementType,
  CashSessionStatus,
  OrderLockStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ServiceType,
  TableStatus,
  UserRole,
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
  "Paga con billete grande, preparar cambio.",
  "Entregar en recepción y llamar al llegar.",
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
  "Con extra limón.",
  "Sin crema.",
  "Todo separado.",
];

const cashCutNotes = [
  "Diferencia por cambio entregado en mostrador.",
  "Pago con billete grande registrado al cierre.",
  "Venta de mostrador capturada después del corte.",
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

function roundCash(amount: number) {
  return Math.ceil(amount / 10) * 10;
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

function tableStatusForOrder(status: OrderStatus, paymentStatus: PaymentStatus, lockStatus: OrderLockStatus) {
  if (paymentStatus === PaymentStatus.PAGADO) return TableStatus.PAGADA;
  if (lockStatus === OrderLockStatus.PRECUENTA) return TableStatus.POR_COBRAR;
  if (status === OrderStatus.PREPARING || status === OrderStatus.CONFIRMED) return TableStatus.EN_COCINA;
  if (status === OrderStatus.READY) return TableStatus.POR_COBRAR;
  return TableStatus.OCUPADA;
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
      diningTables: { orderBy: { name: "asc" } },
      users: {
        where: { role: UserRole.MESERO },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!tenant || !tenant.isDemo || tenant.products.length === 0) {
    return { ok: false, reason: "Tenant demo no encontrado o sin productos" };
  }

  faker.seed(seedFromText(`${tenant.slug}-${new Date().toISOString().slice(0, 10)}`));

  await prisma.order.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.cashMovement.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.cashSession.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.cashCut.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.diningTable.updateMany({ where: { tenantId: tenant.id }, data: { status: TableStatus.LIBRE } });

  let cashDrawer = await prisma.cashDrawer.findFirst({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!cashDrawer) {
    cashDrawer = await prisma.cashDrawer.create({
      data: {
        tenantId: tenant.id,
        name: "Caja principal",
        slug: "caja_principal",
      },
    });
  }

  const now = new Date();
  const activeSession = await prisma.cashSession.create({
    data: {
      tenantId: tenant.id,
      drawerId: cashDrawer.id,
      openedById: tenant.users[0]?.id ?? null,
      status: CashSessionStatus.ABIERTA,
      openingAmount: new Prisma.Decimal(1200),
      notes: "Turno demo abierto automáticamente para pruebas.",
      openedAt: setTime(now, 8, 30),
    },
  });

  let orderIndex = 1;
  const orderRows: Prisma.OrderCreateManyInput[] = [];
  const orderItemRows: Prisma.OrderItemCreateManyInput[] = [];
  const orderPaymentRows: Prisma.OrderPaymentCreateManyInput[] = [];
  const cashCutRows: Prisma.CashCutCreateManyInput[] = [];
  const tableStatusUpdates = new Map<string, TableStatus>();

  for (let day = -59; day <= 0; day += 1) {
    const baseDate = addDays(now, day);
    const isWeekend = [0, 5, 6].includes(baseDate.getDay());
    const baseOrders = tenant.version === "LITE" ? faker.number.int({ min: 5, max: 8 }) : faker.number.int({ min: 10, max: 18 });
    const ordersPerDay = isWeekend ? baseOrders + faker.number.int({ min: 2, max: 6 }) : baseOrders;
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
      const shuffledProducts = faker.helpers.shuffle(tenant.products).slice(0, faker.number.int({ min: 1, max: 4 }));
      const selectedProducts = shuffledProducts.length ? shuffledProducts : [tenant.products[0]];
      let total = 0;
      const orderId = randomUUID();
      const table = serviceType === ServiceType.MESA && tenant.diningTables.length
        ? tenant.diningTables[(orderIndex + i) % tenant.diningTables.length]
        : null;
      const waiter = serviceType === ServiceType.MESA && tenant.users.length
        ? tenant.users[(orderIndex + i) % tenant.users.length]
        : null;
      const lockStatus = !isPaid && !isCancelled && day === 0 && i % 4 === 0
        ? OrderLockStatus.PRECUENTA
        : isPaid && !isCancelled
          ? OrderLockStatus.BLOQUEADA
          : OrderLockStatus.ABIERTA;

      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: serviceType === ServiceType.MESA ? 4 : 3 });
        const lineTotal = Number(product.price) * quantity;
        total += lineTotal;
        orderItemRows.push({
          orderId,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice: new Prisma.Decimal(lineTotal),
          specialNotes: maybeNote(itemNotes, 18),
          createdAt,
          updatedAt: createdAt,
        });
      }

      const paymentStatus = isCancelled
        ? PaymentStatus.CANCELADO
        : isPaid
          ? PaymentStatus.PAGADO
          : PaymentStatus.PENDIENTE;
      const tipAmount = paymentStatus === PaymentStatus.PAGADO && serviceType === ServiceType.MESA
        ? faker.helpers.arrayElement([0, 20, 35, 50, 75])
        : 0;
      const totalWithTip = total + tipAmount;
      const amountReceived = paymentMethod === PaymentMethod.EFECTIVO && paymentStatus === PaymentStatus.PAGADO
        ? roundCash(totalWithTip + faker.helpers.arrayElement([0, 0, 10, 20, 50]))
        : totalWithTip;
      const changeDue = paymentMethod === PaymentMethod.EFECTIVO && paymentStatus === PaymentStatus.PAGADO
        ? Math.max(amountReceived - totalWithTip, 0)
        : 0;
      const paidAt = paymentStatus === PaymentStatus.PAGADO ? new Date(createdAt.getTime() + faker.number.int({ min: 12, max: 45 }) * 60 * 1000) : null;
      const cashSessionId = day === 0 ? activeSession.id : null;

      if (paymentStatus === PaymentStatus.PAGADO) {
        paidTotals.set(paymentMethod, (paidTotals.get(paymentMethod) ?? 0) + totalWithTip);
        orderPaymentRows.push({
          tenantId: tenant.id,
          orderId,
          cashSessionId,
          userId: waiter?.id ?? tenant.users[0]?.id ?? null,
          method: paymentMethod,
          amount: new Prisma.Decimal(totalWithTip),
          amountReceived: new Prisma.Decimal(amountReceived),
          changeDue: new Prisma.Decimal(changeDue),
          reference: paymentMethod === PaymentMethod.EFECTIVO ? null : `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
          tipAmount: new Prisma.Decimal(tipAmount),
          createdAt: paidAt ?? createdAt,
        });
      }

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
        tableId: table?.id ?? null,
        tableName: table?.name ?? (serviceType === ServiceType.MESA ? `Mesa ${faker.number.int({ min: 1, max: tenant.maxTables })}` : null),
        assignedUserId: waiter?.id ?? null,
        paymentStatus,
        paymentMethod: paymentStatus === PaymentStatus.PAGADO ? paymentMethod : null,
        amountReceived: paymentStatus === PaymentStatus.PAGADO ? new Prisma.Decimal(amountReceived) : null,
        changeDue: paymentStatus === PaymentStatus.PAGADO ? new Prisma.Decimal(changeDue) : null,
        lockStatus,
        lockedAt: lockStatus !== OrderLockStatus.ABIERTA ? paidAt ?? createdAt : null,
        lockedReason: lockStatus === OrderLockStatus.PRECUENTA ? "Precuenta impresa; esperando cobro" : lockStatus === OrderLockStatus.BLOQUEADA ? "Cuenta cobrada" : null,
        paidAt,
        createdAt,
        updatedAt: createdAt,
      });

      if (day === 0 && table && paymentStatus !== PaymentStatus.CANCELADO) {
        tableStatusUpdates.set(table.id, tableStatusForOrder(status, paymentStatus, lockStatus));
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

    if (day < 0) {
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
  }

  await prisma.order.createMany({ data: orderRows });
  await prisma.orderItem.createMany({ data: orderItemRows });
  if (orderPaymentRows.length) await prisma.orderPayment.createMany({ data: orderPaymentRows });
  await prisma.cashCut.createMany({ data: cashCutRows });

  await prisma.cashMovement.createMany({
    data: [
      {
        tenantId: tenant.id,
        cashSessionId: activeSession.id,
        userId: tenant.users[0]?.id ?? null,
        type: CashMovementType.GASTO,
        amount: new Prisma.Decimal(180),
        reason: "Compra rápida de insumos para la demo",
        category: "Insumos",
      },
      {
        tenantId: tenant.id,
        cashSessionId: activeSession.id,
        userId: tenant.users[0]?.id ?? null,
        type: CashMovementType.ENTRADA,
        amount: new Prisma.Decimal(300),
        reason: "Ingreso extra para fondo de cambio",
        category: "Fondo",
      },
    ],
  });

  for (const [tableId, status] of tableStatusUpdates) {
    await prisma.diningTable.update({ where: { id: tableId }, data: { status } });
  }

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
