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
    { href: "/admin/categories", label: "Categorías" },
    { href: "/admin/products", label: "Productos" },
    { href: "/admin/orders", label: "Pedidos" },
    { href: "/admin/kitchen", label: "Cocina" },
    { href: "/admin/cash", label: "Caja" },
    { href: "/admin/settings", label: "Configuración" },
    ...(session.user.role === UserRole.SUPER_ADMIN
      ? [{ href: "/admin/tenants", label: "Negocios SaaS" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_26%),linear-gradient(135deg,#f8fafc,#fff7ed)] pb-28">
      <header className="bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">
              Centro de control Capi
            </p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight">
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
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <nav className="sticky top-4 h-fit rounded-3xl border border-white/70 bg-white/85 p-2 shadow-xl shadow-slate-900/5 backdrop-blur">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
      {tenant ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 text-center text-sm text-slate-700 md:flex-row md:gap-4">
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
