import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string }>;
};

const demoEmailDomain =
  process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ??
  process.env.SEED_DEMO_EMAIL_DOMAIN ??
  process.env.ROOT_DOMAIN ??
  "example.com";

const demos: Record<string, { email: string; label: string }> = {
  lite: { email: `demo.lite@${demoEmailDomain}`, label: "Lite" },
  pro: { email: `demo.pro@${demoEmailDomain}`, label: "Pro" },
  enterprise: { email: `demo.enterprise@${demoEmailDomain}`, label: "Enterprise" },
  mariscos: { email: `demo.mariscos@${demoEmailDomain}`, label: "Marisquería" },
  cafe: { email: `demo.cafe@${demoEmailDomain}`, label: "Cafetería" },
  pizza: { email: `demo.pizza@${demoEmailDomain}`, label: "Pizzería" },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const demoKey = (params.demo ?? "").toLowerCase();
  const demo = demos[demoKey];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Acceso administrador</h1>
        <p className="mt-1 text-sm text-slate-600">
          Inicia sesión para gestionar menú, productos y pedidos.
        </p>
        {demo ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Demo {demo.label} seleccionada. Te abriremos el panel automáticamente para que puedas probarlo sin contraseña.
          </div>
        ) : null}
        <div className="mt-6">
          <LoginForm initialEmail={demo?.email} demoKey={demoKey || undefined} demoLabel={demo?.label} />
        </div>
      </div>
    </div>
  );
}
