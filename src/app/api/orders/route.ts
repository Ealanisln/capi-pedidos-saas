import { Prisma, ServiceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createProductionPrintJobs } from "@/lib/print-jobs";
import { buildWhatsappMessage } from "@/lib/whatsapp";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(30),
  selectedModifierIds: z.array(z.string().min(1)).optional(),
  selectedFilling: z.string().trim().optional(),
  specialNotes: z.string().trim().max(180).optional(),
});

const createOrderSchema = z.object({
  tenantSlug: z.string().min(1),
  customerName: z.string().trim().max(90).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  customerNotes: z.string().trim().max(250).optional(),
  serviceType: z.enum(["MOSTRADOR", "MESA", "RECOGER", "DOMICILIO"]).optional(),
  tableName: z.string().trim().max(40).optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const payload = createOrderSchema.parse(await request.json());

    const tenant = await prisma.tenant.findUnique({
      where: { slug: payload.tenantSlug },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const productIds = payload.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        id: { in: productIds },
        isAvailable: true,
      },
      include: {
        modifierGroups: {
          include: {
            modifiers: { where: { isActive: true } },
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "No hay productos validos" }, { status: 400 });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const lineItems = payload.items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        const modifierPriceMap = new Map<string, { name: string; price: number; groupName: string }>();
        product.modifierGroups.forEach((group) => {
          group.modifiers.forEach((modifier) => {
            modifierPriceMap.set(modifier.id, {
              name: modifier.name,
              price: Number(modifier.price),
              groupName: group.name,
            });
          });
        });

        const selectedModifierIds = [...new Set(item.selectedModifierIds ?? [])];
        const selectedModifiers = selectedModifierIds
          .map((id) => modifierPriceMap.get(id))
          .filter((value): value is NonNullable<typeof value> => Boolean(value))
          .map((value) => ({
            group: value.groupName,
            name: value.name,
            price: value.price,
          }));
        const modifiersTotal = selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);

        const unitPrice = Number(product.price) + modifiersTotal;
        const totalPrice = unitPrice * item.quantity;

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          selectedModifiers: selectedModifiers.length ? selectedModifiers : null,
          selectedFilling: item.selectedFilling ?? null,
          specialNotes: item.specialNotes ?? null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Items invalidos para el tenant" }, { status: 400 });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const count = await prisma.order.count({ where: { tenantId: tenant.id } });
    const orderNumber = `${tenant.slug.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber,
        customerName: payload.customerName ?? null,
        customerPhone: payload.customerPhone ?? null,
        customerNotes: payload.customerNotes ?? null,
        serviceType: payload.serviceType ?? ServiceType.RECOGER,
        tableName: payload.tableName || null,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.totalPrice),
            ...(item.selectedModifiers ? { selectedModifiers: item.selectedModifiers } : {}),
            selectedFilling: item.selectedFilling,
            specialNotes: item.specialNotes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const message = buildWhatsappMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerNotes: order.customerNotes,
      serviceType: order.serviceType,
      tableName: order.tableName,
      total: Number(order.total),
      items: order.items.map((item) => ({
        quantity: item.quantity,
        productName: item.productName,
        totalPrice: Number(item.totalPrice),
        selectedModifiers: (item.selectedModifiers as { group?: string; name?: string }[] | null) ?? null,
        selectedFilling: item.selectedFilling,
        specialNotes: item.specialNotes,
      })),
    });

    await createProductionPrintJobs(order.id);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      whatsappUrl: `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(message)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "No se pudo crear el pedido" },
      { status: 500 },
    );
  }
}
