# Documentacion tecnica - Capi Pedidos SaaS

Fecha de actualizacion: abril 2026
Estado: base colaborativa publica, preparada para despliegues propios.

## 1. Objetivo

Capi Pedidos SaaS es una plataforma multi-tenant para restaurantes y negocios de comida. Permite publicar menus digitales, recibir pedidos por WhatsApp y administrar operacion diaria desde un panel web.

La aplicacion esta pensada para Mexico y Latinoamerica: textos en espanol, precios en MXN, negocios demo con comida mexicana y flujo operativo compatible con restaurantes pequenos o medianos.

## 2. Arquitectura

| Capa | Tecnologia | Responsabilidad |
|---|---|---|
| Web app | Next.js 16 App Router | Landing, menu publico, admin y API routes |
| UI | React 19 + Tailwind CSS 4 | Interfaz responsive |
| Autenticacion | NextAuth Credentials + JWT | Login y sesion admin |
| ORM | Prisma | Modelo de datos y consultas |
| Base de datos | PostgreSQL | Persistencia multi-tenant |
| Hosting sugerido | Vercel | Build, deploy, dominio, SSL y Cron |
| Datos demo | @faker-js/faker | Ventas, pedidos y cortes realistas |

## 3. Multi-tenant

Cada negocio vive como un `Tenant`.

- Vista publica: `/<slug>`.
- Panel admin: `/admin`.
- Aislamiento de datos: tablas operativas relacionan registros con `tenantId`.
- El super administrador puede crear negocios, cambiar planes, marcar demos y definir vigencia.

### Roles

| Rol | Uso |
|---|---|
| `SUPER_ADMIN` | Administra tenants, planes, vigencias y demos |
| `ADMIN` | Opera un negocio especifico |
| `STAFF` | Reservado para futuras funciones de personal |

## 4. Modelo de datos principal

| Modelo | Uso |
|---|---|
| `Tenant` | Negocio/cliente SaaS |
| `User` | Usuarios administrativos |
| `Category` | Categorias del menu |
| `Product` | Productos vendibles |
| `Ingredient` | Ingredientes visibles en menu publico |
| `ModifierGroup` | Grupos de modificadores |
| `Modifier` | Opciones de modificador con precio |
| `Order` | Pedido |
| `OrderItem` | Producto dentro del pedido |
| `CashCut` | Corte de caja |
| `Settings` | Configuracion del negocio y tema publico |

## 5. Enums relevantes

| Enum | Valores principales |
|---|---|
| `Version` | `LITE`, `PRO`, `ENTERPRISE` |
| `PublicTemplate` | `CLASICO`, `MERCADO`, `ELEGANTE`, `TAQUERIA`, `MARISQUERIA`, `CAFETERIA`, `PIZZERIA`, `SUSHI`, `HAMBURGUESAS`, `ANTOJITOS`, `BAR_BOTANERO`, `DARK_KITCHEN`, `POLLERIA` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` |
| `ServiceType` | `MOSTRADOR`, `MESA`, `RECOGER`, `DOMICILIO` |
| `PaymentStatus` | `PENDIENTE`, `PAGADO`, `CANCELADO` |
| `PaymentMethod` | `EFECTIVO`, `TARJETA`, `TRANSFERENCIA`, `OTRO` |

## 6. Rutas principales

| Ruta | Tipo | Acceso |
|---|---|---|
| `/` | Landing comercial | Publico |
| `/[slug]` | Menu publico por negocio | Publico |
| `/t/[slug]` | Alias interno de menu publico | Publico |
| `/admin/login` | Login administrativo | Publico |
| `/admin` | Dashboard | Autenticado |
| `/admin/categories` | Categorias | Autenticado |
| `/admin/products` | Productos, ingredientes y modificadores | Autenticado |
| `/admin/orders` | Pedidos y analytics | Autenticado |
| `/admin/kitchen` | Monitor de cocina | Autenticado |
| `/admin/cash` | Caja diaria | Autenticado |
| `/admin/settings` | Ajustes del negocio | Autenticado |
| `/admin/tenants` | Gestion SaaS de negocios | Solo `SUPER_ADMIN` |
| `/api/orders` | Crear pedido | Publico |
| `/api/cron/reset-demos` | Reiniciar demos vencidas | Protegido por `CRON_SECRET` |

## 7. Flujo de pedido

1. El cliente entra a `/<slug>`.
2. Revisa categorias, productos, ingredientes, imagenes y modificadores segun plan.
3. Agrega productos al carrito.
4. Captura datos de contacto y tipo de servicio.
5. El frontend envia `POST /api/orders`.
6. El backend recalcula precios, valida productos y guarda `Order` + `OrderItem`.
7. El pedido aparece en `/admin/orders` y, si aplica, en `/admin/kitchen`.
8. El sistema devuelve URL de WhatsApp con mensaje listo.
9. Caja puede marcar pago y cerrar corte.

## 8. Diferencias por plan

| Funcion | Lite | Pro | Enterprise |
|---|---|---|---|
| Categorias/productos | Si | Si | Si |
| Pedidos por WhatsApp | Si | Si | Si |
| Control de agotados | Si | Si | Si |
| Imagenes | No | Si | Si |
| Ingredientes visibles | No | Si | Si |
| Modificadores avanzados | No | Si | Si |
| Busqueda/filtros | No | Si | Si |
| Analytics | No | Si | Si |
| Monitor de cocina | No | Si | Si |
| Caja diaria | No | Si | Si |
| Dashboard enriquecido | Basico | Si | Si |
| Gestion SaaS multi-cliente | Super admin | Super admin | Super admin |

## 9. Variables de entorno

| Variable | Uso | Sensible |
|---|---|---|
| `DATABASE_URL` | Conexion PostgreSQL pooling | Si |
| `DIRECT_URL` | Conexion directa Prisma | Si |
| `NEXTAUTH_URL` | URL base de auth | No |
| `NEXT_PUBLIC_APP_URL` | Origen publico para headers | No |
| `NEXTAUTH_SECRET` | Firma de sesion | Si |
| `ROOT_DOMAIN` | Dominio raiz para multi-tenant | No |
| `DEFAULT_TENANT_SLUG` | Tenant fallback | No |
| `SEED_ADMIN_EMAIL` | Usuario super admin local | Depende |
| `SEED_ADMIN_PASSWORD` | Password super admin local | Si |
| `SEED_DEMO_EMAIL_DOMAIN` | Dominio de correos demo local | No |
| `SEED_DEMO_PASSWORD` | Password demo local | Si |
| `CRON_SECRET` | Proteccion del cron | Si |
| `NEXT_PUBLIC_DEMO_EMAIL_DOMAIN` | Dominio mostrado en login demo | No |

## 10. Seeds demo

`prisma/seed.ts` crea negocios ficticios:

| Slug | Giro | Plan |
|---|---|---|
| `fonda_lupita` | Cocina economica | Lite |
| `taqueria_don_jose` | Taqueria | Pro |
| `grupo_nopal` | Operacion premium | Enterprise |
| `mariscos_el_faro` | Marisqueria | Pro |
| `cafe_amanecer` | Cafeteria | Pro |
| `pizza_barrio` | Pizzeria | Pro |

Tambien genera pedidos, ventas, cancelaciones y cortes de caja para mostrar dashboards con datos.

## 11. Cron de demos

`/api/cron/reset-demos` reinicia datos de tenants demo vencidos.

- Requiere `CRON_SECRET`.
- Borra pedidos/cortes demo.
- Regenera datos de hasta 60 dias.
- Sirve para que prospectos puedan probar sin dejar el demo sucio.

## 12. Seguridad actual

- Passwords hasheados con bcrypt.
- Sesiones JWT firmadas por `NEXTAUTH_SECRET`.
- Validaciones con Zod en API.
- Headers de seguridad en `next.config.ts`.
- Aislamiento de rutas admin por sesion.
- Super admin restringido para gestion de tenants.

## 13. Riesgos y siguientes mejoras

| Riesgo/mejora | Prioridad |
|---|---|
| Rate limiting en login y pedidos | Alta |
| Auditoria de cambios admin | Alta |
| Pruebas automatizadas end-to-end | Media |
| Permisos por rol mas finos | Media |
| Inventario/recetas/costos | Media |
| Integracion de pagos de suscripcion | Media |
| QR por mesa | Media |
| Facturacion | Baja/segun mercado |

## 14. Comandos utiles

```bash
npm install
npm run prisma:generate
npx prisma db push
npm run db:seed
npm run lint
npm run build
npm run dev
```

## 15. Notas para IA y colaboradores

- Mantener UI en espanol Mexico.
- No introducir textos en ingles visibles al usuario final.
- No exponer datos reales en codigo o docs.
- Antes de tocar consultas, revisar que usen `tenantId`.
- Antes de tocar planes, asegurar que Lite/Pro/Enterprise no prometan funciones inexistentes.
- Si se agregan nuevas variables, actualizar `.env.example`, README y esta documentacion.
