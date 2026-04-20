import { notFound } from "next/navigation";
import Link from "next/link";
import { MenuClient } from "@/components/public/menu-client";
import { prisma } from "@/lib/prisma";
import { getPublicTheme } from "@/lib/public-themes";

type TenantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const reservedSlugs = new Set(["admin", "api", "_next", "favicon.ico"]);

export default async function TenantByPathPage({ params }: TenantPageProps) {
  const { slug } = await params;
  const tenantSlug = slug.trim().toLowerCase();

  if (!tenantSlug || reservedSlugs.has(tenantSlug)) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
      products: {
        where: { isAvailable: true },
        include: {
          category: true,
          ingredients: { orderBy: { position: "asc" } },
          modifierGroups: {
            orderBy: { position: "asc" },
            include: {
              modifiers: { where: { isActive: true }, orderBy: { position: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      settings: true,
    },
  });

  if (!tenant || !tenant.isActive) {
    notFound();
  }
  const theme = getPublicTheme(tenant.settings?.publicTemplate);

  return (
    <div className={`min-h-screen px-3 py-4 sm:px-4 sm:py-8 ${theme.page}`}>
      <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
        <header className={`rounded-2xl p-4 shadow-sm sm:p-6 ${theme.header}`}>
          <p className={`break-words text-[0.68rem] uppercase tracking-[0.12em] sm:text-xs sm:tracking-wide ${theme.eyebrow}`}>
            Menú digital de {tenant.businessName}
          </p>
          <h1 className={`break-words text-2xl font-bold sm:text-3xl ${theme.title}`}>
            {tenant.businessName}
          </h1>
          {tenant.settings?.welcomeMessage ? (
            <p className={`mt-2 break-words text-sm leading-6 sm:text-base ${theme.body}`}>
              {tenant.settings.welcomeMessage}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {tenant.settings?.facebookUrl ? (
              <Link
                href={tenant.settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border px-3 py-2 text-center text-sm ${theme.socialLink}`}
              >
                Facebook
              </Link>
            ) : null}
            {tenant.settings?.instagramUrl ? (
              <Link
                href={tenant.settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border px-3 py-2 text-center text-sm ${theme.socialLink}`}
              >
                Instagram
              </Link>
            ) : null}
            {tenant.settings?.tiktokUrl ? (
              <Link
                href={tenant.settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border px-3 py-2 text-center text-sm ${theme.socialLink}`}
              >
                TikTok
              </Link>
            ) : null}
            {tenant.settings?.websiteUrl ? (
              <Link
                href={tenant.settings.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border px-3 py-2 text-center text-sm ${theme.socialLink}`}
              >
                Sitio web
              </Link>
            ) : null}
          </div>
        </header>

        <MenuClient
          tenantSlug={tenant.slug}
          whatsapp={tenant.whatsapp}
          version={tenant.version}
          publicTemplate={tenant.settings?.publicTemplate ?? "CLASICO"}
          categories={tenant.categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          products={tenant.products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            categoryName: product.category.name,
            imageUrl: product.imageUrl,
            ingredients: product.ingredients.map((ingredient) => ingredient.name),
            modifierGroups: product.modifierGroups.map((group) => ({
              id: group.id,
              name: group.name,
              isRequired: group.isRequired,
              allowMultiple: group.allowMultiple,
              minSelection: group.minSelection,
              maxSelection: group.maxSelection,
              modifiers: group.modifiers.map((modifier) => ({
                id: modifier.id,
                name: modifier.name,
                price: Number(modifier.price),
              })),
            })),
          }))}
        />
      </div>
    </div>
  );
}
