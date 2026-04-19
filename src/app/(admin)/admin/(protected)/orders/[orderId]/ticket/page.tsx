import Link from "next/link";
import { PaymentMethod, PaymentStatus, PrinterArea, ServiceType, TicketPaperWidth } from "@prisma/client";
import { TicketPrintButton } from "@/components/admin/ticket-print-button";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { amountToWordsMx } from "@/lib/money-words";
import { prisma } from "@/lib/prisma";

type TicketPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ type?: string; area?: string }>;
};

const serviceLabel: Record<ServiceType, string> = {
  MOSTRADOR: "Mostrador",
  MESA: "Mesa",
  RECOGER: "Para recoger",
  DOMICILIO: "A domicilio",
};

const areaLabel: Record<PrinterArea, string> = {
  GENERAL: "General",
  COCINA: "Cocina",
  BARRA: "Barra",
  CAJA: "Caja",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  CANCELADO: "Cancelado",
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

function parseArea(value?: string) {
  if (value === "GENERAL") return PrinterArea.GENERAL;
  if (value === "BARRA") return PrinterArea.BARRA;
  if (value === "CAJA") return PrinterArea.CAJA;
  return PrinterArea.COCINA;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Cancun",
  }).format(date);
}

function modifiersText(value: unknown) {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const modifier = item as { group?: string; name?: string; price?: number };
      return `${modifier.group ? `${modifier.group}: ` : ""}${modifier.name ?? ""}${modifier.price ? ` +${formatMoney(modifier.price)}` : ""}`;
    })
    .filter(Boolean);
  return items.length ? items.join(" | ") : null;
}

export default async function TicketPage({ params, searchParams }: TicketPageProps) {
  const session = await requireAuthSession();
  const { orderId } = await params;
  const query = await searchParams;
  const ticketType = query.type === "production" ? "production" : "sale";
  const area = parseArea(query.area);

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId: session.user.tenantId,
    },
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
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <p className="rounded-2xl bg-white p-6 text-slate-700">Pedido no encontrado.</p>
      </main>
    );
  }

  const settings = order.tenant.settings;
  const paperWidth = settings?.ticketPaperWidth ?? TicketPaperWidth.MM_80;
  const isProduction = ticketType === "production";
  const filteredItems = isProduction
    ? order.items.filter((item) => item.product?.category.printerArea === area || item.product?.category.printerArea === PrinterArea.GENERAL)
    : order.items;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0">
      <style>{`
        @page { size: ${paperWidth === TicketPaperWidth.MM_58 ? "58mm" : "80mm"} auto; margin: 0; }
        @media print {
          body { background: white !important; }
          .ticket-paper { box-shadow: none !important; border: 0 !important; width: ${paperWidth === TicketPaperWidth.MM_58 ? "58mm" : "80mm"} !important; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Vista previa</p>
          <h1 className="text-2xl font-black">{isProduction ? `Ticket de producción - ${areaLabel[area]}` : "Ticket de venta"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700">
            Volver
          </Link>
          <TicketPrintButton />
        </div>
      </div>

      <section className={`ticket-paper mx-auto rounded-2xl bg-white p-4 font-mono text-[12px] leading-tight shadow-xl ${paperWidth === TicketPaperWidth.MM_58 ? "w-[58mm]" : "w-[80mm]"}`}>
        <div className="text-center">
          <h2 className="text-base font-black uppercase">{order.tenant.businessName}</h2>
          <p>WhatsApp: {order.tenant.whatsapp}</p>
          <p>{formatDate(order.createdAt)}</p>
        </div>

        <div className="my-3 border-y border-dashed border-slate-400 py-2 text-center">
          <p className="text-lg font-black">{order.orderNumber}</p>
          <p className="font-black uppercase">{isProduction ? `Producción - ${areaLabel[area]}` : "Ticket de venta"}</p>
        </div>

        <div className="space-y-1">
          <p><strong>Cliente:</strong> {order.customerName || "Sin nombre"}</p>
          {order.customerPhone ? <p><strong>Tel:</strong> {order.customerPhone}</p> : null}
          <p><strong>Tipo:</strong> {serviceLabel[order.serviceType]}</p>
          {order.tableName ? <p><strong>Mesa/ref:</strong> {order.tableName}</p> : null}
          {order.customerNotes ? <p><strong>Notas cliente:</strong> {order.customerNotes}</p> : null}
        </div>

        <div className="my-3 border-t border-dashed border-slate-400 pt-2">
          {filteredItems.length === 0 ? (
            <p className="text-center font-black">Sin productos para esta área.</p>
          ) : (
            filteredItems.map((item) => {
              const mods = modifiersText(item.selectedModifiers);
              return (
                <div key={item.id} className="mb-3 break-inside-avoid">
                  <div className="flex justify-between gap-2">
                    <p className="font-black">{formatNumber(item.quantity)}x {item.productName}</p>
                    {!isProduction ? <p>{formatMoney(item.totalPrice)}</p> : null}
                  </div>
                  {item.product?.category ? <p>Área: {areaLabel[item.product.category.printerArea]}</p> : null}
                  {mods ? <p>Extras: {mods}</p> : null}
                  {item.selectedFilling ? <p>Relleno: {item.selectedFilling}</p> : null}
                  {item.specialNotes ? <p className="font-black">Nota: {item.specialNotes}</p> : null}
                </div>
              );
            })
          )}
        </div>

        {!isProduction ? (
          <div className="border-t border-dashed border-slate-400 pt-2 text-right">
            <p>Subtotal: {formatMoney(order.subtotal)}</p>
            <p className="text-base font-black">Total: {formatMoney(order.total)}</p>
            <p className="text-left">Total en letras: {amountToWordsMx(order.total).toUpperCase()}</p>
            <p>Pago: {paymentStatusLabel[order.paymentStatus]}</p>
            {order.paymentMethod ? <p>Método: {paymentMethodLabel[order.paymentMethod]}</p> : null}
            {order.paymentMethod === PaymentMethod.EFECTIVO && order.amountReceived ? (
              <>
                <p>Recibido: {formatMoney(order.amountReceived)}</p>
                <p className="text-base font-black">Cambio: {formatMoney(order.changeDue)}</p>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 border-t border-dashed border-slate-400 pt-2 text-center">
          <p>{isProduction ? settings?.productionTicketMessage : settings?.saleTicketMessage}</p>
          {!isProduction && settings?.ticketTipMessage ? <p className="mt-2 font-black">{settings.ticketTipMessage}</p> : null}
          {!isProduction && settings?.ticketWifiName ? (
            <div className="mt-2">
              <p>WiFi: {settings.ticketWifiName}</p>
              {settings.ticketWifiPassword ? <p>Clave: {settings.ticketWifiPassword}</p> : null}
            </div>
          ) : null}
          {!isProduction && settings?.showSocialsOnTicket ? (
            <div className="mt-2 space-y-1">
              {settings.facebookUrl ? <p>Facebook: {settings.facebookUrl}</p> : null}
              {settings.instagramUrl ? <p>Instagram: {settings.instagramUrl}</p> : null}
              {settings.tiktokUrl ? <p>TikTok: {settings.tiktokUrl}</p> : null}
              {settings.websiteUrl ? <p>Web: {settings.websiteUrl}</p> : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

