# Instrucciones para agentes de IA

Este proyecto es una aplicación Next.js 16 con App Router para un SaaS multi-tenant de menús digitales y pedidos por WhatsApp.

Antes de modificar código, lee:

- `README.md`
- `docs/DOCUMENTACION_TECNICA.md`
- `docs/MANUAL_DE_USO.md`
- `docs/AGENTES_IA.md`

## Reglas obligatorias

- Mantén la UI en español México.
- No agregues credenciales reales al código.
- No subas `.env`.
- Respeta el aislamiento multi-tenant usando `tenantId`.
- No prometas funciones que no existan realmente por plan.
- Si cambias comportamiento, actualiza documentación.
- Ejecuta `npm run lint` y `npm run build` antes de cerrar cambios grandes.

## Áreas sensibles

- `src/lib/auth.ts`: autenticación y sesión.
- `src/lib/tenant.ts`: resolución multi-tenant.
- `src/app/api/orders/route.ts`: endpoint público de pedidos.
- `src/app/api/cron/reset-demos/route.ts`: cron protegido por secreto.
- `prisma/schema.prisma`: modelo de datos.
- `prisma/seed.ts`: datos demo, nunca datos reales.

## Estilo de producto

- Público objetivo: restaurantes de México y Latinoamérica.
- Moneda: pesos mexicanos.
- Lenguaje: claro, comercial, sin tecnicismos innecesarios.
- UI: administrable, responsive y honesta respecto a cada plan.
