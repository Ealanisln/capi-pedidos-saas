# SECURITY

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad, evita publicar detalles explotables en issues publicos.

Para una instalacion propia, configura un correo de seguridad en `public/.well-known/security.txt` y en este archivo.

## Alcance sensible

- Autenticacion y sesiones.
- Acceso por roles: `SUPER_ADMIN`, `ADMIN`, `STAFF`.
- Aislamiento multi-tenant por `tenantId`.
- Endpoints publicos de pedidos.
- Cron de reinicio de demos.
- Variables de entorno y conexion a base de datos.

## Reglas de seguridad para colaboradores

- No subir `.env`.
- No pegar cadenas reales de conexion.
- No subir passwords reales ni tokens.
- No usar datos reales de restaurantes/clientes en seeds.
- No exponer credenciales demo productivas en README, issues o PRs.

## Variables sensibles

Estas variables deben vivir solamente en `.env` local o en el panel del proveedor de hosting:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `SEED_ADMIN_PASSWORD`
- `SEED_DEMO_PASSWORD`

## Recomendaciones para produccion

- Usar secretos fuertes y unicos por ambiente.
- Rotar credenciales compartidas accidentalmente.
- Configurar rate limiting en login y pedidos.
- Activar logs y auditoria para acciones administrativas.
- Revisar permisos del proveedor de base de datos.
- Usar backups automaticos.
