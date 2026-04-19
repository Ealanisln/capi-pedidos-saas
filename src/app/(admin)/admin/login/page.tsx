import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string }>;
};

const demoEmails: Record<string, string> = {
  lite: `demo.lite@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
  pro: `demo.pro@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
  enterprise: `demo.enterprise@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
  mariscos: `demo.mariscos@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
  cafe: `demo.cafe@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
  pizza: `demo.pizza@${process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ?? "example.com"}`,
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const demoKey = (params.demo ?? "").toLowerCase();
  const presetEmail = demoEmails[demoKey];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Acceso administrador</h1>
        <p className="mt-1 text-sm text-slate-600">
          Inicia sesión para gestionar menú, productos y pedidos.
        </p>
        {presetEmail ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Demo seleccionada. Por seguridad, la contraseña no se publica ni se autocompleta.
            Si eres prospecto, solicítala al administrador del proyecto.
          </div>
        ) : null}
        <div className="mt-6">
          <LoginForm initialEmail={presetEmail} />
        </div>
      </div>
    </div>
  );
}
