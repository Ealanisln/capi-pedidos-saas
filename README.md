# Capi Pedidos SaaS

![Arquitectura de Capi](./docs/assets/arquitectura.svg)

Capi Pedidos SaaS es una plataforma multi-tenant para menus digitales, pedidos por WhatsApp, cocina, caja, comandero de meseros, impresion termica y reportes para restaurantes en Mexico.

Demo instalada: [https://capi.nohmendez.xyz/](https://capi.nohmendez.xyz/)

Creado por **Rafael Noh - Soluciones Tecnologicas Playa del Carmen**.

Contacto: [Sitio web](http://nohmendez.xyz/) | [Facebook](https://www.facebook.com/people/Soluciones-Tecnologicas-Playa-del-Carmen/61586167409780/) | [WhatsApp](https://wa.me/529842046913)

> Este repositorio es publico para recibir ayuda, mejoras y colaboraciones. No incluye credenciales reales ni accesos privados de produccion.

## About sugerido para GitHub

Descripcion corta:

```text
SaaS multi-tenant para menus digitales, pedidos por WhatsApp, caja, cocina e impresion termica para restaurantes en Mexico.
```

Website:

```text
https://capi.nohmendez.xyz/
```

Topics sugeridos:

`nextjs`, `prisma`, `postgresql`, `vercel`, `restaurant`, `saas`, `mexico`, `pos`, `whatsapp`, `thermal-printer`, `vibecoding`, `typescript`, `tailwindcss`.

## Por que se llama Capi

La idea nacio porque la esposa y el hermano de Rafael tienen negocios de antojitos mexicanos en Quintana Roo y necesitaban una app que se ajustara a su forma real de vender: menu facil, pedidos claros, cocina organizada y caja sencilla.

La hija menor de Rafael eligio a la capibara como imagen representativa. Su pareja, que cocina muy bien, dejo el concepto como **La Capibara Feliz**. De ahi nace Capi: un proyecto pensado para ayudar a emprendedores de comida a empezar simple, elegir su categoria y escalar a su ritmo.

## Que problema resuelve

Muchos negocios pequenos reciben pedidos por WhatsApp con fotos viejas, precios desactualizados, notas incompletas y sin orden para cocina o caja. Capi centraliza ese flujo sin obligar al restaurante a comprar un punto de venta pesado desde el primer dia.

## Funciones principales

| Area | Que incluye |
|---|---|
| Landing comercial | Presentacion de planes, demos y enlaces de contacto. |
| Menu publico | URL por negocio como `/taqueria_don_jose` o `/fonda_lupita`. |
| Carrito | El cliente arma su pedido y lo envia por WhatsApp. |
| Pedidos | Registro de ordenes, estados y datos del cliente. |
| Cocina | Monitor de produccion por pedidos y estados. |
| Caja | Apertura, cobros, propinas, movimientos, precorte y cierre. |
| Meseros | Usuarios limitados, mesas y flujo de comandero por plan. |
| Impresion | Tickets de venta, produccion, precuenta y estaciones por area. |
| Super admin | Alta de restaurantes, planes, vigencias y demos. |
| Reportes | URL con token para Excel, PowerBI o sistemas externos. |
| Demos | Datos ficticios enriquecidos para vender mostrando funciones reales. |

## Planes comerciales

| Funcion | Lite $190 MXN/mes | Pro $350 MXN/mes | Enterprise $550 MXN/mes |
|---|---:|---:|---:|
| Menu publico | Si | Si | Si |
| Pedidos por WhatsApp | Si | Si | Si |
| Productos y categorias | Ilimitado operativo | Ilimitado operativo | Ilimitado operativo |
| Imagenes de producto | No | Si | Si |
| Ingredientes visibles | No | Si | Si |
| Modificadores avanzados | Basicos | Si | Si |
| Busqueda y filtros | Basico | Si | Si |
| Dashboard y analisis | Basico | Si | Avanzado |
| Caja | 1 caja | 3 cajas | Hasta 8 cajas |
| Meseros | 2 | 8 | 30 |
| Mesas | 10 | 35 | 120 |
| Estaciones de impresion | 3 | 6 | 12 |
| Reportes Excel/PowerBI | Si | Si | Si |

## Demos en produccion

| Demo | Plan | Menu publico | Panel admin demo |
|---|---|---|---|
| Fonda Lupita | Lite | [Ver menu](https://capi.nohmendez.xyz/fonda_lupita) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=lite) |
| Taqueria Don Jose | Pro | [Ver menu](https://capi.nohmendez.xyz/taqueria_don_jose) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=pro) |
| Grupo Nopal Gourmet | Enterprise | [Ver menu](https://capi.nohmendez.xyz/grupo_nopal) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=enterprise) |
| Mariscos El Faro | Pro | [Ver menu](https://capi.nohmendez.xyz/mariscos_el_faro) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=mariscos) |
| Cafe Amanecer | Pro | [Ver menu](https://capi.nohmendez.xyz/cafe_amanecer) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=cafe) |
| Pizza del Barrio | Pro | [Ver menu](https://capi.nohmendez.xyz/pizza_barrio) | [Entrar demo](https://capi.nohmendez.xyz/admin/login?demo=pizza) |

## Flujo del pedido

![Flujo del pedido](./docs/assets/flujo-pedido.svg)

1. El cliente entra al menu publico del restaurante.
2. Revisa categorias, productos, ingredientes, extras y precios.
3. Agrega productos al carrito.
4. Captura datos de servicio: recoger, mesa, mostrador o domicilio.
5. El sistema guarda el pedido y prepara el mensaje de WhatsApp.
6. Cocina visualiza o imprime la comanda.
7. Caja cobra, calcula cambio, registra propinas y emite ticket.
8. El administrador puede analizar ventas en dashboard, Excel o PowerBI.

## Stack tecnico

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Autenticacion | NextAuth Credentials + JWT |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Validacion | Zod |
| Datos demo | @faker-js/faker |
| Hosting recomendado | Vercel |
| Base recomendada | Neon Postgres en Vercel Stores |
| Impresion silenciosa | Capi Print Bridge con Electron |

## Instalacion rapida

### Windows PowerShell

```powershell
git clone https://github.com/Noh-JR/capi-pedidos-saas.git
cd capi-pedidos-saas
npm install
Copy-Item .env.example .env
npm run prisma:generate
npx prisma db push
npm run db:seed
npm run dev
```

### macOS y Linux

```bash
git clone https://github.com/Noh-JR/capi-pedidos-saas.git
cd capi-pedidos-saas
npm install
cp .env.example .env
npm run prisma:generate
npx prisma db push
npm run db:seed
npm run dev
```

Despues abre [http://localhost:3000](http://localhost:3000).

## Variables importantes

| Variable | Para que sirve |
|---|---|
| `DATABASE_URL` | Conexion pooled a PostgreSQL. |
| `DIRECT_URL` | Conexion directa para Prisma. |
| `NEXTAUTH_SECRET` | Firma segura de sesiones. |
| `NEXTAUTH_URL` | URL base de autenticacion. |
| `NEXT_PUBLIC_APP_URL` | URL publica para tickets/reportes. |
| `PRINT_BRIDGE_TOKEN` | Token del puente local de impresion. |
| `SEED_ADMIN_EMAIL` | Correo del super administrador seed. |
| `SEED_ADMIN_PASSWORD` | Password local/seed del super administrador. |
| `SEED_DEMO_EMAIL_DOMAIN` | Dominio para usuarios demo. |
| `SEED_DEMO_PASSWORD` | Password de demos locales. |

## Estructura del proyecto

```text
prisma/
  schema.prisma                 Modelos de datos y enums
  seed.ts                       Demos y datos operativos
src/
  app/                          Rutas Next.js App Router
  app/(admin)/admin             Panel administrativo
  app/api/orders                Creacion de pedidos
  app/api/print                 Cola de impresion para puente local
  app/api/reportes              Exportes CSV/JSON con token
  components/                   Componentes reutilizables
  lib/                          Auth, Prisma, tickets, temas, formatos
  types/                        Tipos globales
server externo local/
  tools/capi-print-bridge       App Electron para impresion silenciosa
docs/
  DOCUMENTACION_TECNICA.md      Arquitectura y decisiones tecnicas
  MANUAL_DE_USO.md              Manual para restaurantes
  IMPRESION_LOCAL.md            Guia de impresoras termicas
  REPORTES_POWERBI_EXCEL.md     Conexion a Excel y PowerBI
  GUIA_VIBECODING.md            Como colaborar con IA
```

## Reportes para Excel y PowerBI

Cada restaurante puede crear un token desde `Admin > Reportes`. Ese token permite consultar ventas sin usar usuario y contrasena.

Ejemplo CSV:

```text
https://capi.nohmendez.xyz/api/reportes/taqueria_don_jose/ventas?token=TU_TOKEN&formato=csv&desde=2026-03-01&hasta=2026-04-19
```

Ejemplo JSON:

```text
https://capi.nohmendez.xyz/api/reportes/taqueria_don_jose/ventas?token=TU_TOKEN&formato=json&desde=2026-03-01&hasta=2026-04-19
```

Lee la guia completa: [Reportes PowerBI y Excel](./docs/REPORTES_POWERBI_EXCEL.md).

## Impresion termica

Capi soporta trabajos de impresion para ticket de venta y produccion. En produccion real, una app local de Windows llamada **Capi Print Bridge** consulta trabajos pendientes y manda imprimir silenciosamente a impresoras de 58 mm u 80 mm.

Lee la guia completa: [Impresion local](./docs/IMPRESION_LOCAL.md).

## Vibecoding con IA

![Agentes IA](./docs/assets/agentes-ia.svg)

Archivos utiles para agentes:

| Archivo | Uso recomendado |
|---|---|
| `AGENTS.md` | Reglas generales para agentes. |
| `CLAUDE.md` | Contexto para Claude. |
| `CODEX.md` | Contexto para Codex. |
| `GEMINI.md` | Contexto para Gemini. |
| `.github/copilot-instructions.md` | Contexto para GitHub Copilot. |
| `docs/GUIA_VIBECODING.md` | Guia para pedir cambios con IA. |
| `docs/DOCUMENTACION_TECNICA.md` | Arquitectura antes de tocar codigo. |

Prompt base:

```text
Lee README.md, AGENTS.md y docs/DOCUMENTACION_TECNICA.md antes de cambiar codigo.
Mant?n la UI en espa?ol Mexico.
No subas .env ni credenciales.
Respeta tenantId en todas las consultas.
Si modificas comportamiento, actualiza documentacion.
Ejecuta npm run lint y npm run build antes de terminar.
```

## Como colaborar

1. Lee [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Crea un branch con la convencion definida.
3. Haz cambios pequenos y explicables.
4. Ejecuta validaciones.
5. Abre Pull Request con capturas si cambia la UI.

## Comandos de validacion

```bash
npm run lint
npm run build
```

Si cambias Prisma:

```bash
npm run prisma:generate
npx prisma db push
npm run db:seed
```

## Licencia

Este proyecto usa una licencia de colaboracion publica con derechos reservados. Puedes ver, estudiar, hacer fork y proponer mejoras por Pull Request, pero no puedes revender, sublicenciar ni explotar comercialmente este codigo como SaaS, plantilla o producto sin permiso escrito de Rafael Noh.

Lee [LICENSE](./LICENSE).
