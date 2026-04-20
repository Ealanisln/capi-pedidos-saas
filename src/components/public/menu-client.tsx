"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatNumber } from "@/lib/format";
import { getPublicTheme, type PublicThemeKey } from "@/lib/public-themes";

type Modifier = {
  id: string;
  name: string;
  price: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  allowMultiple: boolean;
  minSelection: number;
  maxSelection: number | null;
  modifiers: Modifier[];
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryName: string;
  imageUrl?: string | null;
  ingredients: string[];
  modifierGroups: ModifierGroup[];
};

type Category = {
  id: string;
  name: string;
};

type CartModifier = {
  groupName: string;
  modifierName: string;
  price: number;
};

type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedModifierIds: string[];
  selectedModifiers: CartModifier[];
  specialNotes?: string;
};

type ServiceType = "MOSTRADOR" | "MESA" | "RECOGER" | "DOMICILIO";

type MenuClientProps = {
  tenantSlug: string;
  whatsapp: string;
  version: "LITE" | "PRO" | "ENTERPRISE";
  publicTemplate: PublicThemeKey;
  categories: Category[];
  products: Product[];
};

const planAllowsAdvanced = (version: MenuClientProps["version"]) =>
  version === "PRO" || version === "ENTERPRISE";

export function MenuClient({
  tenantSlug,
  whatsapp,
  version,
  publicTemplate,
  categories,
  products,
}: MenuClientProps) {
  const advanced = planAllowsAdvanced(version);
  const template = getPublicTheme(publicTemplate);
  const { titleText, bodyText, helperText } = template;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("RECOGER");
  const [tableName, setTableName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectionByGroup, setSelectionByGroup] = useState<Record<string, string[]>>({});
  const [itemNotes, setItemNotes] = useState("");

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryOk = activeCategory === "all" || product.categoryName === activeCategory;
      const query = search.trim().toLowerCase();
      const searchOk =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.categoryName.toLowerCase().includes(query) ||
        (product.description ?? "").toLowerCase().includes(query) ||
        product.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query));
      return categoryOk && searchOk;
    });
  }, [products, activeCategory, search]);

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          products: visibleProducts.filter((product) => product.categoryName === category.name),
        }))
        .filter((category) => category.products.length > 0),
    [categories, visibleProducts],
  );

  const featuredProducts = useMemo(() => {
    if (!advanced) return [];
    return products
      .filter((product) => product.imageUrl || product.modifierGroups.length > 0 || product.ingredients.length > 0)
      .slice(0, 4);
  }, [advanced, products]);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function modifierMap(product: Product) {
    const map = new Map<string, { groupName: string; price: number; name: string }>();
    product.modifierGroups.forEach((group) => {
      group.modifiers.forEach((modifier) => {
        map.set(modifier.id, {
          groupName: group.name,
          price: modifier.price,
          name: modifier.name,
        });
      });
    });
    return map;
  }

  function addSimple(product: Product) {
    const unitPrice = product.price;
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        selectedModifierIds: [],
        selectedModifiers: [],
      },
    ]);
  }

  function toggleModifier(group: ModifierGroup, modifierId: string) {
    setSelectionByGroup((prev) => {
      const current = prev[group.id] ?? [];
      if (group.allowMultiple) {
        if (current.includes(modifierId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
        }
        if (group.maxSelection && current.length >= group.maxSelection) return prev;
        return { ...prev, [group.id]: [...current, modifierId] };
      }
      return { ...prev, [group.id]: [modifierId] };
    });
  }

  function openCustomize(product: Product) {
    const initial: Record<string, string[]> = {};
    product.modifierGroups.forEach((group) => {
      initial[group.id] = [];
    });
    setSelectionByGroup(initial);
    setItemNotes("");
    setEditingProductId(product.id);
  }

  function addCustomized(product: Product) {
    const invalidGroup = product.modifierGroups.find((group) => {
      const selected = selectionByGroup[group.id] ?? [];
      if (group.isRequired && selected.length < Math.max(1, group.minSelection)) return true;
      if (selected.length < group.minSelection) return true;
      if (group.maxSelection && selected.length > group.maxSelection) return true;
      return false;
    });

    if (invalidGroup) {
      setFeedback(`Revisa selección en: ${invalidGroup.name}`);
      return;
    }

    const map = modifierMap(product);
    const selectedModifierIds = Object.values(selectionByGroup).flat();
    const selectedModifiers = selectedModifierIds
      .map((id) => map.get(id))
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .map((value) => ({
        groupName: value.groupName,
        modifierName: value.name,
        price: value.price,
      }));
    const extra = selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);
    const unitPrice = product.price + extra;

    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        selectedModifierIds,
        selectedModifiers,
        specialNotes: itemNotes.trim() || undefined,
      },
    ]);
    setEditingProductId(null);
    setSelectionByGroup({});
    setItemNotes("");
  }

  function decrement(itemIndex: number) {
    setCart((prev) =>
      prev
        .map((item, index) =>
          index === itemIndex
            ? { ...item, quantity: item.quantity - 1, totalPrice: item.totalPrice - item.unitPrice }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function increment(itemIndex: number) {
    setCart((prev) =>
      prev.map((item, index) =>
        index === itemIndex
          ? { ...item, quantity: item.quantity + 1, totalPrice: item.totalPrice + item.unitPrice }
          : item,
      ),
    );
  }

  async function sendOrder() {
    if (cart.length === 0) {
      setFeedback("Agrega al menos un producto.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          customerName,
          customerPhone,
          customerNotes,
          serviceType,
          tableName: serviceType === "MESA" ? tableName : undefined,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedModifierIds: item.selectedModifierIds,
            specialNotes: item.specialNotes,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.error ?? "No se pudo enviar el pedido.");
        return;
      }

      window.location.href = data.whatsappUrl ?? `https://wa.me/${whatsapp}`;
    } catch (error) {
      console.error(error);
      setFeedback("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderProductAction(product: Product) {
    if (advanced && product.modifierGroups.length > 0) {
      return (
        <button
          type="button"
          onClick={() => openCustomize(product)}
          className={`w-full whitespace-nowrap rounded-xl px-4 py-3 text-sm font-black sm:w-auto ${template.primaryBtn}`}
        >
          Personalizar
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => addSimple(product)}
        className={`w-full whitespace-nowrap rounded-xl px-4 py-3 text-sm font-black sm:w-auto ${template.primaryBtn}`}
      >
        Agregar
      </button>
    );
  }

  return (
    <div className="relative grid min-w-0 gap-4 pb-28 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:pb-0">
      <section className="min-w-0 space-y-4 sm:space-y-5">
        {advanced ? (
          <div className={`rounded-2xl border p-3 shadow-lg shadow-slate-900/10 backdrop-blur md:sticky md:top-3 md:z-20 ${template.panel}`}>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar platillo, ingrediente o categoría..."
                className={`rounded-lg border px-3 py-2 text-sm ${template.input}`}
              />
              <select
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${template.input}`}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div className={`${advanced ? "md:top-24" : "md:top-3"} z-10 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur md:sticky lg:mx-0 lg:px-0`}>
          <div className="flex min-w-max gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                activeCategory === "all" ? template.primaryBtn : template.secondaryBtn
              }`}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.name)}
                className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  activeCategory === category.name ? template.primaryBtn : template.secondaryBtn
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {featuredProducts.length > 0 && activeCategory === "all" && search.trim().length === 0 ? (
          <article className="space-y-3">
            <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${helperText}`}>Recomendados</p>
                <h2 className={`text-2xl font-black ${titleText}`}>Favoritos de la casa</h2>
              </div>
              <span className={`hidden rounded-full px-3 py-1 text-xs font-bold md:inline-flex ${template.accentPill}`}>
                Ideales para empezar
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className={`overflow-hidden rounded-2xl border ${template.productCard}`}>
                  {advanced && product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="h-36 w-full object-cover" />
                  ) : null}
                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-black ${template.accentPill}`}>
                        {index === 0 ? "Más vendido" : "Recomendado"}
                      </span>
                      {product.modifierGroups.length > 0 ? (
                        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${template.accentPill}`}>
                          Personalizable
                        </span>
                      ) : null}
                    </div>
                    <h3 className={`text-lg font-black ${titleText}`}>{product.name}</h3>
                    {product.description ? <p className={`mt-1 text-sm ${bodyText}`}>{product.description}</p> : null}
                    <div className="mt-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
                      <p className={`text-base font-black ${template.priceText}`}>{formatMoney(product.price)}</p>
                      {renderProductAction(product)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {grouped.length === 0 ? (
          <div className={`rounded-2xl border p-5 ${template.panel}`}>
            <p className="font-semibold">No encontramos productos con esos filtros.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className={`mt-3 rounded-xl border px-4 py-2 text-sm font-black ${template.secondaryBtn}`}
            >
              Ver todo el menú
            </button>
          </div>
        ) : null}

        {grouped.map((category) => (
          <article key={category.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className={`min-w-0 break-words text-2xl font-black ${titleText}`}>{category.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${template.accentPill}`}>
                {formatNumber(category.products.length)} opciones
              </span>
            </div>
            <div className="grid gap-3">
              {category.products.map((product, productIndex) => (
                <div key={product.id} className={`overflow-hidden rounded-2xl border ${template.productCard}`}>
                  <div className="grid min-w-0 gap-4 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                    {advanced && product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-40 w-full rounded-2xl object-cover sm:h-44 md:h-28 md:w-28"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {productIndex === 0 ? (
                          <span className={`rounded-full px-2 py-1 text-[11px] font-black ${template.accentPill}`}>
                            Popular
                          </span>
                        ) : null}
                        {advanced && product.modifierGroups.length > 0 ? (
                          <span className={`rounded-full px-2 py-1 text-[11px] font-black ${template.accentPill}`}>
                            Extras
                          </span>
                        ) : null}
                        {advanced && product.ingredients.length > 0 ? (
                          <span className={`rounded-full px-2 py-1 text-[11px] font-black ${template.accentPill}`}>
                            Ingredientes visibles
                          </span>
                        ) : null}
                      </div>
                      <h3 className={`break-words text-lg font-black ${titleText}`}>{product.name}</h3>
                      {product.description ? (
                        <p className={`mt-1 text-sm leading-6 ${bodyText}`}>{product.description}</p>
                      ) : null}
                      {advanced && product.ingredients.length > 0 ? (
                        <p className={`mt-2 text-xs leading-5 ${helperText}`}>
                          Lleva: {product.ingredients.join(", ")}
                        </p>
                      ) : null}
                      {advanced && product.modifierGroups.length > 0 ? (
                        <p className={`mt-1 text-xs leading-5 ${helperText}`}>
                          Puedes personalizar este platillo con extras, tamaños o nivel de picante.
                        </p>
                      ) : null}
                      <p className={`mt-3 text-base font-black ${template.priceText}`}>
                        {formatMoney(product.price)}
                      </p>
                    </div>
                    {renderProductAction(product)}
                  </div>

                  {editingProductId === product.id ? (
                    <div className={`mx-4 mb-4 space-y-3 rounded-2xl border p-4 ${template.customizer}`}>
                      {product.modifierGroups.map((group) => (
                        <div key={group.id}>
                          <p className={`text-sm font-semibold ${template.customizerText}`}>
                            {group.name} {group.isRequired ? "(Obligatorio)" : "(Opcional)"}
                          </p>
                          <p className={`text-xs ${helperText}`}>
                            Min {group.minSelection} / Max {group.maxSelection ?? "sin límite"}
                          </p>
                          <div className="mt-2 grid gap-2">
                            {group.modifiers.map((modifier) => {
                              const selected = (selectionByGroup[group.id] ?? []).includes(modifier.id);
                              return (
                                <label
                                  key={modifier.id}
                                  className={`grid gap-2 rounded-xl border px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${template.secondaryBtn}`}
                                >
                                  <span className="flex min-w-0 items-center gap-2">
                                    <input
                                      type={group.allowMultiple ? "checkbox" : "radio"}
                                      checked={selected}
                                      onChange={() => toggleModifier(group, modifier.id)}
                                    />
                                    <span className="min-w-0 break-words">{modifier.name}</span>
                                  </span>
                                  <span className="shrink-0 font-semibold">+{formatMoney(modifier.price)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <textarea
                        value={itemNotes}
                        onChange={(event) => setItemNotes(event.target.value)}
                        placeholder="Notas especiales (sin cebolla, bien cocido...)"
                        className={`min-h-20 w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
                      />
                      <div className="grid gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => addCustomized(product)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold ${template.primaryBtn}`}
                        >
                          Agregar personalizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className={`rounded-lg border px-4 py-2 text-sm ${template.secondaryBtn}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <aside id="pedido" className={`h-fit min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 lg:sticky lg:top-4 ${template.panel}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${helperText}`}>Carrito</p>
            <h2 className="text-xl font-black">Tu pedido</h2>
          </div>
          {cartItemsCount > 0 ? (
            <span className={`rounded-full px-3 py-1 text-xs font-black ${template.accentPill}`}>
              {formatNumber(cartItemsCount)}
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm">Aún no agregas productos.</p>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.productId}-${index}`} className={`rounded-lg border p-3 ${template.cartItem}`}>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm">
                  {formatMoney(item.unitPrice)} x {formatNumber(item.quantity)}
                </p>
                {item.selectedModifiers.length > 0 ? (
                  <p className={`mt-1 text-xs ${helperText}`}>
                    {item.selectedModifiers
                      .map((modifier) => `${modifier.groupName}: ${modifier.modifierName}`)
                      .join(" | ")}
                  </p>
                ) : null}
                {item.specialNotes ? (
                  <p className={`mt-1 text-xs ${helperText}`}>Nota: {item.specialNotes}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => decrement(index)}
                    className={`rounded-md border px-2 py-1 text-xs ${template.secondaryBtn}`}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => increment(index)}
                    className={`rounded-md border px-2 py-1 text-xs ${template.secondaryBtn}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-lg font-black">Total: {formatMoney(total)}</p>

        <div className="mt-4 space-y-2">
          <select
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value as ServiceType)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
          >
            <option value="RECOGER">Para recoger</option>
            <option value="DOMICILIO">A domicilio</option>
            <option value="MESA">Estoy en mesa</option>
            <option value="MOSTRADOR">Mostrador</option>
          </select>
          {serviceType === "MESA" ? (
            <input
              value={tableName}
              onChange={(event) => setTableName(event.target.value)}
              placeholder="Mesa (ej. Mesa 4, Terraza 2)"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
            />
          ) : null}
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Nombre (opcional)"
            className={`w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
          />
          <input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="Teléfono (opcional)"
            className={`w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
          />
          <textarea
            value={customerNotes}
            onChange={(event) => setCustomerNotes(event.target.value)}
            placeholder="Notas generales del pedido"
            className={`min-h-20 w-full rounded-lg border px-3 py-2 text-sm ${template.input}`}
          />
        </div>

        {feedback ? <p className="mt-3 text-sm text-rose-700">{feedback}</p> : null}

        <button
          type="button"
          onClick={sendOrder}
          disabled={submitting}
          className={`mt-4 w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-60 ${template.primaryBtn}`}
        >
          {submitting ? "Enviando..." : "Enviar pedido por WhatsApp"}
        </button>
      </aside>

      {cartItemsCount > 0 ? (
        <a
          href="#pedido"
          className={`fixed bottom-3 left-3 right-3 z-50 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border px-3 py-3 shadow-2xl shadow-slate-900/30 sm:px-4 lg:hidden ${template.panel}`}
        >
          <span className="min-w-0 truncate text-sm font-black">
            {formatNumber(cartItemsCount)} productos - {formatMoney(total)}
          </span>
          <span className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-black sm:px-4 ${template.primaryBtn}`}>
            Ver
          </span>
        </a>
      ) : null}
    </div>
  );
}
