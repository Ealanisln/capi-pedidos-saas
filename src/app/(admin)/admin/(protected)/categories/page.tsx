import { requireAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../../actions";

export default async function CategoriesPage() {
  const session = await requireAuthSession();
  const categories = await prisma.category.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Nueva categoria</h2>
        <form action={createCategoryAction} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            required
            name="name"
            placeholder="Ej. Antojitos"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.slug}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={updateCategoryAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
                      Renombrar
                    </button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button className="rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-700">
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
