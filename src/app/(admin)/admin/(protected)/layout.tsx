import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/admin/logout-button";

function daysUntil(date: Date | null | undefined) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuthSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      version: true,
      contractStartAt: true,
      contractEndAt: true,
    },
  });
  const remainingDays = daysUntil(tenant?.contractEndAt);
  const links = [
    { href: "/admin", label: "Inicio" },
    { href: "/admin/categorias", label: "Categorías" },
    { href: "/admin/productos", label: "Productos" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/cocina", label: "Cocina" },
    { href: "/admin/caja", label: "Caja" },
    { href: "/admin/mesas", label: "Mesas" },
    { href: "/admin/meseros", label: "Meseros" },
    { href: "/admin/impresion", label: "Impresión" },
    { href: "/admin/reportes", label: "Reportes" },
    { href: "/admin/configuracion", label: "Configuración" },
    ...(session.user.role === UserRole.SUPER_ADMIN
      ? [{ href: "/admin/tenants", label: "Negocios SaaS" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_26%),linear-gradient(135deg,#f8fafc,#fff7ed)] pb-6 md:pb-28">
      <header className="bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-300 sm:text-xs sm:tracking-[0.24em]">
              Centro de control Capi
            </p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">
              {session.user.name ?? "Administrador"}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-300">{session.user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-teal-100">
              Plan {tenant?.version ?? "LITE"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/85 p-2 shadow-xl shadow-slate-900/5 backdrop-blur lg:sticky lg:top-4 lg:block lg:h-fit lg:overflow-visible">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block shrink-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
      {tenant ? (
        <div className="mx-3 mb-3 rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur md:fixed md:inset-x-0 md:bottom-0 md:z-40 md:mx-0 md:mb-0 md:rounded-none md:border-x-0 md:border-b-0">
          <div className="mx-auto grid max-w-5xl gap-2 text-center text-xs text-slate-700 sm:text-sm md:flex md:items-center md:justify-center md:gap-4">
            <span>
              Plan contratado: <strong>{tenant.version}</strong>
            </span>
            <span>
              Inicio: <strong>{tenant.contractStartAt.toLocaleDateString("es-MX")}</strong>
            </span>
            <span>
              Renovación:{" "}
              <strong>
                {tenant.contractEndAt ? tenant.contractEndAt.toLocaleDateString("es-MX") : "Sin fecha"}
              </strong>
            </span>
            <span
              className={`rounded-full px-3 py-1 font-black ${
                remainingDays === null
                  ? "bg-slate-100 text-slate-700"
                  : remainingDays <= 7
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {remainingDays === null
                ? "Vigencia sin fecha"
                : remainingDays < 0
                  ? `Vencido hace ${formatNumber(Math.abs(remainingDays))} días`
                  : `Faltan ${formatNumber(remainingDays)} días`}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
