"use server";

import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PublicTemplate,
  UserRole,
  Version,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuthSession } from "@/lib/auth";
import { resetDemoTenantData } from "@/lib/demo-reset";
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

export async function createCategoryAction(formData: FormData) {
  const session = await requireAuthSession();

  const name = String(formData.get("name") ?? "").trim();
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
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
}

export async function updateCategoryAction(formData: FormData) {
  const session = await requireAuthSession();
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) return;

  await prisma.category.updateMany({
    where: { id: categoryId, tenantId: session.user.tenantId },
    data: { name },
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
  if (!orderId) return;

  await prisma.order.updateMany({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
    data: {
      paymentStatus: PaymentStatus.PAGADO,
      paymentMethod: method,
      paidAt: new Date(),
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/orders");
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
      paidAt: null,
    },
  });

  revalidatePath("/admin/cash");
  revalidatePath("/admin/orders");
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
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      tiktokUrl: tiktokUrl || null,
      websiteUrl: websiteUrl || null,
    },
    create: {
      tenantId,
      welcomeMessage: welcomeMessage || null,
      publicTemplate,
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
