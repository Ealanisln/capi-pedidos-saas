import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function normalizeHost(value: string | null) {
  if (!value) return "";
  return value.split(":")[0].toLowerCase();
}

export async function resolveTenantByHost() {
  const h = await headers();
  const host = normalizeHost(h.get("host"));
  if (!host) return null;

  const rootDomain = (process.env.ROOT_DOMAIN ?? "nohmendez.xyz").trim().toLowerCase();

  if (host === rootDomain || host.startsWith("localhost")) {
    const slug = process.env.DEFAULT_TENANT_SLUG ?? "capi";
    return prisma.tenant.findUnique({ where: { slug } });
  }

  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.replace(`.${rootDomain}`, "");
    return prisma.tenant.findFirst({ where: { subdomain } });
  }

  return prisma.tenant.findFirst({ where: { customDomain: host } });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
