"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  initialEmail?: string;
  demoKey?: string;
  demoLabel?: string;
};

export function LoginForm({ initialEmail = "", demoKey, demoLabel }: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoDemoLoading, setAutoDemoLoading] = useState(Boolean(demoKey));
  const [attemptedDemoLogin, setAttemptedDemoLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demoKey || attemptedDemoLogin) return;

    async function loginDemo() {
      setAttemptedDemoLogin(true);
      setAutoDemoLoading(true);
      setError(null);

      const result = await signIn("demo", {
        demo: demoKey,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("No se pudo abrir el panel demo. Intenta con el acceso manual.");
        setAutoDemoLoading(false);
        return;
      }

      window.location.href = "/admin";
    }

    void loginDemo();
  }, [attemptedDemoLogin, demoKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    if (result?.error) {
      setError("Credenciales inválidas.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  if (autoDemoLoading) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
        <p className="mt-4 text-sm font-black text-emerald-950">
          Abriendo panel demo{demoLabel ? ` ${demoLabel}` : ""}...
        </p>
        <p className="mt-1 text-xs font-semibold text-emerald-800">
          No necesitas contraseña para esta demostración.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Correo</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Contraseña</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
      >
        {loading ? "Entrando..." : "Entrar al panel"}
      </button>
    </form>
  );
}
