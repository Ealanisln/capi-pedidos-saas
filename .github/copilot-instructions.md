# GitHub Copilot instructions

Capi Pedidos SaaS es una app Next.js 16 App Router para menús digitales, pedidos por WhatsApp y administración multi-tenant de restaurantes.

## Reglas del proyecto

- Escribe UI y documentación en español México.
- No agregues credenciales reales, tokens ni conexiones privadas.
- No modifiques `.env`.
- Respeta `tenantId` en consultas multi-tenant.
- No prometas funciones no implementadas por plan.
- Si agregas variables, actualiza `.env.example` y documentación.
- Si cambias comportamiento, actualiza README o docs.

## Validación

Antes de cerrar cambios importantes:

```bash
npm run lint
npm run build
```

## Archivos clave

- `src/app/page.tsx`: landing.
- `src/components/public/menu-client.tsx`: menú público.
- `src/app/(admin)/admin/(protected)/*`: panel admin.
- `src/lib/auth.ts`: autenticación.
- `src/lib/tenant.ts`: multi-tenant.
- `prisma/schema.prisma`: modelo.
- `prisma/seed.ts`: datos demo.
