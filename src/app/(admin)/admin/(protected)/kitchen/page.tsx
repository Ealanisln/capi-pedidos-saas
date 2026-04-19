import { OrderStatus, ServiceType } from "@prisma/client";
import Link from "next/link";
import { requireAuthSession } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction } from "../../actions";

const kitchenStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING];

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Nuevo",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Listo",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusTone: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-950",
  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-950",
  PREPARING: "border-teal-200 bg-teal-50 text-teal-950",
  READY: "border-emerald-200 bg-emerald-50 text-emerald-950",
  COMPLETED: "border-slate-200 bg-slate-50 text-slate-950",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-950",
};

const serviceLabel: Record<ServiceType, string> = {
  MOSTRADOR: "Mostrador",
  MESA: "Mesa",
  RECOGER: "Para recoger",
  DOMICILIO: "A domicilio",
};

export default async function KitchenPage() {
  const session = await requireAuthSession();
  const orders = await prisma.order.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: kitchenStatuses },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 80,
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#facc15,transparent_28%),linear-gradient(135deg,#020617,#111827)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Operación en vivo</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight">Monitor de cocina</h2>
              <p className="mt-2 text-sm text-slate-300">
                Comandas activas para preparar, dar salida o cancelar sin perder visibilidad.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
              {formatNumber(orders.length)} comandas activas
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {kitchenStatuses.map((status) => {
          const statusOrders = orders.filter((order) => order.status === status);
          return (
            <article key={status} className={`rounded-[2rem] border p-4 shadow-xl shadow-slate-900/5 ${statusTone[status]}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">{statusLabel[status]}</h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
                  {formatNumber(statusOrders.length)}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {statusOrders.length === 0 ? (
                  <p className="rounded-2xl bg-white/60 p-4 text-sm font-semibold">Sin comandas.</p>
                ) : (
                  statusOrders.map((order) => (
                    <div key={order.id} className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-black text-slate-950">{order.orderNumber}</p>
                          <p className="text-xs font-semibold text-slate-500">
                            {serviceLabel[order.serviceType]}
                            {order.tableName ? ` - ${order.tableName}` : ""}
                          </p>
                        </div>
                        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {new Date(order.createdAt).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <ul className="mt-4 space-y-3 text-sm text-slate-800">
                        {order.items.map((item) => (
                          <li key={item.id} className="rounded-2xl bg-slate-50 p-3">
                            <span className="text-base font-black text-slate-950">{formatNumber(item.quantity)}x</span>{" "}
                            <span className="font-bold">{item.productName}</span>
                            {item.specialNotes ? (
                              <p className="mt-1 text-xs font-semibold text-rose-700">Nota: {item.specialNotes}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/orders/${order.id}/ticket?type=production&area=COCINA`}
                          target="_blank"
                          className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-black text-amber-800"
                        >
                          Ticket cocina
                        </Link>
                        <Link
                          href={`/admin/orders/${order.id}/ticket?type=production&area=BARRA`}
                          target="_blank"
                          className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-black text-sky-800"
                        >
                          Ticket barra
                        </Link>
                        {status !== OrderStatus.PREPARING ? (
                          <form action={updateOrderStatusAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="status" value={OrderStatus.PREPARING} />
                            <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                              Preparar
                            </button>
                          </form>
                        ) : null}
                        <form action={updateOrderStatusAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="status" value={OrderStatus.READY} />
                          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">
                            Listo
                          </button>
                        </form>
                        <form action={updateOrderStatusAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="status" value={OrderStatus.CANCELLED} />
                          <button className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-black text-rose-700">
                            Cancelar
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}



