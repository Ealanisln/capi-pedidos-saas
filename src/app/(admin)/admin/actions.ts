"use server";

import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrinterArea,
  PublicTemplate,
  CashMovementType,
  CashSessionStatus,
  OrderLockStatus,
  TicketPaperWidth,
  UserRole,
  Version,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth";
import { resetDemoTenantData } from "@/lib/demo-reset";
import { generateExportToken, hashExportToken, tokenPrefix } from "@/lib/export-tokens";
import { applyPlanLimits, planLimits } from "@/lib/plan-limits";
import { createSalePrintJob } from "@/lib/print-jobs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/tenant";

function parseVersion(value: string): Version {
  if (value === "PRO") return Version.PRO;
  if (value === "ENTERPRISE") return Version.ENTERPRISE;
  return Version.LITE;
}

function parsePublicTemplate(value: string): PublicTemplate {
  if (value === "MERCADO") return PublicTemplate.MERCADO;
  if (value === "ELEGANTE") return PublicTemplate.ELEGANTE;
  if (value === "TAQUERIA") return PublicTemplate.TAQUERIA;
  if (value === "MARISQUERIA") return PublicTemplate.MARISQUERIA;
  if (value === "CAFETERIA") return PublicTemplate.CAFETERIA;
  if (value === "PIZZERIA") return PublicTemplate.PIZZERIA;
  if (value === "SUSHI") return PublicTemplate.SUSHI;
  if (value === "HAMBURGUESAS") return PublicTemplate.HAMBURGUESAS;
  if (value === "ANTOJITOS") return PublicTemplate.ANTOJITOS;
  if (value === "BAR_BOTANERO") return PublicTemplate.BAR_BOTANERO;
  if (value === "DARK_KITCHEN") return PublicTemplate.DARK_KITCHEN;
  if (value === "POLLERIA") return PublicTemplate.POLLERIA;
  return PublicTemplate.CLASICO;
}

function parsePaymentMethod(value: string): PaymentMethod {
  if (value === "TARJETA") return PaymentMethod.TARJETA;
  if (value === "TRANSFERENCIA") return PaymentMethod.TRANSFERENCIA;
  if (value === "OTRO") return PaymentMethod.OTRO;
  return PaymentMethod.EFECTIVO;
}

function parsePrinterArea(value: string): PrinterArea {
  if (value === "GENERAL") return PrinterArea.GENERAL;
  if (value === "BARRA") return PrinterArea.BARRA;
  if (value === "CAJA") return PrinterArea.CAJA;
  return PrinterArea.COCINA;
}

function parseTicketPaperWidth(value: string): TicketPaperWidth {
  if (value === "MM_58") return TicketPaperWidth.MM_58;
  return TicketPaperWidth.MM_80;
}

function parseCashMovementType(value: string): CashMovementType {
  if (value === "ENTRADA") return CashMovementType.ENTRADA;
  if (value === "RETIRO") return CashMovementType.RETIRO;
  if (value === "GASTO") return CashMovementType.GASTO;
  if (value === "ADELANTO") return CashMovementType.ADELANTO;
  if (value === "PAGO_PROVEEDOR") return CashMovementType.PAGO_PROVEEDOR;
  if (value === "PROPINA") return CashMovementType.PROPINA;
  if (value === "AJUSTE") return CashMovementType.AJUSTE;
  return CashMovementType.SALIDA;
}

async function getActiveCashSession(tenantId: string, drawerId?: string) {
  return prisma.cashSession.findFirst({
    where: {
      tenantId,
      status: CashSessionStatus.ABIERTA,
      ...(drawerId ? { drawerId } : {}),
    },
    orderBy: { openedAt: "desc" },
  });
}

async function calculateCashSessionPreview(cashSessionId: string) {
  const [session, payments, movements] = await Promise.all([
    prisma.cashSession.findUnique({
      where: { id: cashSessionId },
    }),
    prisma.orderPayment.findMany({
      where: { cashSessionId },
    }),
    prisma.cashMovement.findMany({
      where: { cashSessionId },
    }),
  ]);

  if (!session) return null;

  const totals = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
    tips: 0,
    entries: 0,
    exits: 0,
  };

  payments.forEach((payment) => {
    const amount = Number(payment.amount);
    totals.tips += Number(payment.tipAmount);
    if (payment.method === PaymentMethod.EFECTIVO) totals.cash += amount;
    else if (payment.method === PaymentMethod.TARJETA) totals.card += amount;
    else if (payment.method === PaymentMethod.TRANSFERENCIA) totals.transfer += amount;
    else totals.other += amount;
  });

  movements.forEach((movement) => {
    const amount = Number(movement.amount);
    if (movement.type === CashMovementType.ENTRADA || movement.type === CashMovementType.AJUSTE) {
      totals.entries += amount;
    } else {
      totals.exits += amount;
    }
  });

  const expected = Number(session.openingAmount) + totals.cash + totals.entries - totals.exits;
  return { session, payments, movements, totals, expected };
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireAuthSession();

  const name = String(formData.get("name") ?? "").trim();
  const printerArea = parsePrinterArea(String(formData.get("printerArea") ?? "COCINA"));
  if (!name) return;

  const count = await prisma.category.count({
    where: { tenantId: session.user.tenantId },
  });

  await prisma.category.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      slug: slugify(name),
      position: count + 1,
      printerArea,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
}

export async function updateCategoryAction(formData: FormData) {
  const session = await requireAuthSession();
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const printerArea = parsePrinterArea(String(formData.get("printerArea") ?? "COCINA"));
  if (!categoryId || !name) return;

  await prisma.category.updateMany({
    where: { id: categoryId, tenantId: session.user.tenantId },
    data: { name, printerArea },
  });

  revalidatePath("/admin/categories");
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`);
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await requireAuthSession();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return;

  const productsCount = await prisma.product.count({
    where: { categoryId, tenantId: session.user.tenantId },
  });
  if (productsCount > 0) return;

  await prisma.category.deleteMany({
    where: { id: categoryId, tenantId: session.user.tenantId },
  });

  revalidatePath("/admin/categories");
}

export async function createPrinterStationAction(formData: FormData) {
  const session = await requireAuthSession();
  const name = String(formData.get("name") ?? "").trim();
  const area = parsePrinterArea(String(formData.get("area") ?? "COCINA"));
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const isDefault = String(formData.get("isDefault") ?? "") === "on";
  if (!name) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { version: true },
  });
  if (!tenant) return;

  const count = await prisma.printerStation.count({
    where: { tenantId: session.user.tenantId, isActive: true },
  });
  if (count >= planLimits(tenant.version).printerStations) return;

  if (isDefault) {
    await prisma.printerStation.updateMany({
      where: { tenantId: session.user.tenantId, area },
      data: { isDefault: false },
    });
  }

  await prisma.printerStation.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
      area,
      deviceName: deviceName || null,
      isDefault,
    },
  });

  revalidatePath("/admin/print");
  revalidatePath("/admin/impresion");
}

export async function updatePrinterStationAction(formData: FormData) {
  const session = await requireAuthSession();
  const stationId = String(formData.get("stationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const area = parsePrinterArea(String(formData.get("area") ?? "COCINA"));
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const isDefault = String(formData.get("isDefault") ?? "") === "on";
  const isActive = String(formData.get("isActive") ?? "") === "on";
  if (!stationId || !name) return;

  if (isDefault) {
    await prisma.printerStation.updateMany({
      where: { tenantId: session.user.tenantId, area, id: { not: stationId } },
      data: { isDefault: false },
    });
  }

  await prisma.printerStation.updateMany({
    where: { id: stationId, tenantId: session.user.tenantId },
    data: {
      name,
      area,
      deviceName: deviceName || null,
      isDefault,
      isActive,
    },
  });

  revalidatePath("/admin/print");
  revalidatePath("/admin/impresion");
  revalidatePath("/admin/categories");
}

export async function assignCategoryPrinterStationAction(formData: FormData) {
  const session = await requireAuthSession();
  const categoryId = String(formData.get("categoryId") ?? "");
  const stationId = String(formData.get("printerStationId") ?? "");
  if (!categoryId) return;

  const station = stationId
    ? await prisma.printerStation.findFirst({
        where: { id: stationId, tenantId: session.user.tenantId },
      })
    : null;

  await prisma.category.updateMany({
    where: { id: categoryId, tenantId: session.user.tenantId },
    data: {
      printerStationId: station?.id ?? null,
      ...(station ? { printerArea: station.area } : {}),
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/print");
}

export async function createProductAction(formData: FormData) {
  const session = await requireAuthSession();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "");
  const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim();
  const price = Number(priceRaw);

  if (!name || !categoryId || Number.isNaN(price) || price <= 0) return;

  await prisma.product.create({
    data: {
      tenantId: session.user.tenantId,
      categoryId,
      name,
      slug: `${slugify(name)}-${Date.now().toString().slice(-5)}`,
      description: description || null,
      imageUrl: imageUrlRaw || null,
      price: new Prisma.Decimal(price),
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

export async function updateProductAction(formData: FormData) {
  const session = await requireAuthSession();
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const price = Number(priceRaw);

  if (!productId || !name || !categoryId || Number.isNaN(price) || price <= 0) return;

  await prisma.product.updateMany({
    where: { id: productId, tenantId: session.user.tenantId },
    data: {
      name,
      description: description || null,
      categoryId,
      imageUrl: imageUrlRaw || null,
      price: new Prisma.Decimal(price),
    },
  });

  revalidatePath("/admin/products");
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`);
}

export async function addIngredientAction(formData: FormData) {
  const session = await requireAuthSession();
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!productId || !name) return;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
    include: { ingredients: true },
  });
  if (!product) return;

  await prisma.ingredient.create({
    data: {
      productId: product.id,
      name,
      position: product.ingredients.length + 1,
    },
  });

  revalidatePath("/admin/products");
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`);
}

export async function removeIngredientAction(formData: FormData) {
  const session = await requireAuthSession();
  const ingredientId = String(formData.get("ingredientId") ?? "");
  if (!ingredientId) return;

  await prisma.ingredient.deleteMany({
    where: {
      id: ingredientId,
      product: { tenantId: session.user.tenantId },
    },
  });

  revalidatePath("/admin/products");
}

export async function addModifierGroupAction(formData: FormData) {
  const session = await requireAuthSession();
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const isRequired = String(formData.get("isRequired") ?? "") === "on";
  const allowMultiple = String(formData.get("allowMultiple") ?? "") === "on";
  const minRaw = String(formData.get("minSelection") ?? "0");
  const maxRaw = String(formData.get("maxSelection") ?? "").trim();
  const minSelection = Math.max(0, Number(minRaw) || 0);
  const maxSelection = maxRaw ? Math.max(minSelection, Number(maxRaw) || minSelection) : null;

  if (!productId || !name) return;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.user.tenantId },
    include: { modifierGroups: true },
  });
  if (!product) return;

  await prisma.modifierGroup.create({
    data: {
      productId: product.id,
      name,
      isRequired,
      allowMultiple,
      minSelection,
      maxSelection,
      position: product.modifierGroups.length + 1,
    },
  });

  revalidatePath("/admin/products");
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`);
}

export async function removeModifierGroupAction(formData: FormData) {
  const session = await requireAuthSession();
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  await prisma.modifierGroup.deleteMany({
    where: {
      id: groupId,
      product: { tenantId: session.user.tenantId },
    },
  });

  revalidatePath("/admin/products");
}

export async function addModifierAction(formData: FormData) {
  const session = await requireAuthSession();
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "0"));
  if (!groupId || !name || Number.isNaN(price) || price < 0) return;

  const group = await prisma.modifierGroup.findFirst({
    where: {
      id: groupId,
      product: { tenantId: session.user.tenantId },
    },
    include: { modifiers: true },
  });
  if (!group) return;

  await prisma.modifier.create({
    data: {
      groupId: group.id,
      name,
      price: new Prisma.Decimal(price),
      position: group.modifiers.length + 1,
      isActive: true,
    },
  });

  revalidatePath("/admin/products");
}

export async function removeModifierAction(formData: FormData) {
  const session = await requireAuthSession();
  const modifierId = String(formData.get("modifierId") ?? "");
  if (!modifierId) return;

  await prisma.modifier.deleteMany({
    where: {
      id: modifierId,
      group: {
        product: { tenantId: session.user.tenantId },
      },
    },
  });

  revalidatePath("/admin/products");
}

export async function toggleProductAvailabilityAction(formData: FormData) {
  const session = await requireAuthSession();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId: session.user.tenantId,
    },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      isAvailable: !product.isAvailable,
    },
  });

  revalidatePath("/admin/products");
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (tenant?.slug) {
    revalidatePath(`/${tenant.slug}`);
  }
}

export async function updateOrderStatusAction(formData: FormData) {
  const session = await requireAuthSession();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!orderId || !Object.values(OrderStatus).includes(status as OrderStatus)) return;

  await prisma.order.updateMany({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
    data: {
      status: status as OrderStatus,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin/cash");
  revalidatePath("/admin");
}

export async function markOrderPaidAction(formData: FormData) {
  const session = await requireAuthSession();
  const orderId = String(formData.get("orderId") ?? "");
  const method = parsePaymentMethod(String(formData.get("paymentMethod") ?? "EFECTIVO"));
  const amountReceivedRaw = String(formData.get("amountReceived") ?? "").trim();
  const cashSessionId = String(formData.get("cashSessionId") ?? "").trim();
  const tipAmount = Math.max(0, Number(String(formData.get("tipAmount") ?? "0")) || 0);
  const reference = String(formData.get("reference") ?? "").trim();
  if (!orderId) return;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
    select: { total: true },
  });

  if (!order) return;

  const total = Number(order.total);
  const totalWithTip = total + tipAmount;
  const amountReceived =
    method === PaymentMethod.EFECTIVO && amountReceivedRaw
      ? Math.max(Number(amountReceivedRaw) || 0, totalWithTip)
      : totalWithTip;
  const changeDue = method === PaymentMethod.EFECTIVO ? Math.max(amountReceived - totalWithTip, 0) : 0;

  const activeSession = cashSessionId
    ? await prisma.cashSession.findFirst({
        where: {
          id: cashSessionId,
          tenantId: session.user.tenantId,
          status: CashSessionStatus.ABIERTA,
        },
      })
    : await getActiveCashSession(session.user.tenantId);

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
    data: {
      paymentStatus: PaymentStatus.PAGADO,
      paymentMethod: method,
      amountReceived: new Prisma.Decimal(amountReceived),
      changeDue: new Prisma.Decimal(changeDue),
      lockStatus: OrderLockStatus.BLOQUEADA,
      lockedAt: new Date(),
      lockedReason: "Cuenta cobrada",
      paidAt: new Date(),
    },
  });

  if (result.count > 0) {
    await prisma.orderPayment.create({
      data: {
        tenantId: session.user.tenantId,
        orderId,
        cashSessionId: activeSession?.id ?? null,
        userId: session.user.id,
        method,
        amount: new Prisma.Decimal(totalWithTip),
        amountReceived: new Prisma.Decimal(amountReceived),
        changeDue: new Prisma.Decimal(changeDue),
        tipAmount: new Prisma.Decimal(tipAmount),
        reference: reference || null,
      },
    });
    await createSalePrintJob(orderId);
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/print");
}

export async function markOrderUnpaidAction(formData: FormData) {
  const session = await requireAuthSession();
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  await prisma.order.updateMany({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
    data: {
      paymentStatus: PaymentStatus.PENDIENTE,
      paymentMethod: null,
      amountReceived: null,
      changeDue: null,
      lockStatus: OrderLockStatus.ABIERTA,
      lockedAt: null,
      lockedReason: null,
      paidAt: null,
    },
  });

  await prisma.orderPayment.deleteMany({
    where: {
      orderId,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/orders");
}

export async function lockOrderForPrecheckAction(formData: FormData) {
  const session = await requireAuthSession();
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, tenantId: session.user.tenantId },
    data: {
      lockStatus: OrderLockStatus.PRECUENTA,
      lockedAt: new Date(),
      lockedReason: "Precuenta impresa; esperando cobro",
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/cash");
}

export async function unlockOrderAction(formData: FormData) {
  const session = await requireAuthSession();
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, tenantId: session.user.tenantId },
    data: {
      lockStatus: OrderLockStatus.ABIERTA,
      lockedAt: null,
      lockedReason: reason || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/cash");
}

export async function createCashCutAction(formData: FormData) {
  const session = await requireAuthSession();
  const tenantId = session.user.tenantId;
  const openingAmount = Number(String(formData.get("openingAmount") ?? "0")) || 0;
  const countedAmount = Number(String(formData.get("countedAmount") ?? "0")) || 0;
  const notes = String(formData.get("notes") ?? "").trim();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const paidOrders = await prisma.order.findMany({
    where: {
      tenantId,
      paymentStatus: PaymentStatus.PAGADO,
      paidAt: { gte: start, lte: end },
    },
  });

  const totals = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
  };

  paidOrders.forEach((order) => {
    const total = Number(order.total);
    if (order.paymentMethod === PaymentMethod.EFECTIVO) totals.cash += total;
    else if (order.paymentMethod === PaymentMethod.TARJETA) totals.card += total;
    else if (order.paymentMethod === PaymentMethod.TRANSFERENCIA) totals.transfer += total;
    else totals.other += total;
  });

  const expectedAmount = openingAmount + totals.cash;

  await prisma.cashCut.create({
    data: {
      tenantId,
      openedAt: start,
      closedAt: new Date(),
      openingAmount: new Prisma.Decimal(openingAmount),
      cashSales: new Prisma.Decimal(totals.cash),
      cardSales: new Prisma.Decimal(totals.card),
      transferSales: new Prisma.Decimal(totals.transfer),
      otherSales: new Prisma.Decimal(totals.other),
      expectedAmount: new Prisma.Decimal(expectedAmount),
      countedAmount: new Prisma.Decimal(countedAmount),
      difference: new Prisma.Decimal(countedAmount - expectedAmount),
      notes: notes || null,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin");
}

export async function createCashDrawerAction(formData: FormData) {
  const session = await requireAuthSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { version: true },
  });
  if (!tenant) return;

  const count = await prisma.cashDrawer.count({
    where: { tenantId: session.user.tenantId, isActive: true },
  });
  if (count >= planLimits(tenant.version).cashDrawers) return;

  await prisma.cashDrawer.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/caja");
}

export async function openCashSessionAction(formData: FormData) {
  const session = await requireAuthSession();
  const drawerId = String(formData.get("drawerId") ?? "");
  const openingAmount = Math.max(0, Number(String(formData.get("openingAmount") ?? "0")) || 0);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!drawerId) return;

  const drawer = await prisma.cashDrawer.findFirst({
    where: { id: drawerId, tenantId: session.user.tenantId, isActive: true },
  });
  if (!drawer) return;

  const active = await getActiveCashSession(session.user.tenantId, drawer.id);
  if (active) return;

  await prisma.cashSession.create({
    data: {
      tenantId: session.user.tenantId,
      drawerId: drawer.id,
      openedById: session.user.id,
      openingAmount: new Prisma.Decimal(openingAmount),
      notes: notes || null,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/caja");
}

export async function createCashMovementAction(formData: FormData) {
  const session = await requireAuthSession();
  const cashSessionId = String(formData.get("cashSessionId") ?? "");
  const type = parseCashMovementType(String(formData.get("type") ?? "SALIDA"));
  const amount = Math.max(0, Number(String(formData.get("amount") ?? "0")) || 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!cashSessionId || amount <= 0 || !reason) return;

  const cashSession = await prisma.cashSession.findFirst({
    where: {
      id: cashSessionId,
      tenantId: session.user.tenantId,
      status: CashSessionStatus.ABIERTA,
    },
  });
  if (!cashSession) return;

  await prisma.cashMovement.create({
    data: {
      tenantId: session.user.tenantId,
      cashSessionId: cashSession.id,
      userId: session.user.id,
      type,
      amount: new Prisma.Decimal(amount),
      reason,
      category: category || null,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/caja");
}

export async function closeCashSessionAction(formData: FormData) {
  const session = await requireAuthSession();
  const cashSessionId = String(formData.get("cashSessionId") ?? "");
  const countedAmount = Math.max(0, Number(String(formData.get("countedAmount") ?? "0")) || 0);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!cashSessionId) return;

  const preview = await calculateCashSessionPreview(cashSessionId);
  if (!preview || preview.session.tenantId !== session.user.tenantId) return;

  await prisma.cashSession.update({
    where: { id: cashSessionId },
    data: {
      status: CashSessionStatus.CERRADA,
      closedById: session.user.id,
      closedAt: new Date(),
      countedAmount: new Prisma.Decimal(countedAmount),
      expectedAmount: new Prisma.Decimal(preview.expected),
      difference: new Prisma.Decimal(countedAmount - preview.expected),
      notes: notes || preview.session.notes,
    },
  });

  await prisma.cashCut.create({
    data: {
      tenantId: session.user.tenantId,
      openedAt: preview.session.openedAt,
      closedAt: new Date(),
      openingAmount: preview.session.openingAmount,
      cashSales: new Prisma.Decimal(preview.totals.cash),
      cardSales: new Prisma.Decimal(preview.totals.card),
      transferSales: new Prisma.Decimal(preview.totals.transfer),
      otherSales: new Prisma.Decimal(preview.totals.other),
      expectedAmount: new Prisma.Decimal(preview.expected),
      countedAmount: new Prisma.Decimal(countedAmount),
      difference: new Prisma.Decimal(countedAmount - preview.expected),
      notes: notes || null,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/caja");
  revalidatePath("/admin");
}

export async function createTenantAction(formData: FormData) {
  const session = await requireAuthSession();
  if (session.user.role !== UserRole.SUPER_ADMIN) return;

  const businessName = String(formData.get("businessName") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const versionRaw = String(formData.get("version") ?? "LITE");
  const contractMonthsRaw = String(formData.get("contractMonths") ?? "1");

  if (!businessName || !slug || !whatsapp) return;
  if (!/^[a-z0-9_]+$/.test(slug)) return;
  const version = parseVersion(versionRaw);
  const contractMonths = Math.max(1, Number(contractMonthsRaw) || 1);
  const contractStartAt = new Date();
  const contractEndAt = new Date(contractStartAt);
  contractEndAt.setMonth(contractEndAt.getMonth() + contractMonths);

  const tenant = await prisma.tenant.create({
    data: {
      name: businessName,
      businessName,
      slug,
      whatsapp,
      version,
      ...applyPlanLimits(version),
      contractStartAt,
      contractEndAt,
    },
  });

  await prisma.settings.create({
    data: {
      tenantId: tenant.id,
      welcomeMessage: `Bienvenido a ${businessName}.`,
    },
  });

  revalidatePath("/admin/tenants");
}

export async function updateTenantSettingsAction(formData: FormData) {
  const session = await requireAuthSession();
  const tenantId = session.user.tenantId;

  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const welcomeMessage = String(formData.get("welcomeMessage") ?? "").trim();
  const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktokUrl") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const saleTicketMessage = String(formData.get("saleTicketMessage") ?? "").trim();
  const productionTicketMessage = String(formData.get("productionTicketMessage") ?? "").trim();
  const ticketTipMessage = String(formData.get("ticketTipMessage") ?? "").trim();
  const ticketWifiName = String(formData.get("ticketWifiName") ?? "").trim();
  const ticketWifiPassword = String(formData.get("ticketWifiPassword") ?? "").trim();
  const showSocialsOnTicket = String(formData.get("showSocialsOnTicket") ?? "") === "on";
  const ticketPaperWidth = parseTicketPaperWidth(String(formData.get("ticketPaperWidth") ?? "MM_80"));
  const publicTemplateRaw = String(formData.get("publicTemplate") ?? "CLASICO");
  const publicTemplate = parsePublicTemplate(publicTemplateRaw);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      whatsapp: whatsapp || undefined,
    },
  });

  await prisma.settings.upsert({
    where: { tenantId },
    update: {
      welcomeMessage: welcomeMessage || null,
      publicTemplate,
      ticketPaperWidth,
      saleTicketMessage: saleTicketMessage || null,
      productionTicketMessage: productionTicketMessage || null,
      ticketTipMessage: ticketTipMessage || null,
      ticketWifiName: ticketWifiName || null,
      ticketWifiPassword: ticketWifiPassword || null,
      showSocialsOnTicket,
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      tiktokUrl: tiktokUrl || null,
      websiteUrl: websiteUrl || null,
    },
    create: {
      tenantId,
      welcomeMessage: welcomeMessage || null,
      publicTemplate,
      ticketPaperWidth,
      saleTicketMessage: saleTicketMessage || null,
      productionTicketMessage: productionTicketMessage || null,
      ticketTipMessage: ticketTipMessage || null,
      ticketWifiName: ticketWifiName || null,
      ticketWifiPassword: ticketWifiPassword || null,
      showSocialsOnTicket,
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      tiktokUrl: tiktokUrl || null,
      websiteUrl: websiteUrl || null,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });

  revalidatePath("/admin/settings");
  if (tenant?.slug) {
    revalidatePath(`/${tenant.slug}`);
  }
}

export async function updateTenantPlanAction(formData: FormData) {
  const session = await requireAuthSession();
  if (session.user.role !== UserRole.SUPER_ADMIN) return;

  const tenantId = String(formData.get("tenantId") ?? "");
  const versionRaw = String(formData.get("version") ?? "LITE");
  const contractStartAtRaw = String(formData.get("contractStartAt") ?? "").trim();
  const contractEndAtRaw = String(formData.get("contractEndAt") ?? "").trim();
  if (!tenantId) return;

  const version = parseVersion(versionRaw);
  const contractStartAt = contractStartAtRaw ? new Date(`${contractStartAtRaw}T00:00:00`) : undefined;
  const contractEndAt = contractEndAtRaw ? new Date(`${contractEndAtRaw}T23:59:59`) : null;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      version,
      ...applyPlanLimits(version),
      ...(contractStartAt ? { contractStartAt } : {}),
      contractEndAt,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });

  revalidatePath("/admin/tenants");
  if (tenant?.slug) revalidatePath(`/${tenant.slug}`);
}

export async function updateTenantDemoSettingsAction(formData: FormData) {
  const session = await requireAuthSession();
  if (session.user.role !== UserRole.SUPER_ADMIN) return;

  const tenantId = String(formData.get("tenantId") ?? "");
  const isDemo = String(formData.get("isDemo") ?? "") === "on";
  const resetEveryDays = Math.max(1, Number(String(formData.get("demoResetEveryDays") ?? "5")) || 5);
  if (!tenantId) return;

  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + resetEveryDays);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      isDemo,
      demoResetEveryDays: resetEveryDays,
      demoNextResetAt: isDemo ? nextReset : null,
    },
  });

  revalidatePath("/admin/tenants");
}

export async function resetDemoTenantAction(formData: FormData) {
  const session = await requireAuthSession();
  if (session.user.role !== UserRole.SUPER_ADMIN) return;

  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });
  if (!tenant) return;

  await resetDemoTenantData(prisma, tenant.slug);
  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/cash");
  revalidatePath("/admin/kitchen");
}

export async function createExportCredentialAction(formData: FormData) {
  const session = await requireAuthSession();
  const name = String(formData.get("name") ?? "Conexion de reportes").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const token = generateExportToken();

  await prisma.exportCredential.create({
    data: {
      tenantId: session.user.tenantId,
      name: name || "Conexion de reportes",
      tokenHash: hashExportToken(token),
      tokenPrefix: tokenPrefix(token),
      expiresAt: expiresAtRaw ? new Date(`${expiresAtRaw}T23:59:59`) : null,
      createdByUserId: session.user.id,
    },
  });

  revalidatePath("/admin/reportes");
  redirect(`/admin/reportes?nuevoToken=${encodeURIComponent(token)}`);
}

export async function revokeExportCredentialAction(formData: FormData) {
  const session = await requireAuthSession();
  const credentialId = String(formData.get("credentialId") ?? "");
  if (!credentialId) return;

  await prisma.exportCredential.updateMany({
    where: {
      id: credentialId,
      tenantId: session.user.tenantId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  revalidatePath("/admin/reportes");
}
