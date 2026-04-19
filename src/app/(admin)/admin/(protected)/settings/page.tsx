import { requireAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicThemeOptions } from "@/lib/public-themes";
import { updateTenantSettingsAction } from "../../actions";

export default async function SettingsPage() {
  const session = await requireAuthSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: { settings: true },
  });

  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Configuración del restaurante</h2>
        <p className="mt-1 text-sm text-slate-600">
          Aquí defines WhatsApp, plantilla visual y redes sociales del menú público.
        </p>

        <form action={updateTenantSettingsAction} className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Nombre comercial</span>
            <input
              disabled
              value={tenant.businessName}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Slug (URL)</span>
            <input
              disabled
              value={tenant.slug}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Plan contratado</span>
            <input
              disabled
              value={tenant.version}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
            />
            <span className="text-xs text-slate-500">
              Solo el super administrador puede cambiar el plan o la vigencia.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">WhatsApp (52...)</span>
            <input
              name="whatsapp"
              defaultValue={tenant.whatsapp}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Plantilla publica</span>
            <select
              name="publicTemplate"
              defaultValue={tenant.settings?.publicTemplate ?? "CLASICO"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {publicThemeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Todas las plantillas tienen contraste revisado para textos, precios, carrito e inputs.
            </span>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Mensaje de bienvenida</span>
            <textarea
              name="welcomeMessage"
              defaultValue={tenant.settings?.welcomeMessage ?? ""}
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Facebook URL</span>
            <input
              name="facebookUrl"
              defaultValue={tenant.settings?.facebookUrl ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Instagram URL</span>
            <input
              name="instagramUrl"
              defaultValue={tenant.settings?.instagramUrl ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">TikTok URL</span>
            <input
              name="tiktokUrl"
              defaultValue={tenant.settings?.tiktokUrl ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Sitio web URL</span>
            <input
              name="websiteUrl"
              defaultValue={tenant.settings?.websiteUrl ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white md:col-span-2">
            Guardar configuración
          </button>
        </form>
      </section>
    </div>
  );
}
