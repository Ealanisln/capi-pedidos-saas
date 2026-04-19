import { PrinterArea } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignCategoryPrinterStationAction, createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../../actions";

const printerAreaLabel: Record<PrinterArea, string> = {
  GENERAL: "General",
  COCINA: "Cocina",
  BARRA: "Barra",
  CAJA: "Caja",
};

export default async function CategoriesPage() {
  const session = await requireAuthSession();
  const categories = await prisma.category.findMany({
    where: { tenantId: session.user.tenantId },
    include: { printerStation: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  const stations = await prisma.printerStation.findMany({
    where: { tenantId: session.user.tenantId, isActive: true },
    orderBy: [{ area: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Nueva categoría</h2>
        <p className="mt-1 text-sm text-slate-600">
          Elige también a qué área debe imprimirse esta categoría cuando se genere ticket de producción.
        </p>
        <form action={createCategoryAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <input
            required
            name="name"
            placeholder="Ej. Antojitos"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <select name="printerArea" defaultValue="COCINA" className="rounded-lg border border-slate-300 px-3 py-2">
            {Object.values(PrinterArea).map((area) => (
              <option key={area} value={area}>{printerAreaLabel[area]}</option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white">
            Crear
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Categorías registradas</h2>
        <div className="mt-4 space-y-2">
          {categories.length === 0 ? (
            <p className="text-slate-600">Aún no hay categorías.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <p className="break-all text-xs text-slate-500">{category.slug}</p>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    Imprime en: {category.printerStation?.name ?? printerAreaLabel[category.printerArea]}
                  </span>
                </div>
                <div className="mt-2 grid gap-2">
                  <form action={updateCategoryAction} className="grid w-full gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <select name="printerArea" defaultValue={category.printerArea} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                      {Object.values(PrinterArea).map((area) => (
                        <option key={area} value={area}>{printerAreaLabel[area]}</option>
                      ))}
                    </select>
                    <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                      Guardar
                    </button>
                  </form>
                  <form action={assignCategoryPrinterStationAction} className="grid w-full gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <select name="printerStationId" defaultValue={category.printerStationId ?? ""} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                      <option value="">Usar área: {printerAreaLabel[category.printerArea]}</option>
                      {stations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name} - {printerAreaLabel[station.area]}{station.deviceName ? ` - ${station.deviceName}` : ""}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700">
                      Asignar estación
                    </button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button className="w-full rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 sm:w-auto">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

