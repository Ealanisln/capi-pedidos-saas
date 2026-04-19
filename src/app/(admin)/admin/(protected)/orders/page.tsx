import { OrderStatus, PaymentStatus, ServiceType } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction } from "../../actions";

const statuses = Object.values(OrderStatus);
const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusTone: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PREPARING: "bg-teal-100 text-teal-800",
  READY: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const serviceLabel: Record<ServiceType, string> = {
  MOSTRADOR: "Mostrador",
  MESA: "Mesa",
  RECOGER: "Para recoger",
  DOMICILIO: "A domicilio",
};

export default async function OrdersPage() {
  const session = await requireAuthSession();
  const [tenant, orders] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { version: true },
    }),
    prisma.order.findMany({
      where: { tenantId: session.user.tenantId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const hasAnalytics = tenant?.version === "PRO" || tenant?.version === "ENTERPRISE";
  const paidOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PAGADO);
  const pendingOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PENDIENTE);
  const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageTicket = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

  const productCounter = new Map<string, number>();
  const hourCounter = new Map<number, number>();

  if (hasAnalytics) {
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounter.set(hour, (hourCounter.get(hour) ?? 0) + 1);

      order.items.forEach((item) => {
        productCounter.set(item.productName, (productCounter.get(item.productName) ?? 0) + item.quantity);
      });
    });
  }

  const topProducts = [...productCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const peakHour = [...hourCounter.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#38bdf8,transparent_28%),linear-gradient(135deg,#020617,#111827)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">Historial operativo</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight">Pedidos</h2>
              <p className="mt-2 text-sm text-slate-300">Revisa, cambia estados y consulta productos vendidos.</p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
              {formatNumber(orders.length)} recientes
            </span>
          </div>
        </div>
      </section>

      {hasAnalytics ? (
        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-700 p-5 text-white shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Venta acumulada</p>
            <p className="mt-3 text-3xl font-black">{formatMoney(totalSales)}</p>
          </article>
          <article className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Ticket promedio</p>
            <p className="mt-3 text-3xl font-black">{formatMoney(averageTicket)}</p>
          </article>
          <article className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-slate-950 shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Pendientes</p>
            <p className="mt-3 text-3xl font-black">{formatNumber(pendingOrders.length)}</p>
          </article>
          <article className="rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 p-5 text-slate-950 shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Hora pico</p>
            <p className="mt-3 text-3xl font-black">{peakHour ? `${String(peakHour[0]).padStart(2, "0")}:00` : "Sin datos"}</p>
          </article>
        </section>
      ) : (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
          Plan LITE: analítica e historial avanzado disponibles al subir a PRO o ENTERPRISE.
        </section>
      )}

      {hasAnalytics ? (
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h2 className="text-xl font-black text-slate-950">Productos más vendidos</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-600">No hay suficientes pedidos para mostrar ranking.</p>
            ) : (
              topProducts.map(([name, qty], index) => (
                <div key={name} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">#{formatNumber(index + 1)}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{name}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatNumber(qty)} piezas</p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h2 className="text-xl font-black text-slate-950">Pedidos recientes</h2>
        <div className="mt-5 space-y-3">
          {orders.length === 0 ? (
            <p className="text-slate-600">Aún no hay pedidos.</p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-slate-950">{order.orderNumber}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        order.paymentStatus === PaymentStatus.PAGADO ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {order.paymentStatus === PaymentStatus.PAGADO ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.customerName || "Cliente"} · {serviceLabel[order.serviceType]}
                      {order.tableName ? ` · ${order.tableName}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(order.total)}</p>
                  </div>
                  <form action={updateOrderStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                      Guardar
                    </button>
                  </form>
                </div>

                <ul className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="rounded-2xl bg-slate-50 p-3">
                      <span className="font-black text-slate-950">{formatNumber(item.quantity)}x</span> {item.productName}{" "}
                      <span className="font-semibold">({formatMoney(item.totalPrice)})</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
