import { requireAuthSession } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  addIngredientAction,
  addModifierAction,
  addModifierGroupAction,
  createProductAction,
  removeIngredientAction,
  removeModifierAction,
  removeModifierGroupAction,
  toggleProductAvailabilityAction,
  updateProductAction,
} from "../../actions";

export default async function ProductsPage() {
  const session = await requireAuthSession();
  const [tenant, categories, products] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { version: true },
    }),
    prisma.category.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { position: "asc" },
    }),
    prisma.product.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        category: true,
        ingredients: { orderBy: { position: "asc" } },
        modifierGroups: {
          orderBy: { position: "asc" },
          include: { modifiers: { where: { isActive: true }, orderBy: { position: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Nuevo producto</h2>
        <form action={createProductAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            required
            name="name"
            placeholder="Nombre del producto"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            min="1"
            step="0.01"
            name="price"
            placeholder="Precio"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            required
            name="categoryId"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Selecciona categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            name="description"
            placeholder="Descripcion (opcional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="imageUrl"
            placeholder="URL imagen (opcional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          {tenant?.version === "LITE" ? (
            <p className="text-xs text-slate-500 md:col-span-2">
              Plan LITE: puedes guardar URL de imagen, pero la vista publica prioriza diseño simple.
            </p>
          ) : null}
          <button className="rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white md:col-span-2">
            Guardar producto
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Productos</h2>
        <div className="mt-4 space-y-3">
          {products.length === 0 ? (
            <p className="text-slate-600">Aún no hay productos cargados.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.category.name}</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatMoney(product.price)}
                    </p>
                    {product.imageUrl ? (
                      <p className="mt-1 break-all text-xs text-slate-500">Imagen: {product.imageUrl}</p>
                    ) : null}
                  </div>
                  <form action={toggleProductAvailabilityAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      className={`w-full rounded-lg px-3 py-2 text-sm font-semibold sm:w-auto ${
                        product.isAvailable
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {product.isAvailable ? "Disponible" : "No disponible"}
                    </button>
                  </form>
                </div>
                <form action={updateProductAction} className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  <input type="hidden" name="productId" value={product.id} />
                  <input
                    name="name"
                    defaultValue={product.name}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="price"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={Number(product.price)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <select
                    name="categoryId"
                    defaultValue={product.categoryId}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="imageUrl"
                    defaultValue={product.imageUrl ?? ""}
                    placeholder="https://..."
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                    Guardar cambios
                  </button>
                  <textarea
                    name="description"
                    defaultValue={product.description ?? ""}
                    placeholder="Descripcion"
                    className="min-h-16 rounded-lg border border-slate-300 px-2 py-1 text-sm md:col-span-2 xl:col-span-5"
                  />
                </form>

                {tenant?.version !== "LITE" ? (
                  <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 p-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">Ingredientes visibles</p>
                      <p className="text-xs text-slate-500">
                        Lo que agregues aquí aparece en el menú público bajo el texto: &quot;Lleva: ...&quot;.
                      </p>
                      {product.ingredients.length === 0 ? (
                        <p className="text-xs text-slate-500">Sin ingredientes cargados.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {product.ingredients.map((ingredient) => (
                            <form key={ingredient.id} action={removeIngredientAction}>
                              <input type="hidden" name="ingredientId" value={ingredient.id} />
                              <button className="rounded-full border border-slate-300 px-2 py-1 text-xs">
                                {ingredient.name} x
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                      <form action={addIngredientAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          name="name"
                          placeholder="Ej. Cebolla"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        />
                        <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                          Agregar
                        </button>
                      </form>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">Modificadores avanzados</p>
                      <p className="text-xs text-slate-500">
                        El cliente lo ve como opcion &quot;Personalizar&quot; antes de agregar al carrito.
                      </p>
                      {product.modifierGroups.map((group) => (
                        <div key={group.id} className="rounded-lg border border-slate-200 p-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium">
                              {group.name} {group.isRequired ? "(Obligatorio)" : "(Opcional)"}
                            </p>
                            <form action={removeModifierGroupAction}>
                              <input type="hidden" name="groupId" value={group.id} />
                              <button className="text-xs text-rose-700">Eliminar grupo</button>
                            </form>
                          </div>
                          <p className="text-xs text-slate-500">
                            min: {group.minSelection} max: {group.maxSelection ?? "sin limite"}{" "}
                            {group.allowMultiple ? "multiple" : "unico"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.modifiers.map((modifier) => (
                              <form key={modifier.id} action={removeModifierAction}>
                                <input type="hidden" name="modifierId" value={modifier.id} />
                                <button className="rounded-full border border-slate-300 px-2 py-1 text-xs">
                                  {modifier.name} (+{formatMoney(modifier.price)}) x
                                </button>
                              </form>
                            ))}
                          </div>
                          <form action={addModifierAction} className="mt-2 grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
                            <input type="hidden" name="groupId" value={group.id} />
                            <input
                              name="name"
                              placeholder="Extra queso"
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                            <input
                              name="price"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="15"
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                              +
                            </button>
                          </form>
                        </div>
                      ))}

                      <form action={addModifierGroupAction} className="grid gap-2 rounded-lg border border-slate-200 p-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          name="name"
                          placeholder="Grupo (Ej. Tamaño)"
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" name="isRequired" />
                            Obligatorio
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" name="allowMultiple" defaultChecked />
                            Multi selección
                          </label>
                          <input
                            name="minSelection"
                            type="number"
                            min="0"
                            defaultValue="0"
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            placeholder="min"
                          />
                          <input
                            name="maxSelection"
                            type="number"
                            min="1"
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            placeholder="max"
                          />
                        </div>
                        <button className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
                          Crear grupo
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Plan LITE: no incluye ingredientes visibles ni modificadores avanzados.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
