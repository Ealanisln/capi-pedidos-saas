import { PrismaClient, PrinterArea, PublicTemplate, TableStatus, UserRole, Version } from "@prisma/client";
import bcrypt from "bcryptjs";
import { resetDemoTenantData } from "../src/lib/demo-reset";
import { applyPlanLimits, planLimits } from "../src/lib/plan-limits";

const prisma = new PrismaClient();

type DemoProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl?: string;
};
type DemoCategory = { name: string; slug: string; products: DemoProduct[] };

async function setProductEnhancements(options: {
  tenantId: string;
  productSlug: string;
  ingredients: string[];
  groups: Array<{
    name: string;
    isRequired?: boolean;
    allowMultiple?: boolean;
    minSelection?: number;
    maxSelection?: number | null;
    modifiers: Array<{ name: string; price: number }>;
  }>;
}) {
  const product = await prisma.product.findUnique({
    where: {
      tenantId_slug: {
        tenantId: options.tenantId,
        slug: options.productSlug,
      },
    },
  });
  if (!product) return;

  await prisma.ingredient.deleteMany({ where: { productId: product.id } });
  await prisma.modifierGroup.deleteMany({ where: { productId: product.id } });

  for (let i = 0; i < options.ingredients.length; i += 1) {
    await prisma.ingredient.create({
      data: { productId: product.id, name: options.ingredients[i], position: i + 1 },
    });
  }

  for (let g = 0; g < options.groups.length; g += 1) {
    const group = options.groups[g];
    const dbGroup = await prisma.modifierGroup.create({
      data: {
        productId: product.id,
        name: group.name,
        isRequired: group.isRequired ?? false,
        allowMultiple: group.allowMultiple ?? true,
        minSelection: group.minSelection ?? 0,
        maxSelection: group.maxSelection ?? null,
        position: g + 1,
      },
    });
    for (let m = 0; m < group.modifiers.length; m += 1) {
      const modifier = group.modifiers[m];
      await prisma.modifier.create({
        data: {
          groupId: dbGroup.id,
          name: modifier.name,
          price: modifier.price,
          position: m + 1,
          isActive: true,
        },
      });
    }
  }
}

async function ensureTenant(options: {
  slug: string;
  businessName: string;
  whatsapp: string;
  version: Version;
  welcomeMessage: string;
  publicTemplate?: PublicTemplate;
  isDemo?: boolean;
  contractMonths?: number;
  contractEndDaysFromNow?: number;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  categories: DemoCategory[];
}) {
  const contractStartAt = new Date();
  const contractEndAt = new Date(contractStartAt);
  if (options.contractEndDaysFromNow !== undefined) {
    contractEndAt.setDate(contractEndAt.getDate() + options.contractEndDaysFromNow);
  } else {
    contractEndAt.setMonth(contractEndAt.getMonth() + (options.contractMonths ?? 1));
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: options.slug },
    update: {
      name: options.businessName,
      businessName: options.businessName,
      whatsapp: options.whatsapp,
      version: options.version,
      ...applyPlanLimits(options.version),
      isDemo: options.isDemo ?? false,
      demoResetEveryDays: options.isDemo ? 5 : 0,
      contractStartAt,
      contractEndAt,
      subdomain: null,
      isActive: true,
    },
    create: {
      slug: options.slug,
      name: options.businessName,
      businessName: options.businessName,
      whatsapp: options.whatsapp,
      version: options.version,
      ...applyPlanLimits(options.version),
      isDemo: options.isDemo ?? false,
      demoResetEveryDays: options.isDemo ? 5 : 0,
      contractStartAt,
      contractEndAt,
      subdomain: null,
      isActive: true,
    },
  });

  await prisma.settings.upsert({
    where: { tenantId: tenant.id },
    update: {
      welcomeMessage: options.welcomeMessage,
      publicTemplate: options.publicTemplate ?? PublicTemplate.CLASICO,
      facebookUrl: options.facebookUrl ?? null,
      instagramUrl: options.instagramUrl ?? null,
      websiteUrl: options.websiteUrl ?? null,
    },
    create: {
      tenantId: tenant.id,
      welcomeMessage: options.welcomeMessage,
      publicTemplate: options.publicTemplate ?? PublicTemplate.CLASICO,
      facebookUrl: options.facebookUrl ?? null,
      instagramUrl: options.instagramUrl ?? null,
      websiteUrl: options.websiteUrl ?? null,
    },
  });

  for (let index = 0; index < options.categories.length; index += 1) {
    const category = options.categories[index];
    const dbCategory = await prisma.category.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: category.slug,
        },
      },
      update: { name: category.name, position: index + 1, isActive: true },
      create: {
        tenantId: tenant.id,
        name: category.name,
        slug: category.slug,
        position: index + 1,
        isActive: true,
      },
    });

    for (const product of category.products) {
      await prisma.product.upsert({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: product.slug,
          },
        },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: dbCategory.id,
          isAvailable: true,
          imageUrl: product.imageUrl ?? null,
        },
        create: {
          tenantId: tenant.id,
          categoryId: dbCategory.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          isAvailable: true,
          imageUrl: product.imageUrl ?? null,
        },
      });
    }
  }

  return tenant;
}

async function ensureUser(options: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tenantId: string;
}) {
  const passwordHash = await bcrypt.hash(options.password, 10);
  await prisma.user.upsert({
    where: { email: options.email.trim().toLowerCase() },
    update: {
      name: options.name,
      role: options.role,
      tenantId: options.tenantId,
      passwordHash,
    },
    create: {
      email: options.email.trim().toLowerCase(),
      name: options.name,
      role: options.role,
      tenantId: options.tenantId,
      passwordHash,
    },
  });
}

async function ensureOperationalDemoData(options: {
  tenantId: string;
  slug: string;
  version: Version;
  demoEmailDomain: string;
  demoPassword: string;
}) {
  const limits = planLimits(options.version);
  const drawerCount = Math.min(limits.cashDrawers, options.version === Version.ENTERPRISE ? 5 : limits.cashDrawers);
  const waiterCount = options.slug === "taqueria_don_jose"
    ? 7
    : options.version === Version.LITE
      ? 2
      : options.version === Version.ENTERPRISE
        ? 10
        : 5;
  const tableCount = options.slug === "taqueria_don_jose"
    ? 15
    : options.version === Version.LITE
      ? 10
      : options.version === Version.ENTERPRISE
        ? 30
        : 15;

  const baseStationSpecs = [
    { name: "Caja principal", slug: "caja_principal", area: PrinterArea.CAJA, isDefault: true },
    { name: "Cocina caliente", slug: "cocina_caliente", area: PrinterArea.COCINA, isDefault: true },
    { name: "Barra de bebidas", slug: "barra_bebidas", area: PrinterArea.BARRA, isDefault: true },
    { name: "Impresora general", slug: "impresora_general", area: PrinterArea.GENERAL, isDefault: false },
  ];
  const stationSpecs = baseStationSpecs.slice(0, limits.printerStations);
  const stationSlugs = stationSpecs.map((station) => station.slug);

  const stations = new Map<PrinterArea, string>();
  for (const station of stationSpecs) {
    const dbStation = await prisma.printerStation.upsert({
      where: { tenantId_slug: { tenantId: options.tenantId, slug: station.slug } },
      update: {
        name: station.name,
        area: station.area,
        isDefault: station.isDefault,
        isActive: true,
      },
      create: {
        tenantId: options.tenantId,
        name: station.name,
        slug: station.slug,
        area: station.area,
        isDefault: station.isDefault,
        isActive: true,
      },
    });
    if (!stations.has(station.area)) stations.set(station.area, dbStation.id);
  }

  await prisma.printerStation.deleteMany({
    where: {
      tenantId: options.tenantId,
      slug: { notIn: stationSlugs },
    },
  });

  const categories = await prisma.category.findMany({ where: { tenantId: options.tenantId } });
  for (const category of categories) {
    const isDrink = /bebida|cafe|cafÒ©|coctel|limónada|naranjada|refresco|agua/i.test(`${category.name} ${category.slug}`);
    const area = isDrink ? PrinterArea.BARRA : PrinterArea.COCINA;
    await prisma.category.update({
      where: { id: category.id },
      data: {
        printerArea: area,
        printerStationId: stations.get(area) ?? null,
      },
    });
  }

  for (let index = 1; index <= drawerCount; index += 1) {
    await prisma.cashDrawer.upsert({
      where: { tenantId_slug: { tenantId: options.tenantId, slug: `caja_${index}` } },
      update: {
        name: index === 1 ? "Caja principal" : `Caja ${index}`,
        isActive: true,
      },
      create: {
        tenantId: options.tenantId,
        name: index === 1 ? "Caja principal" : `Caja ${index}`,
        slug: `caja_${index}`,
        isActive: true,
      },
    });
  }

  const waiterNames = [
    "Ana LÒ³pez",
    "Luis HernÒ¡ndez",
    "MarÒ­a GonzÒ¡lez",
    "Carlos Chan",
    "Diana MÒ©ndez",
    "JosÒ© Pech",
    "Fernanda Ruiz",
    "Roberto Torres",
    "Paola SÒ¡nchez",
    "Miguel Castillo",
  ];
  for (let index = 1; index <= waiterCount; index += 1) {
    await ensureUser({
      email: `mesero${index}.${options.slug}@${options.demoEmailDomain}`,
      password: options.demoPassword,
      name: waiterNames[index - 1] ?? `Mesero ${index}`,
      role: UserRole.MESERO,
      tenantId: options.tenantId,
    });
  }

  for (let index = 1; index <= tableCount; index += 1) {
    const area = index <= Math.ceil(tableCount * 0.65) ? "SalÒ³n" : index <= Math.ceil(tableCount * 0.85) ? "Terraza" : "Barra";
    await prisma.diningTable.upsert({
      where: { tenantId_slug: { tenantId: options.tenantId, slug: `mesa_${index}` } },
      update: {
        name: `Mesa ${index}`,
        area,
        capacity: index % 5 === 0 ? 6 : index % 4 === 0 ? 2 : 4,
        status: TableStatus.LIBRE,
      },
      create: {
        tenantId: options.tenantId,
        name: `Mesa ${index}`,
        slug: `mesa_${index}`,
        area,
        capacity: index % 5 === 0 ? 6 : index % 4 === 0 ? 2 : 4,
        status: TableStatus.LIBRE,
      },
    });
  }
}

async function main() {
  const rootEmail = (process.env.SEED_ADMIN_EMAIL ?? "superadmin@example.com")
    .trim()
    .toLowerCase();
  const rootPassword = (process.env.SEED_ADMIN_PASSWORD ?? "CambiaEstaClave123!").trim();
  const demoEmailDomain = process.env.SEED_DEMO_EMAIL_DOMAIN ?? "example.com";
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "DemoLocal123!";

  const capiTenant = await ensureTenant({
    slug: "capi",
    businessName: "La Capibara Feliz",
    whatsapp: "529841234567",
    version: Version.ENTERPRISE,
    publicTemplate: PublicTemplate.ELEGANTE,
    contractMonths: 12,
    welcomeMessage: "Bienvenido, elige tus favoritos y confirma tu pedido por WhatsApp.",
    categories: [
      {
        name: "Especialidades",
        slug: "especialidades",
        products: [
          {
            name: "Quesadilla de maíz",
            slug: "quesadilla_maíz",
            description: "Hecha al comal con tortilla artesanal.",
            price: 45,
          },
        ],
      },
    ],
  });

  await ensureUser({
    email: rootEmail,
    password: rootPassword,
    name: "Administrador General",
    role: UserRole.SUPER_ADMIN,
    tenantId: capiTenant.id,
  });

  const liteTenant = await ensureTenant({
    slug: "fonda_lupita",
    businessName: "Fonda Lupita",
    whatsapp: "529841111111",
    version: Version.LITE,
    isDemo: true,
    publicTemplate: PublicTemplate.CLASICO,
    contractEndDaysFromNow: 5,
    welcomeMessage: "Sabor casero todos los días. Pide rápido y confirma por WhatsApp.",
    facebookUrl: "https://facebook.com/fondalupita.demo",
    categories: [
      {
        name: "Comidas del dia",
        slug: "comidas_dia",
        products: [
          { name: "Milanesa de pollo", slug: "milanesa_pollo", description: "Incluye arroz y frijoles.", price: 98 },
          { name: "Bistec encebollado", slug: "bistec_encebollado", description: "Con nopales y tortillas.", price: 108 },
          { name: "Enchiladas verdes", slug: "enchiladas_verdes", description: "4 piezas con queso y crema.", price: 92 },
          { name: "Chilaquiles rojos", slug: "chilaquiles_rojos", description: "Con pollo deshebrado.", price: 85 },
          { name: "Pechuga asada", slug: "pechuga_asada", description: "Con ensalada fresca.", price: 112 },
          { name: "Caldo tlalpeno", slug: "caldo_tlalpeno", description: "Con aguacate y chipotle.", price: 88 },
        ],
      },
      {
        name: "Antojitos",
        slug: "antojitos",
        products: [
          { name: "Sope de cochinita", slug: "sope_cochinita", description: "Con crema y cebolla curtida.", price: 42 },
          { name: "Tostada de tinga", slug: "tostada_tinga", description: "Servida con lechuga y queso.", price: 38 },
          { name: "Empanada de queso", slug: "empanada_queso", description: "Frita al momento.", price: 35 },
          { name: "Quesadilla de flor", slug: "quesadilla_flor", description: "Flor de calabaza y queso Oaxaca.", price: 46 },
        ],
      },
      {
        name: "Bebidas",
        slug: "bebidas",
        products: [
          { name: "Agua de jamaica", slug: "agua_jamaica", description: "500 ml.", price: 28 },
          { name: "Agua de horchata", slug: "agua_horchata", description: "500 ml.", price: 28 },
          { name: "Refresco de lata", slug: "refresco_lata", description: "355 ml.", price: 24 },
          { name: "Café de olla", slug: "cafe_olla", description: "Taza grande.", price: 32 },
        ],
      },
    ],
  });

  const proTenant = await ensureTenant({
    slug: "taqueria_don_jose",
    businessName: "Taquería Don Jose",
    whatsapp: "529842222222",
    version: Version.PRO,
    isDemo: true,
    publicTemplate: PublicTemplate.MERCADO,
    contractEndDaysFromNow: 15,
    welcomeMessage: "Taquitos premium al momento con extras y combinaciones especiales.",
    facebookUrl: "https://facebook.com/taqueriadonjose.demo",
    instagramUrl: "https://instagram.com/taqueriadonjose.demo",
    websiteUrl: "https://taqueriadonjose.demo",
    categories: [
      {
        name: "Tacos",
        slug: "tacos",
        products: [
          { name: "Taco al pastor", slug: "taco_pastor", description: "Con piña, cebolla y cilantro.", price: 24, imageUrl: "https://picsum.photos/seed/taco_pastor/200/200" },
          { name: "Taco de suadero", slug: "taco_suadero", description: "A fuego lento estilo CDMX.", price: 27, imageUrl: "https://picsum.photos/seed/taco_suadero/200/200" },
          { name: "Taco de bistec", slug: "taco_bistec", description: "Con guacamole casero.", price: 28, imageUrl: "https://picsum.photos/seed/taco_bistec/200/200" },
          { name: "Taco de campechano", slug: "taco_campechano", description: "Bistec y chorizo.", price: 29, imageUrl: "https://picsum.photos/seed/taco_campechano/200/200" },
          { name: "Taco de arrachera", slug: "taco_arrachera", description: "Con queso gratinado.", price: 36, imageUrl: "https://picsum.photos/seed/taco_arrachera/200/200" },
          { name: "Taco de costilla", slug: "taco_costilla", description: "Marinado con adobo especial.", price: 34, imageUrl: "https://picsum.photos/seed/taco_costilla/200/200" },
          { name: "Taco vegano", slug: "taco_vegano", description: "Setas al pastor y piña asada.", price: 30, imageUrl: "https://picsum.photos/seed/taco_vegano/200/200" },
          { name: "Taco de chicharron", slug: "taco_chicharron", description: "En salsa verde.", price: 26, imageUrl: "https://picsum.photos/seed/taco_chicharron/200/200" },
        ],
      },
      {
        name: "Quesadillas y gringas",
        slug: "quesadillas_gringas",
        products: [
          { name: "Quesadilla campechana", slug: "quesadilla_campechana", description: "Queso, bistec y pastor.", price: 68, imageUrl: "https://picsum.photos/seed/quesadilla_campechana/200/200" },
          { name: "Quesadilla de arrachera", slug: "quesadilla_arrachera", description: "Con queso manchego.", price: 76, imageUrl: "https://picsum.photos/seed/quesadilla_arrachera/200/200" },
          { name: "Gringa tradicional", slug: "gringa_tradicional", description: "Pastor y queso Oaxaca.", price: 74, imageUrl: "https://picsum.photos/seed/gringa_tradicional/200/200" },
          { name: "Gringa especial", slug: "gringa_especial", description: "Pastor, piña y doble queso.", price: 82, imageUrl: "https://picsum.photos/seed/gringa_especial/200/200" },
        ],
      },
      {
        name: "Complementos",
        slug: "complementos",
        products: [
          { name: "Frijoles charros", slug: "frijoles_charros", description: "Porción individual.", price: 35, imageUrl: "https://picsum.photos/seed/frijoles_charros/200/200" },
          { name: "Papas a la francesa", slug: "papas_francesa", description: "Con sazón de la casa.", price: 49, imageUrl: "https://picsum.photos/seed/papas_francesa/200/200" },
          { name: "Volcan de pastor", slug: "volcan_pastor", description: "Tortilla dorada con queso.", price: 41, imageUrl: "https://picsum.photos/seed/volcan_pastor/200/200" },
          { name: "Naranjada mineral", slug: "naranjada_mineral", description: "Vaso 600 ml.", price: 34, imageUrl: "https://picsum.photos/seed/naranjada_mineral/200/200" },
        ],
      },
    ],
  });

  const enterpriseTenant = await ensureTenant({
    slug: "grupo_nopal",
    businessName: "Grupo Nopal Gourmet",
    whatsapp: "529843333333",
    version: Version.ENTERPRISE,
    isDemo: true,
    publicTemplate: PublicTemplate.ELEGANTE,
    contractMonths: 2,
    welcomeMessage: "Experiencia premium para eventos, oficinas y pedidos de alto volumen.",
    facebookUrl: "https://facebook.com/gruponopal.demo",
    instagramUrl: "https://instagram.com/gruponopal.demo",
    websiteUrl: "https://gruponopal.demo",
    categories: [
      {
        name: "Entradas",
        slug: "entradas",
        products: [
          { name: "Guacamole tatemado", slug: "guacamole_tatemado", description: "Con totopos horneados.", price: 120, imageUrl: "https://picsum.photos/seed/guacamole_tatemado/200/200" },
          { name: "Esquites premium", slug: "esquites_premium", description: "Con mayo de chipotle.", price: 65, imageUrl: "https://picsum.photos/seed/esquites_premium/200/200" },
          { name: "Tostadas de atún", slug: "tostadas_atún", description: "2 piezas con ajonjoli.", price: 130, imageUrl: "https://picsum.photos/seed/tostadas_atún/200/200" },
          { name: "Queso fundido mixto", slug: "queso_fundido_mixto", description: "Con chorizo y champinon.", price: 145, imageUrl: "https://picsum.photos/seed/queso_fundido_mixto/200/200" },
        ],
      },
      {
        name: "Platos fuertes",
        slug: "platos_fuertes",
        products: [
          { name: "Arrachera al carbon", slug: "arrachera_carbon", description: "350 g con papas gajo.", price: 295, imageUrl: "https://picsum.photos/seed/arrachera_carbon/200/200" },
          { name: "Salmón al mezcal", slug: "salmon_mezcal", description: "Con puré de coliflor.", price: 320, imageUrl: "https://picsum.photos/seed/salmon_mezcal/200/200" },
          { name: "Rib eye norteño", slug: "ribeye_norteno", description: "Con mantequilla de ajo.", price: 390, imageUrl: "https://picsum.photos/seed/ribeye_norteno/200/200" },
          { name: "Mole de la casa", slug: "mole_casa", description: "Pechuga de pollo y arroz.", price: 210, imageUrl: "https://picsum.photos/seed/mole_casa/200/200" },
          { name: "Enchiladas suizas", slug: "enchiladas_suizas", description: "Gratinadas al horno.", price: 185, imageUrl: "https://picsum.photos/seed/enchiladas_suizas/200/200" },
          { name: "Chamorro glaseado", slug: "chamorro_glaseado", description: "Cocción lenta 8 horas.", price: 265, imageUrl: "https://picsum.photos/seed/chamorro_glaseado/200/200" },
          { name: "Lasaña poblana", slug: "lasana_poblana", description: "Con rajas y elote.", price: 190, imageUrl: "https://picsum.photos/seed/lasana_poblana/200/200" },
        ],
      },
      {
        name: "Postres y bebidas",
        slug: "postres_bebidas",
        products: [
          { name: "Flan de cajeta", slug: "flan_cajeta", description: "Porción individual.", price: 75, imageUrl: "https://picsum.photos/seed/flan_cajeta/200/200" },
          { name: "Pastel de elote", slug: "pastel_elote", description: "Con helado de vainilla.", price: 82, imageUrl: "https://picsum.photos/seed/pastel_elote/200/200" },
          { name: "Café de altura", slug: "cafe_altura", description: "Tostado medio.", price: 48, imageUrl: "https://picsum.photos/seed/cafe_altura/200/200" },
          { name: "Limonada pepino", slug: "limónada_pepino", description: "Natural 700 ml.", price: 52, imageUrl: "https://picsum.photos/seed/limónada_pepino/200/200" },
          { name: "Naranjada de temporada", slug: "naranjada_temporada", description: "700 ml.", price: 52, imageUrl: "https://picsum.photos/seed/naranjada_temporada/200/200" },
        ],
      },
    ],
  });

  const seafoodTenant = await ensureTenant({
    slug: "mariscos_el_faro",
    businessName: "Mariscos El Faro",
    whatsapp: "529844444444",
    version: Version.PRO,
    isDemo: true,
    publicTemplate: PublicTemplate.MARISQUERIA,
    contractEndDaysFromNow: 12,
    welcomeMessage: "Ceviches, tostadas y cocteles frescos para disfrutar en familia.",
    facebookUrl: "https://facebook.com/mariscoselfaro.demo",
    instagramUrl: "https://instagram.com/mariscoselfaro.demo",
    categories: [
      {
        name: "Tostadas",
        slug: "tostadas",
        products: [
          { name: "Tostada de ceviche", slug: "tostada_ceviche", description: "Pescado fresco, pepino y salsa de la casa.", price: 58, imageUrl: "https://picsum.photos/seed/tostada_ceviche/200/200" },
          { name: "Tostada de atún", slug: "tostada_atún", description: "Atún sellado con ajonjoli.", price: 82, imageUrl: "https://picsum.photos/seed/tostada_atún_faro/200/200" },
          { name: "Tostada campechana", slug: "tostada_campechana", description: "Pulpo, camarón y pescado.", price: 96, imageUrl: "https://picsum.photos/seed/tostada_campechana_faro/200/200" },
          { name: "Tostada de aguachile", slug: "tostada_aguachile", description: "Verde, rojo o negro.", price: 88, imageUrl: "https://picsum.photos/seed/tostada_aguachile/200/200" },
        ],
      },
      {
        name: "Cocteles",
        slug: "cocteles",
        products: [
          { name: "Coctel de camarón", slug: "coctel_camarón", description: "Chico, mediano o grande.", price: 135, imageUrl: "https://picsum.photos/seed/coctel_camarón/200/200" },
          { name: "Vuelve a la vida", slug: "vuelve_vida", description: "Mariscos mixtos en salsa especial.", price: 165, imageUrl: "https://picsum.photos/seed/vuelve_vida/200/200" },
          { name: "Aguachile verde", slug: "aguachile_verde", description: "Camarón, pepino, cebolla morada y limón.", price: 170, imageUrl: "https://picsum.photos/seed/aguachile_verde/200/200" },
          { name: "Ceviche familiar", slug: "ceviche_familiar", description: "Ideal para compartir.", price: 260, imageUrl: "https://picsum.photos/seed/ceviche_familiar/200/200" },
        ],
      },
      {
        name: "Bebidas",
        slug: "bebidas_mar",
        products: [
          { name: "Limonada mineral", slug: "limónada_mineral", description: "Vaso grande.", price: 45, imageUrl: "https://picsum.photos/seed/limónada_mineral/200/200" },
          { name: "Agua de mango", slug: "agua_mango", description: "Natural de temporada.", price: 38, imageUrl: "https://picsum.photos/seed/agua_mango/200/200" },
          { name: "Clamato preparado", slug: "clamato_preparado", description: "Con escarchado y salsas.", price: 65, imageUrl: "https://picsum.photos/seed/clamato_preparado/200/200" },
          { name: "Refresco botella", slug: "refresco_botella", description: "600 ml.", price: 32, imageUrl: "https://picsum.photos/seed/refresco_botella/200/200" },
        ],
      },
    ],
  });

  const cafeTenant = await ensureTenant({
    slug: "cafe_amanecer",
    businessName: "Café Amanecer",
    whatsapp: "529845555555",
    version: Version.PRO,
    isDemo: true,
    publicTemplate: PublicTemplate.CAFETERIA,
    contractEndDaysFromNow: 9,
    welcomeMessage: "Café, pan dulce y desayunos para empezar bien el dia.",
    instagramUrl: "https://instagram.com/cafeamanecer.demo",
    categories: [
      {
        name: "Café",
        slug: "cafe",
        products: [
          { name: "Americano", slug: "americano", description: "Café de altura tostado medio.", price: 42, imageUrl: "https://picsum.photos/seed/americano/200/200" },
          { name: "Latte vainilla", slug: "latte_vainilla", description: "Espresso con leche y vainilla.", price: 68, imageUrl: "https://picsum.photos/seed/latte_vainilla/200/200" },
          { name: "Capuchino", slug: "capuchino", description: "Clásico con espuma cremosa.", price: 62, imageUrl: "https://picsum.photos/seed/capuchino/200/200" },
          { name: "Cold brew", slug: "cold_brew", description: "Extracción fria 18 horas.", price: 74, imageUrl: "https://picsum.photos/seed/cold_brew/200/200" },
        ],
      },
      {
        name: "Desayunos",
        slug: "desayunos",
        products: [
          { name: "Chilaquiles con huevo", slug: "chilaquiles_huevo", description: "Verdes o rojos.", price: 125, imageUrl: "https://picsum.photos/seed/chilaquiles_huevo/200/200" },
          { name: "Molletes gratinados", slug: "molletes_gratinados", description: "Con pico de gallo.", price: 95, imageUrl: "https://picsum.photos/seed/molletes_gratinados/200/200" },
          { name: "Croissant de jamon", slug: "croissant_jamon", description: "Con queso manchego.", price: 110, imageUrl: "https://picsum.photos/seed/croissant_jamon/200/200" },
          { name: "Hot cakes frutos rojos", slug: "hotcakes_frutos", description: "Con miel y mantequilla.", price: 118, imageUrl: "https://picsum.photos/seed/hotcakes_frutos/200/200" },
        ],
      },
      {
        name: "Panaderia",
        slug: "panaderia",
        products: [
          { name: "Concha vainilla", slug: "concha_vainilla", description: "Horneada cada mañana.", price: 28, imageUrl: "https://picsum.photos/seed/concha_vainilla/200/200" },
          { name: "Rol de canela", slug: "rol_canela", description: "Con glaseado ligero.", price: 46, imageUrl: "https://picsum.photos/seed/rol_canela/200/200" },
          { name: "Pan de elote", slug: "pan_elote", description: "Rebanada individual.", price: 52, imageUrl: "https://picsum.photos/seed/pan_elote/200/200" },
          { name: "Galleta chispas", slug: "galleta_chispas", description: "Suave por dentro.", price: 35, imageUrl: "https://picsum.photos/seed/galleta_chispas/200/200" },
        ],
      },
    ],
  });

  const pizzaTenant = await ensureTenant({
    slug: "pizza_barrio",
    businessName: "Pizza del Barrio",
    whatsapp: "529846666666",
    version: Version.PRO,
    isDemo: true,
    publicTemplate: PublicTemplate.PIZZERIA,
    contractEndDaysFromNow: 18,
    welcomeMessage: "Pizzas artesanales, pastas y combos para compartir.",
    facebookUrl: "https://facebook.com/pizzabarrio.demo",
    categories: [
      {
        name: "Pizzas",
        slug: "pizzas",
        products: [
          { name: "Pizza pepperoni", slug: "pizza_pepperoni", description: "Queso mozzarella y pepperoni.", price: 169, imageUrl: "https://picsum.photos/seed/pizza_pepperoni/200/200" },
          { name: "Pizza mexicana", slug: "pizza_mexicana", description: "Chorizo, jalapeño, cebolla y frijol.", price: 185, imageUrl: "https://picsum.photos/seed/pizza_mexicana/200/200" },
          { name: "Pizza hawaiana", slug: "pizza_hawaiana", description: "Jamón, piña y extra queso.", price: 175, imageUrl: "https://picsum.photos/seed/pizza_hawaiana/200/200" },
          { name: "Pizza vegetariana", slug: "pizza_vegetariana", description: "Champiñón, pimiento, aceituna y cebolla.", price: 179, imageUrl: "https://picsum.photos/seed/pizza_vegetariana/200/200" },
        ],
      },
      {
        name: "Pastas",
        slug: "pastas",
        products: [
          { name: "Spaghetti bolognesa", slug: "spaghetti_bolognesa", description: "Salsa de carne de la casa.", price: 135, imageUrl: "https://picsum.photos/seed/spaghetti_bolognesa/200/200" },
          { name: "Fettuccine Alfredo", slug: "fettuccine_alfredo", description: "Cremoso con parmesano.", price: 145, imageUrl: "https://picsum.photos/seed/fettuccine_alfredo/200/200" },
          { name: "Lasana de carne", slug: "lasana_carne", description: "Porción individual.", price: 155, imageUrl: "https://picsum.photos/seed/lasana_carne/200/200" },
          { name: "Penne arrabbiata", slug: "penne_arrabbiata", description: "Salsa roja picante.", price: 128, imageUrl: "https://picsum.photos/seed/penne_arrabbiata/200/200" },
        ],
      },
      {
        name: "Combos",
        slug: "combos",
        products: [
          { name: "Combo pareja", slug: "combo_pareja", description: "Pizza mediana, pasta y bebida.", price: 299, imageUrl: "https://picsum.photos/seed/combo_pareja/200/200" },
          { name: "Combo familiar", slug: "combo_familiar", description: "Pizza grande, papas y refresco.", price: 399, imageUrl: "https://picsum.photos/seed/combo_familiar/200/200" },
          { name: "Papas gajo", slug: "papas_gajo", description: "Con dip ranch.", price: 69, imageUrl: "https://picsum.photos/seed/papas_gajo/200/200" },
          { name: "Refresco 2L", slug: "refresco_2l", description: "Sabores surtidos.", price: 55, imageUrl: "https://picsum.photos/seed/refresco_2l/200/200" },
        ],
      },
    ],
  });

  await setProductEnhancements({
    tenantId: proTenant.id,
    productSlug: "taco_pastor",
    ingredients: ["carne al pastor", "cebolla", "cilantro", "piña"],
    groups: [
      {
        name: "Tamaño",
        isRequired: true,
        allowMultiple: false,
        minSelection: 1,
        maxSelection: 1,
        modifiers: [
          { name: "Normal", price: 0 },
          { name: "Doble tortilla", price: 6 },
          { name: "Gringa", price: 18 },
        ],
      },
      {
        name: "Extras",
        allowMultiple: true,
        minSelection: 0,
        maxSelection: 3,
        modifiers: [
          { name: "Queso extra", price: 12 },
          { name: "PiÒ±a extra", price: 5 },
          { name: "Salsa especial", price: 4 },
        ],
      },
    ],
  });

  const proEnhancements = [
    "taco_suadero",
    "taco_bistec",
    "taco_campechano",
    "taco_arrachera",
    "gringa_tradicional",
    "gringa_especial",
    "quesadilla_campechana",
    "quesadilla_arrachera",
    "volcan_pastor",
    "frijoles_charros",
  ];

  for (const slug of proEnhancements) {
    await setProductEnhancements({
      tenantId: proTenant.id,
      productSlug: slug,
      ingredients: ["cebolla", "cilantro", "salsa de la casa"],
      groups: [
        {
          name: "Nivel de picante",
          isRequired: true,
          allowMultiple: false,
          minSelection: 1,
          maxSelection: 1,
          modifiers: [
            { name: "Suave", price: 0 },
            { name: "Medio", price: 0 },
            { name: "Bravo", price: 0 },
          ],
        },
        {
          name: "Extras",
          allowMultiple: true,
          minSelection: 0,
          maxSelection: 3,
          modifiers: [
            { name: "Queso extra", price: 12 },
            { name: "Guacamole", price: 15 },
            { name: "Tortilla extra", price: 5 },
          ],
        },
      ],
    });
  }

  await setProductEnhancements({
    tenantId: enterpriseTenant.id,
    productSlug: "arrachera_carbon",
    ingredients: ["arrachera", "chimichurri", "papa gajo", "ensalada"],
    groups: [
      {
        name: "Punto de cocción",
        isRequired: true,
        allowMultiple: false,
        minSelection: 1,
        maxSelection: 1,
        modifiers: [
          { name: "3/4", price: 0 },
          { name: "Bien cocido", price: 0 },
          { name: "Termino medio", price: 0 },
        ],
      },
      {
        name: "Acompañamientos",
        allowMultiple: true,
        minSelection: 0,
        maxSelection: 2,
        modifiers: [
          { name: "Espárragos", price: 25 },
          { name: "Puré trufado", price: 30 },
          { name: "Queso fundido", price: 20 },
        ],
      },
    ],
  });

  const enterpriseEnhancements = [
    "salmon_mezcal",
    "ribeye_norteno",
    "mole_casa",
    "enchiladas_suizas",
    "chamorro_glaseado",
    "lasana_poblana",
    "guacamole_tatemado",
    "tostadas_atún",
    "queso_fundido_mixto",
    "pastel_elote",
    "flan_cajeta",
  ];

  for (const slug of enterpriseEnhancements) {
    await setProductEnhancements({
      tenantId: enterpriseTenant.id,
      productSlug: slug,
      ingredients: ["ingredientes premium", "toque de la casa", "guarnición especial"],
      groups: [
        {
          name: "Presentación",
          isRequired: true,
          allowMultiple: false,
          minSelection: 1,
          maxSelection: 1,
          modifiers: [
            { name: "Estándar", price: 0 },
            { name: "Executive", price: 35 },
          ],
        },
        {
          name: "Complementos",
          allowMultiple: true,
          minSelection: 0,
          maxSelection: 2,
          modifiers: [
            { name: "Ensalada gourmet", price: 25 },
            { name: "Papas trufadas", price: 35 },
            { name: "Bebida artesanal", price: 45 },
          ],
        },
      ],
    });
  }

  await ensureUser({
    email: `demo.lite@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Lite",
    role: UserRole.ADMIN,
    tenantId: liteTenant.id,
  });

  await ensureUser({
    email: `demo.pro@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Pro",
    role: UserRole.ADMIN,
    tenantId: proTenant.id,
  });

  await ensureUser({
    email: `demo.enterprise@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Enterprise",
    role: UserRole.ADMIN,
    tenantId: enterpriseTenant.id,
  });

  await ensureUser({
    email: `demo.mariscos@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Mariscos",
    role: UserRole.ADMIN,
    tenantId: seafoodTenant.id,
  });

  await ensureUser({
    email: `demo.cafe@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Café",
    role: UserRole.ADMIN,
    tenantId: cafeTenant.id,
  });

  await ensureUser({
    email: `demo.pizza@${demoEmailDomain}`,
    password: demoPassword,
    name: "Demo Pizza",
    role: UserRole.ADMIN,
    tenantId: pizzaTenant.id,
  });

  await ensureOperationalDemoData({
    tenantId: liteTenant.id,
    slug: "fonda_lupita",
    version: Version.LITE,
    demoEmailDomain,
    demoPassword,
  });
  await ensureOperationalDemoData({
    tenantId: proTenant.id,
    slug: "taqueria_don_jose",
    version: Version.PRO,
    demoEmailDomain,
    demoPassword,
  });
  await ensureOperationalDemoData({
    tenantId: enterpriseTenant.id,
    slug: "grupo_nopal",
    version: Version.ENTERPRISE,
    demoEmailDomain,
    demoPassword,
  });
  await ensureOperationalDemoData({
    tenantId: seafoodTenant.id,
    slug: "mariscos_el_faro",
    version: Version.PRO,
    demoEmailDomain,
    demoPassword,
  });
  await ensureOperationalDemoData({
    tenantId: cafeTenant.id,
    slug: "cafe_amanecer",
    version: Version.PRO,
    demoEmailDomain,
    demoPassword,
  });
  await ensureOperationalDemoData({
    tenantId: pizzaTenant.id,
    slug: "pizza_barrio",
    version: Version.PRO,
    demoEmailDomain,
    demoPassword,
  });

  await resetDemoTenantData(prisma, "fonda_lupita");
  await resetDemoTenantData(prisma, "taqueria_don_jose");
  await resetDemoTenantData(prisma, "grupo_nopal");
  await resetDemoTenantData(prisma, "mariscos_el_faro");
  await resetDemoTenantData(prisma, "cafe_amanecer");
  await resetDemoTenantData(prisma, "pizza_barrio");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

