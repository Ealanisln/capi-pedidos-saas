import Link from "next/link";

const plans = [
  {
    name: "Lite",
    price: "$190",
    period: "MXN / mes",
    eyebrow: "Para empezar rápido",
    promise: "Menú digital y pedidos por WhatsApp sin comisión por orden.",
    description:
      "Pensado para fondas, cocinas económicas y negocios que quieren dejar de mandar fotos del menú y recibir pedidos mejor armados.",
    points: [
      "Categorías y productos ilimitados",
      "Carrito y envío directo a WhatsApp",
      "Control de agotados",
      "Pedidos con datos del cliente",
      "Panel básico de administración",
    ],
    bestFor: "Fondas, loncherías, antojitos y cocinas pequeñas.",
    demoMenu: "/fonda_lupita",
    demoAdmin: "/admin/login?demo=lite",
    accent: "bg-[#ffe9a7] text-[#3a2600]",
  },
  {
    name: "Pro",
    price: "$350",
    period: "MXN / mes",
    eyebrow: "Más recomendado",
    promise: "Una experiencia visual para vender mejor cada platillo.",
    description:
      "Para restaurantes que necesitan fotos, ingredientes visibles, modificadores, búsqueda, favoritos y una presentación más completa.",
    points: [
      "Todo lo de Lite",
      "Imágenes de productos",
      "Ingredientes visibles",
      "Modificadores avanzados",
      "Búsqueda, filtros y analítica",
    ],
    bestFor: "Taquerías, cafeterías, marisquerías y pizzerías.",
    demoMenu: "/taqueria_don_jose",
    demoAdmin: "/admin/login?demo=pro",
    featured: true,
    accent: "bg-[#9cf2df] text-[#06332b]",
  },
  {
    name: "Enterprise",
    price: "$550",
    period: "MXN / mes",
    eyebrow: "Operación completa",
    promise: "Pedidos, cocina, caja y dashboard para operar con más control.",
    description:
      "Para negocios con mayor movimiento, varios roles, cortes de caja, monitor de cocina y necesidad de seguimiento diario.",
    points: [
      "Todo lo de Pro",
      "Dashboard enriquecido",
      "Monitor de cocina",
      "Caja y cortes del día",
      "Soporte prioritario",
    ],
    bestFor: "Dark kitchens, grupos restauranteros y alto volumen.",
    demoMenu: "/grupo_nopal",
    demoAdmin: "/admin/login?demo=enterprise",
    accent: "bg-[#ffb47d] text-[#401500]",
  },
];

const demos = [
  {
    name: "Fonda Lupita",
    type: "Demo Lite",
    giro: "Cocina económica",
    description: "Comidas corridas, aguas frescas, guisados y pedidos sencillos por WhatsApp.",
    menu: "/fonda_lupita",
    admin: "/admin/login?demo=lite",
    gradient: "from-[#ffd166] via-[#f78c6b] to-[#ef476f]",
  },
  {
    name: "Taquería Don José",
    type: "Demo Pro",
    giro: "Taquería mexicana",
    description: "Tacos, gringas, extras, ingredientes visibles, fotos, búsqueda y favoritos.",
    menu: "/taqueria_don_jose",
    admin: "/admin/login?demo=pro",
    gradient: "from-[#06d6a0] via-[#118ab2] to-[#073b4c]",
  },
  {
    name: "Grupo Nopal",
    type: "Demo Enterprise",
    giro: "Operación completa",
    description: "Dashboard, pedidos, cocina, caja, cortes y datos demo para enseñar valor operativo.",
    menu: "/grupo_nopal",
    admin: "/admin/login?demo=enterprise",
    gradient: "from-[#f77f00] via-[#d62828] to-[#003049]",
  },
  {
    name: "Mariscos El Faro",
    type: "Tema Marisquería",
    giro: "Mariscos y ceviches",
    description: "Cocteles, tostadas, órdenes familiares, colores frescos y productos con fotografía.",
    menu: "/mariscos_el_faro",
    admin: "/admin/login?demo=mariscos",
    gradient: "from-[#48cae4] via-[#00b4d8] to-[#0077b6]",
  },
  {
    name: "Café Amanecer",
    type: "Tema Cafetería",
    giro: "Café y desayunos",
    description: "Bebidas calientes, pan dulce, desayunos, combos y una vista más cálida.",
    menu: "/cafe_amanecer",
    admin: "/admin/login?demo=cafe",
    gradient: "from-[#f4a261] via-[#99582a] to-[#432818]",
  },
  {
    name: "Pizza del Barrio",
    type: "Tema Pizzería",
    giro: "Pizzería familiar",
    description: "Pizzas, pastas, combos, extras y tickets promedio más altos.",
    menu: "/pizza_barrio",
    admin: "/admin/login?demo=pizza",
    gradient: "from-[#ffba08] via-[#f48c06] to-[#d00000]",
  },
];

const flow = [
  {
    step: "01",
    title: "El cliente elige",
    description: "Ve el menú desde el celular, filtra categorías, revisa ingredientes y arma su carrito.",
  },
  {
    step: "02",
    title: "El pedido llega claro",
    description: "Productos, cantidades, modificadores, notas y datos del cliente llegan ordenados.",
  },
  {
    step: "03",
    title: "Cocina produce",
    description: "El monitor ayuda a mover pedidos de nuevo a preparando y listo sin perder comanda.",
  },
  {
    step: "04",
    title: "Caja controla",
    description: "Opcionalmente se registran cobros, métodos de pago, cortes y diferencias del día.",
  },
];

const proof = [
  { value: "0%", label: "comisión por pedido" },
  { value: "3", label: "planes mensuales" },
  { value: "12+", label: "temas por giro" },
  { value: "MX", label: "pensado para México" },
];

const featureBlocks = [
  {
    title: "Para el dueño",
    description: "Dashboard, ventas, productos populares, cortes de caja y vigencia del plan visible en el panel.",
  },
  {
    title: "Para el cliente",
    description: "Menú rápido, claro, responsive, con fotos, ingredientes, extras y envío del pedido a WhatsApp.",
  },
  {
    title: "Para cocina",
    description: "Monitor de comandas por estado para que el equipo sepa qué preparar y qué ya salió.",
  },
  {
    title: "Para caja",
    description: "Cobros del día, métodos de pago, cancelaciones, cortes y resumen para tomar decisiones.",
  },
];

const themes = ["Taquería", "Marisquería", "Cafetería", "Pizzería", "Sushi", "Hamburguesas", "Antojitos", "Bar botanero", "Dark kitchen", "Pollería"];

const externalLinks = [
  {
    label: "Visitar sitio web",
    href: "https://nohmendez.xyz/",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Soluciones-Tecnologicas-Playa-del-Carmen/61586167409780/",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#057564]">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7e8] text-[#13201d]">
      <section className="relative isolate px-4 py-5 md:py-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,#8cf7dd_0,transparent_25%),radial-gradient(circle_at_85%_8%,#ffd166_0,transparent_24%),radial-gradient(circle_at_68%_72%,#ffb4a2_0,transparent_24%),linear-gradient(135deg,#fff7e8,#edfdf8_52%,#fff3d5)]" />
        <div className="absolute left-6 top-28 -z-10 h-28 w-28 rounded-full border-[18px] border-[#13201d]/10" />
        <div className="absolute bottom-16 right-8 -z-10 h-40 w-40 rotate-12 rounded-[2.5rem] bg-[#13201d]/5" />

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[#13201d]/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur md:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Inicio Capi">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#13201d] text-lg font-black text-[#ffe9a7]">
              Ca
            </span>
            <span>
              <span className="block text-base font-black leading-none">Capi</span>
              <span className="text-xs font-bold text-[#56716b]">Menús digitales para vender</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="#planes" className="rounded-full px-4 py-2 text-sm font-extrabold text-[#243a35] hover:bg-[#13201d]/5">
              Planes
            </Link>
            <Link href="#demos" className="rounded-full px-4 py-2 text-sm font-extrabold text-[#243a35] hover:bg-[#13201d]/5">
              Demos
            </Link>
            <Link href="#operacion" className="rounded-full px-4 py-2 text-sm font-extrabold text-[#243a35] hover:bg-[#13201d]/5">
              Operación
            </Link>
          </div>
          <Link
            href="/taqueria_don_jose"
            className="rounded-full bg-[#13201d] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-[#13201d]/15 transition hover:-translate-y-0.5 hover:bg-[#203731]"
          >
            Ver demo
          </Link>
        </nav>

        <div className="mx-auto grid w-full max-w-7xl gap-10 pb-16 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#057564]/20 bg-white/75 px-4 py-2 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06d6a0]" />
              <span className="text-xs font-black uppercase tracking-[0.22em] text-[#057564]">
                Rafael Noh · Soluciones Tecnológicas Playa del Carmen
              </span>
            </div>
            <h1 className="mt-7 max-w-5xl font-[family-name:var(--font-display)] text-5xl font-black leading-[0.88] tracking-[-0.06em] text-[#13201d] sm:text-6xl md:text-8xl">
              Menús digitales que sí se sienten listos para vender.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-[#3f5751] md:text-xl">
              Capi convierte el menú de un restaurante en una experiencia administrable: pedidos por WhatsApp,
              productos, extras, cocina, caja, demos por giro y planes claros para cada etapa del negocio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#planes"
                className="rounded-2xl bg-[#13201d] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-[#13201d]/20 transition hover:-translate-y-0.5 hover:bg-[#203731]"
              >
                Ver planes
              </Link>
              <Link
                href="#demos"
                className="rounded-2xl border border-[#13201d]/15 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#13201d] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffdf8]"
              >
                Probar demos
              </Link>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-4">
              {proof.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <p className="font-[family-name:var(--font-display)] text-3xl font-black text-[#13201d]">{item.value}</p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#5f746f]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-8 hidden rounded-[2rem] bg-[#13201d] p-4 text-white shadow-2xl shadow-[#13201d]/25 md:block">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9cf2df]">Caja hoy</p>
              <p className="mt-2 text-3xl font-black">$18,420</p>
              <p className="text-xs text-white/70">Ventas demo · 43 pedidos</p>
            </div>
            <div className="absolute -right-3 bottom-10 hidden rotate-3 rounded-[2rem] bg-[#ffe9a7] p-4 text-[#3a2600] shadow-xl md:block">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Cocina</p>
              <p className="mt-2 text-lg font-black">7 comandas activas</p>
            </div>
            <div className="rounded-[2.5rem] border border-[#13201d]/10 bg-[#13201d] p-4 shadow-2xl shadow-[#13201d]/25">
              <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,#28e0b9,transparent_30%),linear-gradient(150deg,#162722,#07110f)] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9cf2df]">Vista cliente</p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black leading-none">Taquería Don José</h2>
                    <p className="mt-2 text-sm font-semibold text-white/65">Abierto · Pedidos por WhatsApp</p>
                  </div>
                  <span className="rounded-full bg-[#9cf2df] px-3 py-1 text-xs font-black text-[#06332b]">Pro</span>
                </div>
                <div className="mt-6 flex gap-2 overflow-hidden">
                  {['Tacos', 'Gringas', 'Bebidas', 'Extras'].map((item, index) => (
                    <span key={item} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${index === 0 ? 'bg-white text-[#13201d]' : 'bg-white/10 text-white'}`}>
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    ['Taco al pastor', 'Lleva: cebolla, cilantro y piña', '$24'],
                    ['Gringa tradicional', 'Queso, tortilla de harina y salsa a elegir', '$74'],
                    ['Agua de horchata', 'Natural, fría y en vaso grande', '$32'],
                  ].map(([name, detail, price]) => (
                    <div key={name} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-black">{name}</p>
                          <p className="mt-1 text-sm leading-5 text-white/65">{detail}</p>
                        </div>
                        <p className="font-black text-[#9cf2df]">{price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl bg-white p-4 text-[#13201d]">
                  <div className="flex items-center justify-between">
                    <p className="font-black">Tu pedido</p>
                    <p className="text-sm font-black">$130.00</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#667873]">3 productos · listo para WhatsApp</p>
                  <div className="mt-4 rounded-2xl bg-[#06d6a0] px-4 py-3 text-center text-sm font-black text-[#06332b]">
                    Enviar pedido
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="relative bg-[#13201d] px-4 py-16 text-white md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9cf2df] to-transparent" />
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9cf2df]">Planes mensuales</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
                Tres formas de vender mejor, sin prometer humo.
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-white/65">
              Cada plan muestra sólo lo que realmente tiene. Las demos ayudan a vender con ejemplos reales de México y el panel no expone contraseñas públicamente.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[2.25rem] border p-6 shadow-2xl ${
                  plan.featured
                    ? "border-[#9cf2df] bg-white text-[#13201d] shadow-[#06d6a0]/20"
                    : "border-white/10 bg-white/[0.06] text-white shadow-black/10"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-[#13201d] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                    Recomendado
                  </span>
                ) : null}
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${plan.accent}`}>
                  {plan.eyebrow}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-black">{plan.name}</h3>
                <p className="mt-2 text-lg font-black">{plan.promise}</p>
                <div className="mt-5 flex items-end gap-2">
                  <p className="font-[family-name:var(--font-display)] text-6xl font-black tracking-[-0.05em]">{plan.price}</p>
                  <p className={`pb-3 text-sm font-extrabold ${plan.featured ? "text-[#637771]" : "text-white/55"}`}>{plan.period}</p>
                </div>
                <p className={`mt-5 text-sm font-semibold leading-6 ${plan.featured ? "text-[#4f6660]" : "text-white/65"}`}>{plan.description}</p>
                <ul className="mt-6 space-y-3 text-sm font-bold">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#06d6a0] text-xs font-black text-[#06332b]">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className={`mt-6 rounded-2xl p-4 text-sm font-bold leading-6 ${plan.featured ? "bg-[#edfdf8] text-[#21423b]" : "bg-white/10 text-white/70"}`}>
                  Ideal para: {plan.bestFor}
                </p>
                <div className="mt-6 border-t border-current/10 pt-5">
                  <p className={`mb-3 text-xs font-black uppercase tracking-[0.2em] ${plan.featured ? "text-[#057564]" : "text-[#9cf2df]"}`}>Demo</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href={plan.demoMenu}
                      className={`rounded-2xl px-4 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${
                        plan.featured ? "bg-[#13201d] text-white hover:bg-[#203731]" : "bg-[#9cf2df] text-[#06332b] hover:bg-[#c4fff1]"
                      }`}
                    >
                      Ver menú
                    </Link>
                    <Link
                      href={plan.demoAdmin}
                      className={`rounded-2xl border px-4 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${
                        plan.featured ? "border-[#13201d]/15 text-[#13201d] hover:bg-[#f6faf8]" : "border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      Panel admin
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demos" className="px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <SectionLabel>Demos enriquecidas</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
                Enséñales algo que parezca de su propio negocio.
              </h2>
            </div>
            <p className="text-base font-semibold leading-8 text-[#49635d]">
              Las demos tienen productos, pedidos, cortes, ventas y estilos por giro. Sirven para que el prospecto juegue, revise el menú público y entienda qué va a recibir en su panel.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {demos.map((demo) => (
              <article key={demo.name} className="group overflow-hidden rounded-[2rem] border border-[#13201d]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#13201d]/10">
                <div className={`relative h-36 bg-gradient-to-br ${demo.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.55),transparent_24%),radial-gradient(circle_at_80%_45%,rgba(255,255,255,.28),transparent_20%)]" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#13201d]">
                    {demo.type}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#057564]">{demo.giro}</p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black">{demo.name}</h3>
                  <p className="mt-3 min-h-18 text-sm font-semibold leading-6 text-[#5d746f]">{demo.description}</p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    <Link href={demo.menu} className="rounded-2xl bg-[#13201d] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#203731]">
                      Ver menú
                    </Link>
                    <Link href={demo.admin} className="rounded-2xl border border-[#13201d]/15 px-4 py-3 text-center text-sm font-black text-[#13201d] transition hover:bg-[#fff7e8]">
                      Panel admin
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="operacion" className="bg-[#f1fff9] px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>Operación diaria</SectionLabel>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
              Del antojo del cliente al corte de caja.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {flow.map((item) => (
              <article key={item.step} className="rounded-[2rem] border border-[#13201d]/10 bg-white p-6 shadow-sm">
                <p className="font-[family-name:var(--font-display)] text-5xl font-black text-[#06a98b]">{item.step}</p>
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#5d746f]">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featureBlocks.map((block) => (
              <article key={block.title} className="rounded-[2rem] bg-[#13201d] p-6 text-white shadow-xl shadow-[#13201d]/10">
                <h3 className="text-xl font-black text-[#9cf2df]">{block.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/65">{block.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-[2.5rem] border border-[#13201d]/10 bg-white p-6 shadow-2xl shadow-[#13201d]/10 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Personalización</SectionLabel>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
              Un menú no debe verse igual para una taquería que para un café.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-[#49635d]">
              Capi ya contempla temas por giro para que cada cliente tenga una presencia distinta sin perder administración centralizada.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themes.map((theme, index) => (
              <div
                key={theme}
                className={`rounded-3xl p-4 text-sm font-black shadow-sm ${
                  index % 3 === 0
                    ? "bg-[#13201d] text-white"
                    : index % 3 === 1
                      ? "bg-[#ffe9a7] text-[#3a2600]"
                      : "bg-[#9cf2df] text-[#06332b]"
                }`}
              >
                {theme}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 md:pb-24">
        <div className="mx-auto overflow-hidden rounded-[2.5rem] bg-[#13201d] text-white shadow-2xl shadow-[#13201d]/20 md:max-w-7xl">
          <div className="grid gap-8 p-8 md:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9cf2df]">Implementación local</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
                Creado por Rafael Noh para vender tecnología útil en Playa del Carmen y México.
              </h2>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-white/65">
                Acompañamiento para configurar productos, dominio, WhatsApp, demos, panel administrativo y operación inicial del restaurante.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {externalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] bg-white p-6 text-[#13201d]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#057564]">Mensaje comercial sugerido</p>
              <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-black leading-tight">
                “Tu cliente no quiere descargar una app. Quiere ver qué vendes, elegir rápido y pedir por WhatsApp.”
              </p>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#5d746f]">
                Capi se enfoca en esa venta directa, pero agrega administración, cocina, caja y datos para que el restaurante no sólo reciba mensajes: opere mejor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
