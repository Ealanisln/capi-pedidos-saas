import { TicketPaperWidth } from "@prisma/client";
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
          Aquí defines WhatsApp, plantilla visual, redes sociales y tickets de venta/producción.
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
            <span className="text-sm text-slate-700">Plantilla pública</span>
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

          <div className="md:col-span-2 mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-black text-amber-950">Configuración de tickets</h3>
            <p className="mt-1 text-sm text-amber-900">
              Estos textos aparecen en tickets de venta y producción para impresoras térmicas 80mm o 58mm.
            </p>
          </div>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Ancho de ticket</span>
            <select
              name="ticketPaperWidth"
              defaultValue={tenant.settings?.ticketPaperWidth ?? TicketPaperWidth.MM_80}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value={TicketPaperWidth.MM_80}>80mm - recomendado para caja/cocina</option>
              <option value={TicketPaperWidth.MM_58}>58mm - impresora compacta</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <input
              name="showSocialsOnTicket"
              type="checkbox"
              defaultChecked={tenant.settings?.showSocialsOnTicket ?? true}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">Mostrar redes sociales configuradas en ticket de venta</span>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Mensaje de agradecimiento en ticket de venta</span>
            <textarea
              name="saleTicketMessage"
              defaultValue={tenant.settings?.saleTicketMessage ?? ""}
              placeholder="Ej. Gracias por su compra. Vuelva pronto."
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Mensaje para ticket de producción</span>
            <textarea
              name="productionTicketMessage"
              defaultValue={tenant.settings?.productionTicketMessage ?? ""}
              placeholder="Ej. Revisar notas del cliente antes de preparar."
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Mensaje de propina</span>
            <input
              name="ticketTipMessage"
              defaultValue={tenant.settings?.ticketTipMessage ?? ""}
              placeholder="Ej. Propina sugerida 10% / 15% / 20%. Gracias por apoyar al equipo."
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Nombre de WiFi</span>
            <input
              name="ticketWifiName"
              defaultValue={tenant.settings?.ticketWifiName ?? ""}
              placeholder="Ej. Restaurante Invitados"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Clave de WiFi</span>
            <input
              name="ticketWifiPassword"
              defaultValue={tenant.settings?.ticketWifiPassword ?? ""}
              placeholder="Ej. GraciasPorVenir2026"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
