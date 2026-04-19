import { PaymentMethod, PaymentStatus, PrinterArea, ServiceType, TicketPaperWidth } from "@prisma/client";
import { formatMoney, formatNumber } from "@/lib/format";
import { amountToWordsMx } from "@/lib/money-words";

type TicketOrder = {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  subtotal: MoneyLike;
  total: MoneyLike;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amountReceived: MoneyLike;
  changeDue: MoneyLike;
  serviceType: ServiceType;
  tableName: string | null;
  createdAt: Date;
  tenant: {
    businessName: string;
    whatsapp: string;
    settings: {
      ticketPaperWidth: TicketPaperWidth;
      saleTicketMessage: string | null;
      productionTicketMessage: string | null;
      ticketTipMessage: string | null;
      ticketWifiName: string | null;
      ticketWifiPassword: string | null;
      showSocialsOnTicket: boolean;
      facebookUrl: string | null;
      instagramUrl: string | null;
      tiktokUrl: string | null;
      websiteUrl: string | null;
    } | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    productName: string;
    totalPrice: MoneyLike;
    selectedFilling: string | null;
    selectedModifiers: unknown;
    specialNotes: string | null;
    product: {
      category: {
        printerArea: PrinterArea;
      };
    } | null;
  }>;
};

type MoneyLike = number | string | { toString(): string } | null | undefined;

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Cancun",
  }).format(date);
}

function modifiersText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const modifier = item as { group?: string; name?: string; price?: number };
      return `${modifier.group ? `${modifier.group}: ` : ""}${modifier.name ?? ""}${modifier.price ? ` +${formatMoney(modifier.price)}` : ""}`;
    })
    .filter(Boolean)
    .join(" | ");
}

function row(label: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

export function renderTicketHtml(order: TicketOrder, options: { type: "sale" | "production"; area: PrinterArea }) {
  const isProduction = options.type === "production";
  const settings = order.tenant.settings;
  const paperWidth = settings?.ticketPaperWidth ?? TicketPaperWidth.MM_80;
  const width = paperWidth === TicketPaperWidth.MM_58 ? "58mm" : "80mm";
  const items = isProduction
    ? order.items.filter((item) => item.product?.category.printerArea === options.area || item.product?.category.printerArea === PrinterArea.GENERAL)
    : order.items;

  const itemHtml = items.length
    ? items
        .map((item) => {
          const mods = modifiersText(item.selectedModifiers);
          return `
            <div class="item">
              <div class="line">
                <strong>${formatNumber(item.quantity)}x ${escapeHtml(item.productName)}</strong>
                ${isProduction ? "" : `<span>${escapeHtml(formatMoney(item.totalPrice))}</span>`}
              </div>
              ${item.product?.category ? row("Área", areaLabel[item.product.category.printerArea]) : ""}
              ${mods ? row("Extras", mods) : ""}
              ${item.selectedFilling ? row("Relleno", item.selectedFilling) : ""}
              ${item.specialNotes ? `<p><strong>Nota:</strong> ${escapeHtml(item.specialNotes)}</p>` : ""}
            </div>
          `;
        })
        .join("")
    : `<p class="center"><strong>Sin productos para esta area.</strong></p>`;

  const paymentHtml = isProduction
    ? ""
    : `
      <div class="block right">
        <p>Subtotal: ${escapeHtml(formatMoney(order.subtotal))}</p>
        <p class="big"><strong>Total: ${escapeHtml(formatMoney(order.total))}</strong></p>
        <p class="left"><strong>Total en letras:</strong> ${escapeHtml(amountToWordsMx(order.total).toUpperCase())}</p>
        <p>Pago: ${escapeHtml(paymentStatusLabel[order.paymentStatus])}</p>
        ${order.paymentMethod ? `<p>Método: ${escapeHtml(paymentMethodLabel[order.paymentMethod])}</p>` : ""}
        ${
          order.paymentMethod === PaymentMethod.EFECTIVO && order.amountReceived
            ? `<p>Recibido: ${escapeHtml(formatMoney(order.amountReceived))}</p><p class="big"><strong>Cambio: ${escapeHtml(formatMoney(order.changeDue))}</strong></p>`
            : ""
        }
      </div>
    `;

  const socialsHtml =
    !isProduction && settings?.showSocialsOnTicket
      ? `
        <div class="center small">
          ${settings.facebookUrl ? `<p>Facebook: ${escapeHtml(settings.facebookUrl)}</p>` : ""}
          ${settings.instagramUrl ? `<p>Instagram: ${escapeHtml(settings.instagramUrl)}</p>` : ""}
          ${settings.tiktokUrl ? `<p>TikTok: ${escapeHtml(settings.tiktokUrl)}</p>` : ""}
          ${settings.websiteUrl ? `<p>Web: ${escapeHtml(settings.websiteUrl)}</p>` : ""}
        </div>
      `
      : "";

  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: ${width} auto; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #020617; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; line-height: 1.25; }
    .paper { width: ${width}; padding: 10px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .left { text-align: left; }
    .small { font-size: 11px; overflow-wrap: anywhere; }
    .big { font-size: 14px; }
    .block { border-top: 1px dashed #475569; padding-top: 8px; margin-top: 8px; }
    .title { font-size: 15px; font-weight: 900; text-transform: uppercase; }
    .folio { border-top: 1px dashed #475569; border-bottom: 1px dashed #475569; padding: 8px 0; margin: 8px 0; text-align: center; }
    .item { break-inside: avoid; border-top: 1px dashed #cbd5e1; padding-top: 7px; margin-top: 7px; }
    .line { display: flex; justify-content: space-between; gap: 8px; }
    p { margin: 2px 0; }
  </style>
</head>
<body>
  <main class="paper">
    <div class="center">
      <h1 class="title">${escapeHtml(order.tenant.businessName)}</h1>
      <p>WhatsApp: ${escapeHtml(order.tenant.whatsapp)}</p>
      <p>${escapeHtml(formatDate(order.createdAt))}</p>
    </div>
    <div class="folio">
      <p class="big"><strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p><strong>${escapeHtml(isProduction ? `Producción - ${areaLabel[options.area]}` : "Ticket de venta")}</strong></p>
    </div>
    <div>
      ${row("Cliente", order.customerName || "Sin nombre")}
      ${row("Tel", order.customerPhone)}
      ${row("Tipo", serviceLabel[order.serviceType])}
      ${row("Mesa/ref", order.tableName)}
      ${row("Notas cliente", order.customerNotes)}
    </div>
    <div class="block">${itemHtml}</div>
    ${paymentHtml}
    <div class="block center">
      <p>${escapeHtml(isProduction ? settings?.productionTicketMessage : settings?.saleTicketMessage)}</p>
      ${!isProduction && settings?.ticketTipMessage ? `<p><strong>${escapeHtml(settings.ticketTipMessage)}</strong></p>` : ""}
      ${
        !isProduction && settings?.ticketWifiName
          ? `<p>WiFi: ${escapeHtml(settings.ticketWifiName)}</p>${settings.ticketWifiPassword ? `<p>Clave: ${escapeHtml(settings.ticketWifiPassword)}</p>` : ""}`
          : ""
      }
      ${socialsHtml}
    </div>
  </main>
</body>
</html>`;
}
