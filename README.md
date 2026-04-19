# Capi Pedidos SaaS

Capi Pedidos SaaS es una plataforma multi-tenant para restaurantes, fondas, cafeterias, taquerias, marisquerias, dark kitchens y negocios de comida que quieren publicar un menu digital, recibir pedidos por WhatsApp y administrar operacion diaria desde un panel web.

El objetivo del repositorio es que el proyecto pueda ser revisado, mejorado y extendido por colaboradores sin exponer credenciales privadas ni datos productivos.

## Que hace el proyecto

- Landing comercial para promocionar planes y demos.
- Menu publico por negocio usando slugs como `/<nombre-del-negocio>`.
- Panel administrativo protegido con NextAuth.
- Gestion de negocios multi-tenant para super administrador.
- Gestion de categorias, productos, precios, disponibilidad e imagenes.
- Ingredientes visibles y modificadores avanzados para planes Pro/Enterprise.
- Carrito publico con envio de pedido a WhatsApp.
- Pedidos con estatus operativo.
- Monitor de cocina para comandas activas.
- Caja diaria opcional con cobros, metodos de pago y cortes.
- Dashboard administrativo con ventas, pedidos y productos destacados.
- Demos seed con datos realistas de negocios de comida en Mexico.
- Reinicio automatico de demos mediante Vercel Cron.
- Temas visuales administrables para menus publicos.

## Stack tecnico

| Area | Tecnologia |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Autenticacion | NextAuth Credentials + JWT |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Validacion | Zod |
| Formularios | React Hook Form |
| Datos demo | @faker-js/faker |
| Hosting recomendado | Vercel |
| Base recomendada en Vercel | Neon Postgres |

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- PostgreSQL disponible localmente o en la nube.
- Git.

Verifica versiones:

```bash
node --version
npm --version
git --version
```

## Instalacion en Windows PowerShell

```powershell
git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma db push
npm run db:seed
npm run dev
```

Abre:

```text
http://localhost:3000
```

## Instalacion en macOS o Linux

```bash
git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
npm install
cp .env.example .env
npm run prisma:generate
npx prisma db push
npm run db:seed
npm run dev
```

Abre:

```text
http://localhost:3000
```

## Configuracion de base de datos

Copia `.env.example` a `.env` y cambia las variables:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/base_de_datos?sslmode=require"
DIRECT_URL="postgresql://usuario:password@host:5432/base_de_datos?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="cambia-este-secreto"
ROOT_DOMAIN="localhost"
DEFAULT_TENANT_SLUG="capi"
```

Para produccion, genera un secreto fuerte:

```bash
openssl rand -base64 32
```

En Windows, si no tienes OpenSSL, puedes usar:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Base de datos recomendada

Para Vercel se recomienda Neon Postgres porque se integra bien con Vercel Stores y Prisma.

Tambien puedes usar:

- Supabase Postgres.
- Railway Postgres.
- Docker con PostgreSQL local.
- Cualquier PostgreSQL compatible con Prisma.

## Comandos principales

| Comando | Uso |
|---|---|
| `npm run dev` | Inicia desarrollo local |
| `npm run build` | Compila produccion |
| `npm run start` | Sirve build local |
| `npm run lint` | Ejecuta ESLint |
| `npm run prisma:generate` | Genera Prisma Client |
| `npx prisma db push` | Sincroniza schema con BD sin migracion versionada |
| `npm run prisma:migrate -- --name nombre` | Crea migracion de desarrollo |
| `npx prisma migrate deploy` | Aplica migraciones en produccion |
| `npm run db:seed` | Carga datos demo |

## Usuarios seed locales

Por seguridad, el repositorio no incluye credenciales productivas.

El seed usa variables configurables:

```env
SEED_ADMIN_EMAIL="superadmin@example.com"
SEED_ADMIN_PASSWORD="CambiaEstaClave123!"
SEED_DEMO_EMAIL_DOMAIN="example.com"
SEED_DEMO_PASSWORD="DemoLocal123!"
```

Despues de correr `npm run db:seed`, entra a:

```text
http://localhost:3000/admin/login
```

Usa el correo y password que definiste en `.env`.

## Demos locales incluidas

Despues del seed se crean negocios demo como:

| Demo | Slug | Plan |
|---|---|---|
| Fonda Lupita | `/fonda_lupita` | Lite |
| Taqueria Don Jose | `/taqueria_don_jose` | Pro |
| Grupo Nopal Gourmet | `/grupo_nopal` | Enterprise |
| Mariscos El Faro | `/mariscos_el_faro` | Pro |
| Cafe Amanecer | `/cafe_amanecer` | Pro |
| Pizza del Barrio | `/pizza_barrio` | Pro |

Los correos demo se generan con `SEED_DEMO_EMAIL_DOMAIN` y todos usan `SEED_DEMO_PASSWORD` en local.

## Planes funcionales

| Funcion | Lite | Pro | Enterprise |
|---|---|---|---|
| Menu publico | Si | Si | Si |
| Pedidos por WhatsApp | Si | Si | Si |
| Categorias/productos ilimitados | Si | Si | Si |
| Control de agotados | Si | Si | Si |
| Imagenes | No | Si | Si |
| Ingredientes visibles | No | Si | Si |
| Modificadores avanzados | No | Si | Si |
| Busqueda/filtros | No | Si | Si |
| Analytics | No | Si | Si |
| Monitor de cocina | No | Si | Si |
| Caja diaria opcional | No | Si | Si |

## Estructura del proyecto

```text
prisma/
  schema.prisma       Modelo de datos
  seed.ts             Datos demo realistas
src/
  app/                Rutas App Router
  components/         Componentes de UI
  lib/                Auth, Prisma, tenants, formatos y temas
docs/
  DOCUMENTACION_TECNICA.md
  MANUAL_DE_USO.md
  ANALISIS_REFERENCIAS_MENUS_INTERACTIVOS.md
public/
  .well-known/security.txt
```

## Despliegue en Vercel

1. Crea una base PostgreSQL.
2. Sube el repositorio a GitHub.
3. Importa el repo en Vercel.
4. Agrega variables de entorno en Vercel Project Settings.
5. Ejecuta migraciones:

```bash
npx prisma migrate deploy
```

6. Si quieres cargar demos:

```bash
npm run db:seed
```

7. Configura dominio/subdominio en Vercel Domains.
8. Define `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `ROOT_DOMAIN` y `DEFAULT_TENANT_SLUG` con los valores de produccion.

## Cron de demos

El endpoint `/api/cron/reset-demos` reinicia demos vencidas.

Configura `CRON_SECRET` y en Vercel usa una tarea programada que mande:

```text
Authorization: Bearer TU_CRON_SECRET
```

## Seguridad

Antes de publicar o desplegar:

- Nunca subas `.env`.
- Cambia `NEXTAUTH_SECRET`.
- Cambia passwords seed.
- No uses credenciales demo en produccion si el sitio es publico.
- Revisa variables en Vercel y en tu proveedor de base de datos.
- Rota credenciales si alguna vez fueron compartidas.

## Como colaborar

1. Haz fork del repositorio.
2. Crea una rama descriptiva.
3. Ejecuta `npm run lint` y `npm run build`.
4. Abre un Pull Request explicando el cambio.

Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para mas detalles.

## Documentacion adicional

- [Documentacion tecnica](./docs/DOCUMENTACION_TECNICA.md)
- [Manual de uso](./docs/MANUAL_DE_USO.md)
- [Analisis de referencias](./docs/ANALISIS_REFERENCIAS_MENUS_INTERACTIVOS.md)

## Licencia

Licencia pendiente por definir por el propietario del proyecto. Si deseas reutilizar este codigo fuera de una contribucion al repositorio, solicita autorizacion primero.
