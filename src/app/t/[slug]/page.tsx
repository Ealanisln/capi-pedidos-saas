import { redirect } from "next/navigation";

type LegacyTenantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LegacyTenantPage({ params }: LegacyTenantPageProps) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
