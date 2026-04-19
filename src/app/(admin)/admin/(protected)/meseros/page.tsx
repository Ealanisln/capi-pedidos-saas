import { UserRole } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function MeserosPage() {
  const session = await requireAuthSession();
  const [tenant, waiters] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { maxWaiters: true, allowWaiterCharge: true, version: true } }),
    prisma.user.findMany({ where: { tenantId: session.user.tenantId, role: UserRole.MESERO }, include: { assignedOrders: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-200">Equipo de servicio</p>
        <h2 className="mt-2 text-4xl font-black">Meseros</h2>
        <p className="mt-2 text-sm text-slate-300">Usuarios con acceso limitado para levantar pedidos, enviar a cocina, imprimir precuentas y cobrar solo si el admin lo permite.</p>
      </section>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-black text-slate-950">Meseros configurados</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{formatNumber(waiters.length)} / {formatNumber(tenant?.maxWaiters ?? 2)}</span>
        </div>
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-950">
          Permiso para cobrar desde comandero: <strong>{tenant?.allowWaiterCharge ? "Activo" : "Inactivo"}</strong>. El corte sigue siendo responsabilidad de caja.
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {waiters.length === 0 ? <p className="text-sm text-slate-600">Aún no hay meseros demo/configurados.</p> : waiters.map((waiter) => (
            <article key={waiter.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-lg font-black text-slate-950">{waiter.name ?? waiter.email}</p>
              <p className="text-sm text-slate-600">{waiter.email}</p>
              <p className="mt-3 text-sm font-bold text-slate-700">Pedidos asignados: {formatNumber(waiter.assignedOrders.length)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
