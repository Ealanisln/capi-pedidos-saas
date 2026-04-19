import { CashMovementType, CashSessionStatus, OrderLockStatus, PaymentMethod, PaymentStatus, ServiceType, Version } from "@prisma/client";
import Link from "next/link";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { planLimits } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  closeCashSessionAction,
  createCashDrawerAction,
  createCashMovementAction,
  lockOrderForPrecheckAction,
  markOrderPaidAction,
  markOrderUnpaidAction,
  openCashSessionAction,
  unlockOrderAction,
} from "../../actions";

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

const movementLabel: Record<CashMovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  RETIRO: "Retiro",
  GASTO: "Gasto",
  ADELANTO: "Adelanto",
  PAGO_PROVEEDOR: "Pago a proveedor",
  PROPINA: "Propina",
  AJUSTE: "Ajuste",
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
  const [tenant, orders, drawers, activeSessions, recentSessions, movements] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { version: true, maxCashDrawers: true, allowWaiterCharge: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startOfToday() },
      },
      include: { items: true, payments: true, table: true, assignedUser: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.cashDrawer.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cashSession.findMany({
      where: { tenantId: session.user.tenantId, status: CashSessionStatus.ABIERTA },
      include: { drawer: true, openedBy: true, payments: true, movements: true },
      orderBy: { openedAt: "desc" },
    }),
    prisma.cashSession.findMany({
      where: { tenantId: session.user.tenantId },
      include: { drawer: true, openedBy: true, closedBy: true },
      orderBy: { openedAt: "desc" },
      take: 8,
    }),
    prisma.cashMovement.findMany({
      where: { tenantId: session.user.tenantId },
      include: { cashSession: { include: { drawer: true } }, user: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const limits = planLimits(tenant?.version ?? Version.LITE);
  const paidOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PAGADO);
  const pendingOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PENDIENTE);
  const totalPaid = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalPending = pendingOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const byMethod = new Map<PaymentMethod, number>();
  const openSession = activeSessions[0];

  paidOrders.forEach((order) => {
    if (order.payments.length > 0) {
      order.payments.forEach((payment) => {
        byMethod.set(payment.method, (byMethod.get(payment.method) ?? 0) + Number(payment.amount));
      });
      return;
    }
    const method = order.paymentMethod ?? PaymentMethod.OTRO;
    byMethod.set(method, (byMethod.get(method) ?? 0) + Number(order.total));
  });

  const preview = openSession
    ? {
        cash: openSession.payments.filter((payment) => payment.method === PaymentMethod.EFECTIVO).reduce((sum, payment) => sum + Number(payment.amount), 0),
        card: openSession.payments.filter((payment) => payment.method === PaymentMethod.TARJETA).reduce((sum, payment) => sum + Number(payment.amount), 0),
        transfer: openSession.payments.filter((payment) => payment.method === PaymentMethod.TRANSFERENCIA).reduce((sum, payment) => sum + Number(payment.amount), 0),
        other: openSession.payments.filter((payment) => payment.method === PaymentMethod.OTRO).reduce((sum, payment) => sum + Number(payment.amount), 0),
        tips: openSession.payments.reduce((sum, payment) => sum + Number(payment.tipAmount), 0),
        entries: openSession.movements.filter((movement) => movement.type === CashMovementType.ENTRADA || movement.type === CashMovementType.AJUSTE).reduce((sum, movement) => sum + Number(movement.amount), 0),
        exits: openSession.movements.filter((movement) => movement.type !== CashMovementType.ENTRADA && movement.type !== CashMovementType.AJUSTE).reduce((sum, movement) => sum + Number(movement.amount), 0),
      }
    : null;
  const expectedCash = openSession && preview ? Number(openSession.openingAmount) + preview.cash + preview.entries - preview.exits : 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#34d399,transparent_26%),linear-gradient(135deg,#020617,#111827)] p-5 sm:p-7">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-300 sm:text-xs sm:tracking-[0.24em]">Cobros del dia</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Caja</h2>
              <p className="mt-2 text-sm text-slate-300">
                Abre caja, cobra pedidos, registra entradas y salidas, revisa precorte y cierra turno.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
              {formatNumber(activeSessions.length)} cajas abiertas
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MoneyCard label="Cobrado hoy" value={formatMoney(totalPaid)} helper={`${formatNumber(paidOrders.length)} pedidos pagados`} tone="from-emerald-700 to-teal-700 text-white" />
        <MoneyCard label="Pendiente de cobro" value={formatMoney(totalPending)} helper={`${formatNumber(pendingOrders.length)} pedidos pendientes`} tone="from-amber-400 to-orange-500 text-slate-950" />
        <MoneyCard label="Efectivo esperado" value={formatMoney(expectedCash)} helper={openSession ? openSession.drawer.name : "Sin caja abierta"} tone="from-slate-950 to-slate-800 text-white" />
        <MoneyCard label="Propinas" value={formatMoney(preview?.tips ?? 0)} helper="Turno abierto" tone="from-sky-600 to-cyan-500 text-white" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-black text-slate-950">Cajas configuradas</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {formatNumber(drawers.length)} / {formatNumber(tenant?.maxCashDrawers ?? limits.cashDrawers)}
            </span>
          </div>
          <form action={createCashDrawerAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input name="name" placeholder="Ej. Caja mostrador" className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Agregar</button>
          </form>
          <div className="mt-4 space-y-3">
            {drawers.map((drawer) => {
              const active = activeSessions.find((cashSession) => cashSession.drawerId === drawer.id);
              return (
                <div key={drawer.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-slate-950">{drawer.name}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                      {active ? "Abierta" : "Cerrada"}
                    </span>
                  </div>
                  {!active ? (
                    <form action={openCashSessionAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="drawerId" value={drawer.id} />
                      <input name="openingAmount" type="number" min="0" step="0.01" placeholder="Fondo inicial" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <input name="notes" placeholder="Notas" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Abrir</button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Precorte de caja</h3>
          {!openSession || !preview ? (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Abre una caja para ver el precorte en vivo.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Fondo inicial</p><p className="text-xl font-black">{formatMoney(openSession.openingAmount)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Entradas</p><p className="text-xl font-black">{formatMoney(preview.entries)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Salidas</p><p className="text-xl font-black">{formatMoney(preview.exits)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Efectivo</p><p className="text-xl font-black">{formatMoney(preview.cash)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Tarjeta</p><p className="text-xl font-black">{formatMoney(preview.card)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500">Transferencia</p><p className="text-xl font-black">{formatMoney(preview.transfer)}</p></div>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-950">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Esperado en cajon</p>
                <p className="mt-2 text-3xl font-black">{formatMoney(expectedCash)}</p>
              </div>
              <form action={createCashMovementAction} className="grid gap-2 rounded-3xl bg-slate-50 p-4 md:grid-cols-[150px_130px_1fr_1fr_auto]">
                <input type="hidden" name="cashSessionId" value={openSession.id} />
                <select name="type" defaultValue="SALIDA" className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {Object.values(CashMovementType).map((type) => <option key={type} value={type}>{movementLabel[type]}</option>)}
                </select>
                <input name="amount" type="number" min="0" step="0.01" placeholder="Monto" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="category" placeholder="Categoria" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input name="reason" placeholder="Motivo obligatorio" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Guardar</button>
              </form>
              <form action={closeCashSessionAction} className="grid gap-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 md:grid-cols-[160px_1fr_auto]">
                <input type="hidden" name="cashSessionId" value={openSession.id} />
                <input name="countedAmount" type="number" min="0" step="0.01" placeholder="Efectivo contado" className="rounded-xl border border-rose-200 px-3 py-2 text-sm" />
                <input name="notes" placeholder="Notas de cierre" className="rounded-xl border border-rose-200 px-3 py-2 text-sm" />
                <button className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-black text-white">Cerrar caja</button>
              </form>
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Resumen por metodo de pago</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.values(PaymentMethod).map((method) => (
              <div key={method} className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">{paymentLabel[method]}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{formatMoney(byMethod.get(method) ?? 0)}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Movimientos recientes</h3>
          <div className="mt-4 space-y-2">
            {movements.length === 0 ? <p className="text-sm text-slate-600">Sin movimientos.</p> : movements.map((movement) => (
              <div key={movement.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                <p className="font-black text-slate-950">{movementLabel[movement.type]} - {formatMoney(movement.amount)}</p>
                <p className="text-slate-600">{movement.reason} - {movement.cashSession.drawer.name}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h3 className="text-xl font-black text-slate-950">Pedidos y cobros</h3>
        <p className="mt-1 text-sm text-slate-600">Efectivo es el metodo predeterminado. Para pago mixto se registraran partidas separadas en el siguiente bloque visual.</p>
        <div className="mt-5 grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">Aun no hay pedidos hoy.</p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">
                      {order.customerName || "Cliente"} - {serviceLabel[order.serviceType]}
                      {order.table?.name ? ` - ${order.table.name}` : order.tableName ? ` - ${order.tableName}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(order.total)}</p>
                    {order.lockStatus !== OrderLockStatus.ABIERTA ? (
                      <p className="mt-1 text-xs font-black text-amber-700">{order.lockStatus === OrderLockStatus.PRECUENTA ? "Precuenta impresa; esperando cobro" : order.lockedReason ?? "Cuenta bloqueada"}</p>
                    ) : null}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${order.paymentStatus === PaymentStatus.PAGADO ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {order.paymentStatus === PaymentStatus.PAGADO ? "Pagado" : "Pendiente"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                  <Link href={`/admin/orders/${order.id}/ticket?type=sale`} target="_blank" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700">Ticket venta</Link>
                  <form action={lockOrderForPrecheckAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-black text-amber-800">Imprimir precuenta</button>
                  </form>
                  {order.lockStatus !== OrderLockStatus.ABIERTA ? (
                    <form action={unlockOrderAction} className="grid gap-2 sm:flex">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="reason" value="Reapertura autorizada desde caja" />
                      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700">Reabrir</button>
                    </form>
                  ) : null}
                  {order.paymentStatus === PaymentStatus.PAGADO ? (
                    <form action={markOrderUnpaidAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700">Marcar pendiente</button>
                    </form>
                  ) : (
                    <form action={markOrderPaidAction} className="grid w-full gap-2 rounded-2xl bg-slate-50 p-2 md:grid-cols-2 xl:grid-cols-[130px_120px_120px_1fr_auto]">
                      <input type="hidden" name="orderId" value={order.id} />
                      {openSession ? <input type="hidden" name="cashSessionId" value={openSession.id} /> : null}
                      <select name="paymentMethod" defaultValue="EFECTIVO" className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                        {Object.values(PaymentMethod).map((method) => <option key={method} value={method}>{paymentLabel[method]}</option>)}
                      </select>
                      <input name="amountReceived" type="number" min={Number(order.total)} step="0.01" placeholder="Recibido" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <input name="tipAmount" type="number" min="0" step="0.01" placeholder="Propina" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <input name="reference" placeholder="Referencia opcional" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Cobrar</button>
                    </form>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h3 className="text-xl font-black text-slate-950">Ultimos turnos de caja</h3>
        <div className="mt-4 space-y-2">
          {recentSessions.map((cashSession) => (
            <div key={cashSession.id} className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-4">
              <p className="font-black text-slate-950">{cashSession.drawer.name}</p>
              <p>{cashSession.openedAt.toLocaleString("es-MX")}</p>
              <p>{cashSession.status === CashSessionStatus.ABIERTA ? "Abierta" : "Cerrada"}</p>
              <p>{cashSession.expectedAmount ? formatMoney(cashSession.expectedAmount) : "Sin cierre"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

