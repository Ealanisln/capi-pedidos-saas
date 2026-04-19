# Instrucciones para agentes de IA

Este proyecto es una aplicacion Next.js 16 con App Router. Antes de modificar codigo:

- Revisa `README.md` y `docs/DOCUMENTACION_TECNICA.md`.
- Mantén la UI en espanol Mexico.
- No agregues credenciales reales al codigo.
- No subas `.env`.
- Respeta el aislamiento multi-tenant usando `tenantId`.
- Ejecuta `npm run lint` y `npm run build` antes de proponer cambios grandes.

## Areas sensibles

- `src/lib/auth.ts`: autenticacion y sesion.
- `src/lib/tenant.ts`: resolucion multi-tenant.
- `src/app/api/orders/route.ts`: endpoint publico de pedidos.
- `src/app/api/cron/reset-demos/route.ts`: cron protegido por secreto.
- `prisma/schema.prisma`: modelo de datos.
- `prisma/seed.ts`: datos demo, nunca datos reales.
