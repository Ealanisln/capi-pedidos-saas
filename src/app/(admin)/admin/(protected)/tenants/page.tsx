import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTenantAction,
  resetDemoTenantAction,
  updateTenantDemoSettingsAction,
  updateTenantPlanAction,
} from "../../actions";

function formatDateInput(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function daysUntil(date: Date | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

export default async function TenantsPage() {
  const session = await requireAuthSession();
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Acceso restringido</h2>
        <p className="mt-2 text-slate-600">Solo el usuario SUPER_ADMIN puede crear negocios.</p>
      </section>
    );
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Alta de nuevo negocio</h2>
        <form action={createTenantAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            required
            name="businessName"
            placeholder="Nombre del negocio"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            name="slug"
            placeholder="slug_ejemplo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            name="whatsapp"
            placeholder="52984..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <select name="version" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="LITE">LITE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <input
            name="contractMonths"
            type="number"
            min="1"
            defaultValue="1"
            placeholder="Meses contratados"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white md:col-span-2">
            Crear negocio
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Usa solo minusculas, numeros y guion bajo para el slug.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Negocios registrados</h2>
        <div className="mt-4 space-y-2">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="grid gap-3 rounded-lg border border-slate-200 px-3 py-3 lg:grid-cols-[1fr_2fr_auto]"
            >
              <div>
                <p className="font-medium text-slate-900">{tenant.businessName}</p>
                <p className="text-xs text-slate-500">/{tenant.slug} - {tenant.version}</p>
                <p className="text-xs text-slate-500">
                  Vence: {tenant.contractEndAt ? tenant.contractEndAt.toLocaleDateString("es-MX") : "Sin vencimiento"}
                </p>
                {tenant.isDemo ? (
                  <p className="text-xs text-sky-700">
                    Demo activa - se reinicia cada {tenant.demoResetEveryDays} días
                  </p>
                ) : null}
                <p
                  className={`text-xs font-semibold ${
                    (daysUntil(tenant.contractEndAt) ?? 999) <= 7
                      ? "text-rose-700"
                      : "text-emerald-700"
                  }`}
                >
                  {daysUntil(tenant.contractEndAt) === null
                    ? "Sin fecha de renovacion"
                    : daysUntil(tenant.contractEndAt)! < 0
                      ? `Vencido hace ${Math.abs(daysUntil(tenant.contractEndAt)!)} días`
                      : `Faltan ${daysUntil(tenant.contractEndAt)} días para renovar`}
                </p>
                {tenant.isDemo ? (
                  <p className="text-xs text-slate-500">
                    Ultimo reinicio:{" "}
                    {tenant.demoLastResetAt
                      ? tenant.demoLastResetAt.toLocaleDateString("es-MX")
                      : "Pendiente"}{" "}
                    | Próximo:{" "}
                    {tenant.demoNextResetAt
                      ? tenant.demoNextResetAt.toLocaleDateString("es-MX")
                      : "Sin programar"}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <form action={updateTenantPlanAction} className="grid w-full gap-2 md:grid-cols-4">
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <select
                    name="version"
                    defaultValue={tenant.version}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="LITE">LITE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                  <input
                    name="contractStartAt"
                    type="date"
                    defaultValue={formatDateInput(tenant.contractStartAt)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="contractEndAt"
                    type="date"
                    defaultValue={formatDateInput(tenant.contractEndAt)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
                    Guardar plan y vigencia
                  </button>
                </form>
                <form action={updateTenantDemoSettingsAction} className="grid w-full gap-2 md:grid-cols-[auto_1fr_auto]">
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700">
                    <input type="checkbox" name="isDemo" defaultChecked={tenant.isDemo} />
                    Es demo
                  </label>
                  <input
                    name="demoResetEveryDays"
                    type="number"
                    min="1"
                    defaultValue={tenant.demoResetEveryDays || 5}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    placeholder="días para reinicio"
                  />
                  <button className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700">
                    Guardar demo
                  </button>
                </form>
                {tenant.isDemo ? (
                  <form action={resetDemoTenantAction}>
                    <input type="hidden" name="tenantId" value={tenant.id} />
                    <button className="rounded-lg bg-sky-700 px-3 py-1 text-sm font-semibold text-white">
                      Reiniciar demo ahora
                    </button>
                  </form>
                ) : null}
              </div>
              <div className="flex items-start">
                <Link
                  href={`/${tenant.slug}`}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700"
                >
                  Ver menu
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
