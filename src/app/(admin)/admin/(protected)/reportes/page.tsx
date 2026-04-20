import { ExportScope } from "@prisma/client";
import { requireAuthSession } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createExportCredentialAction, revokeExportCredentialAction } from "../../actions";

type PageProps = {
  searchParams: Promise<{ nuevoToken?: string }>;
};

function formatDate(date: Date | null) {
  return date ? date.toLocaleString("es-MX") : "Sin fecha";
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const session = await requireAuthSession();
  const { nuevoToken } = await searchParams;
  const [tenant, credentials, auditLogs] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, businessName: true },
    }),
    prisma.exportCredential.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.exportAuditLog.findMany({
      where: { tenantId: session.user.tenantId },
      include: { credential: { select: { name: true, tokenPrefix: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://capi.nohmendez.xyz";
  const sampleToken = nuevoToken ?? "TU_TOKEN_PRIVADO";
  const sampleCsv = tenant
    ? `${baseUrl}/api/reportes/${tenant.slug}/ventas?token=${sampleToken}&formato=csv&desde=2026-03-01&hasta=2026-04-19`
    : "";
  const sampleJson = tenant
    ? `${baseUrl}/api/reportes/${tenant.slug}/ventas?token=${sampleToken}&formato=json&desde=2026-03-01&hasta=2026-04-19`
    : "";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
        <div className="bg-[radial-gradient(circle_at_top_right,#38bdf8,transparent_28%),linear-gradient(135deg,#020617,#0f172a)] p-7">
          <p className="text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.24em] text-sky-300">Excel, PowerBI y analisis</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Reportes conectables</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Genera tokens por restaurante para que el negocio conecte sus ventas a Excel, PowerBI o herramientas de analisis sin compartir su usuario y contrasena.
          </p>
        </div>
      </section>

      {nuevoToken ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-xl shadow-emerald-900/5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Token creado</p>
          <h3 className="mt-2 text-2xl font-black text-emerald-950">Copia este token ahora</h3>
          <p className="mt-2 text-sm font-semibold text-emerald-900">
            Por seguridad solo se muestra una vez. Si lo pierdes, revoca el acceso y crea uno nuevo.
          </p>
          <code className="mt-4 block overflow-x-auto rounded-2xl bg-white p-4 text-sm font-black text-slate-950">
            {nuevoToken}
          </code>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Crear acceso de reportes</h3>
          <p className="mt-2 text-sm text-slate-600">
            Crea un token para una computadora, archivo de Excel o tablero de PowerBI. Tratalo como una contrasena.
          </p>
          <form action={createExportCredentialAction} className="mt-5 grid gap-3">
            <input
              name="name"
              placeholder="Ej. Excel gerencia, PowerBI contador"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              Vence el dia
              <input name="expiresAt" type="date" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-normal" />
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Crear token de ventas
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
          <h3 className="text-xl font-black text-slate-950">Ejemplos de conexion</h3>
          <p className="mt-2 text-sm text-slate-600">
            Usa CSV para Excel y PowerBI. Usa JSON si una IA, sistema externo o script necesita leer los datos con estructura.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">CSV para Excel o PowerBI</p>
              <code className="mt-2 block overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{sampleCsv}</code>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">JSON para integraciones</p>
              <code className="mt-2 block overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{sampleJson}</code>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h3 className="text-xl font-black text-slate-950">Tokens activos y revocados</h3>
        <div className="mt-4 grid gap-3">
          {credentials.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Aun no hay tokens creados.</p>
          ) : (
            credentials.map((credential) => (
              <article key={credential.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-black text-slate-950">{credential.name}</p>
                  <p className="text-sm text-slate-600">
                    Prefijo: <strong>{credential.tokenPrefix}...</strong> - Scope: {credential.scope}
                  </p>
                  <p className="text-xs text-slate-500">
                    Creado: {formatDate(credential.createdAt)} - Ultimo uso: {formatDate(credential.lastUsedAt)} - Usos: {formatNumber(credential.usageCount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Vence: {formatDate(credential.expiresAt)} - Estado: {credential.revokedAt ? `Revocado ${formatDate(credential.revokedAt)}` : "Activo"}
                  </p>
                </div>
                {!credential.revokedAt ? (
                  <form action={revokeExportCredentialAction}>
                    <input type="hidden" name="credentialId" value={credential.id} />
                    <button className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-black text-rose-700">
                      Revocar
                    </button>
                  </form>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
        <h3 className="text-xl font-black text-slate-950">Historial de uso</h3>
        <div className="mt-4 space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-600">Sin consultas registradas.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm lg:grid-cols-4">
                <p className="font-black text-slate-950">{log.credential?.name ?? "Token eliminado"}</p>
                <p>{log.format.toUpperCase()} - {log.scope === ExportScope.VENTAS ? "Ventas" : log.scope}</p>
                <p>{formatNumber(log.rowCount)} registros</p>
                <p>{formatDate(log.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
