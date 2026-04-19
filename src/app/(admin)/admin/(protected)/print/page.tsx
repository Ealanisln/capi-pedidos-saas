import { PrintJobStatus, PrintJobType, PrinterArea } from "@prisma/client";
import Link from "next/link";
import { requireAuthSession } from "@/lib/auth";
import { buildTicketPath } from "@/lib/print-jobs";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<PrintJobStatus, string> = {
  PENDING: "Pendiente",
  CLAIMED: "Tomado por puente",
  PRINTED: "Impreso",
  FAILED: "Falló",
  CANCELLED: "Cancelado",
};

const statusTone: Record<PrintJobStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CLAIMED: "bg-sky-100 text-sky-800",
  PRINTED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

const typeLabel: Record<PrintJobType, string> = {
  SALE: "Venta",
  PRODUCTION: "Producción",
};

const areaLabel: Record<PrinterArea, string> = {
  GENERAL: "General",
  COCINA: "Cocina",
  BARRA: "Barra",
  CAJA: "Caja",
};

export default async function PrintPage() {
  const session = await requireAuthSession();
  const [tenant, jobs, counts] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, businessName: true },
    }),
    prisma.printJob.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            serviceType: true,
            tableName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.printJob.groupBy({
      by: ["status"],
      where: { tenantId: session.user.tenantId },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((count) => [count.status, count._count._all]));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#f97316,transparent_28%),linear-gradient(135deg,#020617,#111827)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">Puente de impresión</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight">Cola de tickets</h2>
              <p className="mt-2 text-sm text-slate-300">
                Trabajos preparados para imprimir en caja, cocina o barra. Esta pantalla deja listo el flujo para un puente local ESC/POS.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
              {formatNumber(jobs.length)} trabajos recientes
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {Object.values(PrintJobStatus).map((status) => (
          <article key={status} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{statusLabel[status]}</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatNumber(countByStatus.get(status) ?? 0)}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h3 className="text-xl font-black">Cómo se conectará el puente local</h3>
        <p className="mt-2 text-sm leading-6">
          En esta fase el SaaS ya genera la cola. El siguiente componente será una app local en el restaurante que consulte esta API con `PRINT_BRIDGE_TOKEN`, descargue los tickets y los mande a las impresoras configuradas por área.
        </p>
        <div className="mt-4 rounded-2xl bg-white/70 p-4 font-mono text-xs text-amber-950">
          GET /api/print/jobs?tenantSlug={tenant?.slug ?? "mi_negocio"}&area=COCINA<br />
          Authorization: Bearer TU_PRINT_BRIDGE_TOKEN
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h3 className="text-xl font-black text-slate-950">Trabajos recientes</h3>
        <div className="mt-5 space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-600">Aún no hay trabajos de impresión.</p>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-slate-950">{job.order.orderNumber}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[job.status]}`}>
                        {statusLabel[job.status]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {typeLabel[job.type]}{job.area ? ` · ${areaLabel[job.area]}` : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.order.customerName || "Cliente"} · Intentos: {formatNumber(job.attempts)}
                    </p>
                    {job.lastError ? <p className="mt-1 text-sm font-bold text-rose-700">Error: {job.lastError}</p> : null}
                  </div>
                  <Link
                    href={buildTicketPath(job.orderId, job.type, job.area)}
                    target="_blank"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700"
                  >
                    Ver ticket
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
