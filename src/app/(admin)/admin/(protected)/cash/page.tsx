import { PaymentMethod, PaymentStatus, ServiceType } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createCashCutAction, markOrderPaidAction, markOrderUnpaidAction } from "../../actions";

const paymentLabel: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

const serviceLabel: Record<ServiceType, string> = {
  MOSTRADOR: "Mostrador",
  MESA: "Mesa",
  RECOGER: "Para recoger",
  DOMICILIO: "A domicilio",
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function MoneyCard({ label, value, helper, tone }: { label: string; value: string; helper?: string; tone: string }) {
  return (
    <article className={`rounded-3xl bg-gradient-to-br p-5 shadow-xl shadow-slate-900/10 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm font-semibold opacity-80">{helper}</p> : null}
    </article>
  );
}

export default async function CashPage() {
  const session = await requireAuthSession();
  const [orders, cuts] = await Promise.all([
    prisma.order.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startOfToday() },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.cashCut.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { closedAt: "desc" },
      take: 8,
    }),
  ]);

  const paidOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PAGADO);
  const pendingOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PENDIENTE);
  const totalPaid = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalPending = pendingOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const byMethod = new Map<PaymentMethod, number>();

  paidOrders.forEach((order) => {
    const method = order.paymentMethod ?? PaymentMethod.OTRO;
    byMethod.set(method, (byMethod.get(method) ?? 0) + Number(order.total));
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#34d399,transparent_26%),linear-gradient(135deg,#020617,#111827)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Cobros del día</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight">Caja</h2>
              <p className="mt-2 text-sm text-slate-300">
                Módulo opcional para controlar cobros, pagos y cortes sin reemplazar el punto de venta.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
              {formatNumber(orders.length)} pedidos hoy
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MoneyCard label="Cobrado hoy" value={formatMoney(totalPaid)} helper={`${formatNumber(paidOrders.length)} pedidos pagados`} tone="from-emerald-700 to-teal-700 text-white" />
        <MoneyCard label="Pendiente de cobro" value={formatMoney(totalPending)} helper={`${formatNumber(pendingOrders.length)} pedidos pendientes`} tone="from-amber-400 to-orange-500 text-slate-950" />
        <MoneyCard label="Pedidos del día" value={formatNumber(orders.length)} helper="Mostrador, mesa, recoger y domicilio" tone="from-slate-950 to-slate-800 text-white" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Resumen por método de pago</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.values(PaymentMethod).map((method) => (
              <div key={method} className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">{paymentLabel[method]}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatMoney(byMethod.get(method) ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Corte de caja</h3>
          <form action={createCashCutAction} className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              name="openingAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Fondo inicial"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="countedAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Efectivo contado"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="notes"
              placeholder="Notas del corte"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <button className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">
              Cerrar caja
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {cuts.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay cortes.</p>
            ) : (
              cuts.map((cut) => (
                <div key={cut.id} className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-4">
                  <p className="font-black text-slate-950">{cut.closedAt.toLocaleDateString("es-MX")}</p>
                  <p>Esperado: <strong>{formatMoney(cut.expectedAmount)}</strong></p>
                  <p>Contado: <strong>{formatMoney(cut.countedAmount)}</strong></p>
                  <p
                    className={
                      Number(cut.difference) === 0
                        ? "font-black text-emerald-700"
                        : Number(cut.difference) < 0
                          ? "font-black text-rose-700"
                          : "font-black text-amber-700"
                    }
                  >
                    {formatMoney(cut.difference)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-950">Pedidos y cobros</h3>
            <p className="mt-1 text-sm text-slate-600">Marca pagos por método o regresa pedidos a pendiente si hubo error.</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {formatNumber(orders.length)} movimientos
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">Aún no hay pedidos hoy.</p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">
                      {order.customerName || "Cliente"} · {serviceLabel[order.serviceType]}
                      {order.tableName ? ` · ${order.tableName}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(order.total)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      order.paymentStatus === PaymentStatus.PAGADO
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.paymentStatus === PaymentStatus.PAGADO ? "Pagado" : "Pendiente"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.paymentStatus === PaymentStatus.PAGADO ? (
                    <form action={markOrderUnpaidAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700">
                        Marcar pendiente
                      </button>
                    </form>
                  ) : (
                    Object.values(PaymentMethod).map((method) => (
                      <form key={method} action={markOrderPaidAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="paymentMethod" value={method} />
                        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                          Cobrar {paymentLabel[method]}
                        </button>
                      </form>
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
