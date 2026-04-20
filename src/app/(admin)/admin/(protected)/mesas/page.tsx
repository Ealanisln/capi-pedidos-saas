import { PaymentStatus, ServiceType, TableStatus } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<TableStatus, string> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  PIDIENDO: "Pidiendo",
  EN_COCINA: "En cocina",
  POR_COBRAR: "Por cobrar",
  PAGADA: "Pagada",
  LIMPIEZA: "Limpieza",
};

export default async function MesasPage() {
  const session = await requireAuthSession();
  const [tenant, tables, orders] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { maxTables: true, version: true } }),
    prisma.diningTable.findMany({ where: { tenantId: session.user.tenantId }, orderBy: [{ area: "asc" }, { name: "asc" }] }),
    prisma.order.findMany({
      where: { tenantId: session.user.tenantId, serviceType: ServiceType.MESA, paymentStatus: PaymentStatus.PENDIENTE },
      include: { table: true, assignedUser: true },
    }),
  ]);
  const orderByTable = new Map(orders.map((order) => [order.tableId, order]));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20">
        <p className="text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.24em] text-cyan-200">Comandero</p>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">Mesas</h2>
        <p className="mt-2 text-sm text-slate-300">Mapa operativo para meseros: mesas libres, ocupadas, en cocina y por cobrar.</p>
      </section>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-black text-slate-950">Mesas configuradas</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{formatNumber(tables.length)} / {formatNumber(tenant?.maxTables ?? 10)}</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tables.length === 0 ? <p className="text-sm text-slate-600">Aun no hay mesas configuradas.</p> : tables.map((table) => {
            const order = orderByTable.get(table.id);
            return (
              <article key={table.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-lg font-black text-slate-950">{table.name}</p>
                <p className="text-sm text-slate-600">{table.area ?? "Salon"} - {formatNumber(table.capacity)} lugares</p>
                <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{statusLabel[table.status]}</span>
                {order ? (
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-black">{order.orderNumber}</p>
                    <p>{order.assignedUser?.name ?? "Mesero"}</p>
                    <p>{formatMoney(order.total)}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
