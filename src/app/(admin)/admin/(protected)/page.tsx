import Link from "next/link";
import { OrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const activeOrderStatuses = new Set<OrderStatus>([
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
]);

function sinceDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function StatCard({ label, value, helper, tone = "slate" }: { label: string; value: string; helper?: string; tone?: "slate" | "emerald" | "amber" | "rose" | "teal" }) {
  const tones = {
    slate: "from-slate-950 to-slate-800 text-white",
    emerald: "from-emerald-700 to-teal-700 text-white",
    amber: "from-amber-500 to-orange-600 text-slate-950",
    rose: "from-rose-600 to-red-700 text-white",
    teal: "from-teal-500 to-cyan-600 text-slate-950",
  };

  return (
    <article className={`rounded-3xl bg-gradient-to-br p-5 shadow-xl shadow-slate-900/10 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm font-medium opacity-80">{helper}</p> : null}
    </article>
  );
}

export default async function AdminHomePage() {
  const session = await requireAuthSession();
  const tenantId = session.user.tenantId;
  const since = sinceDays(60);

  const [tenant, products, categories, orders, recentOrders, cashCuts, demoTenants] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.category.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: since } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cashCut.findMany({
      where: { tenantId, closedAt: { gte: since } },
      orderBy: { closedAt: "desc" },
      take: 10,
    }),
    session.user.role === UserRole.SUPER_ADMIN
      ? prisma.tenant.findMany({
          where: { isDemo: true },
          include: {
            orders: {
              where: { createdAt: { gte: since } },
              include: { items: true },
            },
          },
          orderBy: { businessName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const cancelledOrders = recentOrders.filter((order) => order.status === OrderStatus.CANCELLED);
  const paidOrders = recentOrders.filter((order) => order.paymentStatus === PaymentStatus.PAGADO);
  const pendingPayments = recentOrders.filter((order) => order.paymentStatus === PaymentStatus.PENDIENTE);
  const activeOrders = recentOrders.filter((order) => activeOrderStatuses.has(order.status));
  const sales = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingAmount = pendingPayments.reduce((sum, order) => sum + Number(order.total), 0);
  const cancelledAmount = cancelledOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageTicket = paidOrders.length ? sales / paidOrders.length : 0;
  const productCounter = new Map<string, { qty: number; total: number }>();

  recentOrders.forEach((order) => {
    if (order.status === OrderStatus.CANCELLED) return;
    order.items.forEach((item) => {
      const current = productCounter.get(item.productName) ?? { qty: 0, total: 0 };
      productCounter.set(item.productName, {
        qty: current.qty + item.quantity,
        total: current.total + Number(item.totalPrice),
      });
    });
  });

  const topProducts = [...productCounter.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#2dd4bf,transparent_28%),linear-gradient(135deg,#020617,#111827)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.24em] text-teal-300">Resumen operativo</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{tenant?.businessName ?? "Negocio"}</h2>
              <p className="mt-2 text-sm text-slate-300">URL pública: /{tenant?.slug ?? "sin-slug"}</p>
            </div>
            <Link
              href={`/${tenant?.slug ?? "capi"}`}
              className="w-fit rounded-2xl bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-200"
            >
              Ver menú público
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas 60 días" value={formatMoney(sales)} helper={`${formatNumber(paidOrders.length)} pedidos cobrados`} tone="emerald" />
        <StatCard label="Ticket promedio" value={formatMoney(averageTicket)} helper="Pedidos pagados" tone="teal" />
        <StatCard label="Pendiente por cobrar" value={formatMoney(pendingAmount)} helper={`${formatNumber(pendingPayments.length)} pedidos pendientes`} tone="amber" />
        <StatCard label="Cancelaciones" value={formatNumber(cancelledOrders.length)} helper={formatMoney(cancelledAmount)} tone="rose" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-900/5">
          <p className="text-sm font-bold text-slate-500">Categorías</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl text-slate-950">{formatNumber(categories)}</p>
        </article>
        <article className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-900/5">
          <p className="text-sm font-bold text-slate-500">Productos</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl text-slate-950">{formatNumber(products)}</p>
        </article>
        <article className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-900/5">
          <p className="text-sm font-bold text-slate-500">Pedidos activos</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl text-slate-950">{formatNumber(activeOrders.length)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Total histórico: {formatNumber(orders)}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">Productos con más movimiento</h2>
            <Link href="/admin/products" className="text-sm font-black text-teal-700">Editar</Link>
          </div>
          <div className="mt-4 space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay datos suficientes.</p>
            ) : (
              topProducts.map(([name, data], index) => (
                <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{index + 1}. {name}</p>
                    <p className="text-xs text-slate-500">{formatMoney(data.total)}</p>
                  </div>
                  <p className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800">
                    {formatNumber(data.qty)} vendidos
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">Últimos cortes de caja</h2>
            <Link href="/admin/cash" className="text-sm font-black text-teal-700">Ir a caja</Link>
          </div>
          <div className="mt-4 space-y-2">
            {cashCuts.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay cortes registrados.</p>
            ) : (
              cashCuts.slice(0, 6).map((cut) => (
                <div key={cut.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{cut.closedAt.toLocaleDateString("es-MX")}</p>
                    <p className="text-xs text-slate-500">Diferencia {formatMoney(cut.difference)}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900">{formatMoney(cut.expectedAmount)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {session.user.role === UserRole.SUPER_ADMIN ? (
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h2 className="text-xl font-black text-slate-950">Resultados de empresas demo</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {demoTenants.map((demo) => {
              const demoPaid = demo.orders.filter((order) => order.paymentStatus === PaymentStatus.PAGADO);
              const demoSales = demoPaid.reduce((sum, order) => sum + Number(order.total), 0);
              const demoCancelled = demo.orders.filter((order) => order.status === OrderStatus.CANCELLED).length;
              return (
                <article key={demo.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{demo.businessName}</p>
                  <p className="text-xs font-semibold text-slate-500">{demo.version} - /{demo.slug}</p>
                  <p className="mt-3 text-2xl font-black text-slate-950">{formatMoney(demoSales)}</p>
                  <p className="text-sm text-slate-600">{formatNumber(demo.orders.length)} pedidos en 60 días</p>
                  <p className="text-sm text-slate-600">{formatNumber(demoCancelled)} cancelaciones</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Próximo reinicio: {demo.demoNextResetAt ? demo.demoNextResetAt.toLocaleDateString("es-MX") : "sin programar"}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h2 className="text-xl font-black text-slate-950">Atajos</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            ["Gestionar categorías", "/admin/categories"],
            ["Gestionar productos", "/admin/products"],
            ["Gestionar pedidos", "/admin/orders"],
            ["Monitor cocina", "/admin/kitchen"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              {label}
            </Link>
          ))}
          {session.user.role === UserRole.SUPER_ADMIN ? (
            <Link href="/admin/tenants" className="rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-500">
              Gestionar negocios SaaS
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
