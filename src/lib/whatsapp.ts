import { formatMoney } from "./format";

type WhatsAppItem = {
  quantity: number;
  productName: string;
  totalPrice: number;
  selectedModifiers?: { group?: string; name?: string }[] | null;
  selectedFilling?: string | null;
  specialNotes?: string | null;
};

type WhatsAppOrder = {
  orderNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerNotes?: string | null;
  serviceType?: string | null;
  tableName?: string | null;
  total: number;
  items: WhatsAppItem[];
};

const serviceLabel: Record<string, string> = {
  MOSTRADOR: "Mostrador",
  MESA: "Mesa",
  RECOGER: "Para recoger",
  DOMICILIO: "A domicilio",
};

export function buildWhatsappMessage(order: WhatsAppOrder) {
  const lines: string[] = [];
  lines.push(`Hola, quiero confirmar mi pedido #${order.orderNumber}:`);
  lines.push("");

  order.items.forEach((item, index) => {
    const base = `${index + 1}. ${item.quantity}x ${item.productName} - ${formatMoney(item.totalPrice)}`;
    lines.push(base);
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      const mods = item.selectedModifiers.map((modifier) => modifier.name ?? "").filter(Boolean);
      if (mods.length > 0) lines.push(`   Extras: ${mods.join(", ")}`);
    }
    if (item.selectedFilling) lines.push(`   Relleno: ${item.selectedFilling}`);
    if (item.specialNotes) lines.push(`   Nota item: ${item.specialNotes}`);
  });

  lines.push("");
  lines.push(`Total: ${formatMoney(order.total)}`);
  if (order.serviceType) {
    lines.push(`Servicio: ${serviceLabel[order.serviceType] ?? order.serviceType}`);
  }
  if (order.tableName) lines.push(`Mesa: ${order.tableName}`);
  if (order.customerName) lines.push(`Nombre: ${order.customerName}`);
  if (order.customerPhone) lines.push(`Teléfono: ${order.customerPhone}`);
  if (order.customerNotes) lines.push(`Notas: ${order.customerNotes}`);
  lines.push("");
  lines.push("Gracias.");

  return lines.join("\n");
}
