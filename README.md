# 🍽️ Capi Pedidos SaaS

![Arquitectura de Capi](./docs/assets/arquitectura.svg)

Capi Pedidos SaaS es una plataforma multi-tenant para restaurantes, fondas, cafeterías, taquerías, marisquerías, dark kitchens y negocios de comida que quieren publicar un menú digital, recibir pedidos por WhatsApp y administrar su operación diaria desde un panel web.

Este repositorio está pensado para dos tipos de personas:

- 👨‍🍳 Personas de negocio que quieren entender qué hace el sistema sin ser programadoras.
- 🤖 Personas que hacen vibecoding con Claude, Codex, Gemini, Cursor, Windsurf, Antigravity u otros agentes de IA.

> Regla importante: este repo es público y no incluye credenciales reales, bases de datos privadas ni accesos productivos.

---

## 🚀 Resumen rápido

| Pregunta | Respuesta corta |
|---|---|
| ¿Qué es? | Un SaaS de menús digitales y pedidos por WhatsApp para restaurantes. |
| ¿Para quién es? | Restaurantes, cocinas, cafeterías, dark kitchens y negocios de comida. |
| ¿Qué incluye? | Landing, menú público, admin, pedidos, cocina, caja, demos y temas. |
| ¿Es multi-tenant? | Sí, cada negocio vive como un `Tenant`. |
| ¿Base de datos? | PostgreSQL con Prisma. Recomendado: Neon Postgres en Vercel. |
| ¿Hosting recomendado? | Vercel. |
| ¿Idioma objetivo? | Español México. |
| ¿Moneda objetivo? | Pesos mexicanos. |

---

## 🧭 ¿Qué problema resuelve?

Muchos restaurantes reciben pedidos por WhatsApp de forma desordenada:

- Fotos del menú desactualizadas.
- Precios viejos circulando en chats.
- Clientes preguntando lo mismo una y otra vez.
- Pedidos incompletos o sin datos.
- Cocina sin claridad de qué preparar.
- Caja sin resumen del día.

Capi busca ordenar ese flujo sin obligar al restaurante a instalar una app pesada ni cambiar de punto de venta.

---

## ✨ Funciones principales

| Área | Qué permite |
|---|---|
| 🏠 Landing | Presenta planes, demos y propuesta comercial. |
| 📱 Menú público | Cada negocio tiene URL propia como `/<slug>`. |
| 🛒 Carrito | El cliente arma pedido y lo envía a WhatsApp. |
| 🧾 Pedidos | El restaurante recibe órdenes con datos y estatus. |
| 🍳 Cocina | Monitor de comandas activas por estado. |
| 💵 Caja | Cobros, métodos de pago y cortes diarios opcionales. |
| 🧑‍💼 Super admin | Alta de negocios, planes, vigencias y demos. |
| 🎨 Temas | Apariencia pública configurable por giro. |
| 📊 Dashboard | Ventas, pedidos, productos populares y operación. |
| 🧪 Demos | Datos ficticios realistas para probar sin miedo. |

---

## 🖼️ Flujo del pedido

![Flujo del pedido](./docs/assets/flujo-pedido.svg)

1. El cliente entra al menú público.
2. Revisa categorías, productos, fotos, ingredientes y extras.
3. Agrega productos al carrito.
4. Captura datos de contacto y tipo de servicio.
5. El sistema guarda el pedido y genera mensaje de WhatsApp.
6. Cocina cambia estados: pendiente, preparando, listo.
7. Caja registra cobro y corte si el negocio lo necesita.

---

## 🧩 Planes incluidos

| Función | Lite | Pro | Enterprise |
|---|---:|---:|---:|
| Menú público | ✅ | ✅ | ✅ |
| Pedidos por WhatsApp | ✅ | ✅ | ✅ |
| Categorías/productos | ✅ | ✅ | ✅ |
| Control de agotados | ✅ | ✅ | ✅ |
| Imágenes | ❌ | ✅ | ✅ |
| Ingredientes visibles | ❌ | ✅ | ✅ |
| Modificadores avanzados | ❌ | ✅ | ✅ |
| Búsqueda/filtros | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Monitor de cocina | ❌ | ✅ | ✅ |
| Caja diaria opcional | ❌ | ✅ | ✅ |

---

## 🧪 Demos locales que crea el seed

| Demo | URL local | Plan | Giro |
|---|---|---|---|
| Fonda Lupita | `/fonda_lupita` | Lite | Cocina económica |
| Taquería Don José | `/taqueria_don_jose` | Pro | Taquería |
| Grupo Nopal Gourmet | `/grupo_nopal` | Enterprise | Operación premium |
| Mariscos El Faro | `/mariscos_el_faro` | Pro | Marisquería |
| Café Amanecer | `/cafe_amanecer` | Pro | Cafetería |
| Pizza del Barrio | `/pizza_barrio` | Pro | Pizzería |

Los usuarios demo se generan desde variables de entorno. No se publican contraseñas reales en el repositorio.

---

## 🛠️ Stack técnico

| Área | Tecnología |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Autenticación | NextAuth Credentials + JWT |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Validación | Zod |
| Formularios | React Hook Form |
| Datos demo | @faker-js/faker |
| Hosting sugerido | Vercel |
| BD recomendada | Neon Postgres |

---

## 🧑‍💻 Instalación rápida para principiantes

### 1. Instala herramientas

Necesitas:

- Node.js 20 o superior.
- npm.
- Git.
- Una base PostgreSQL.

Verifica:

```bash
node --version
npm --version
git --version
```

### 2. Clona el proyecto

```bash
git clone https://github.com/Noh-JR/capi-pedidos-saas.git
cd capi-pedidos-saas
```

### 3. Instala dependencias

```bash
npm install
```

### 4. Crea tu archivo `.env`

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

### 5. Edita `.env`

Cambia al menos:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/base_de_datos?sslmode=require"
DIRECT_URL="postgresql://usuario:password@host:5432/base_de_datos?sslmode=require"
NEXTAUTH_SECRET="cambia-este-secreto"
SEED_ADMIN_EMAIL="superadmin@example.com"
SEED_ADMIN_PASSWORD="CambiaEstaClave123!"
```

### 6. Prepara la base de datos

```bash
npm run prisma:generate
npx prisma db push
npm run db:seed
```

### 7. Corre el proyecto

```bash
npm run dev
```

Abre:

```text
http://localhost:3000
```

---

## 🪟 Windows PowerShell completo

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

## 🍎 macOS completo

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

## 🐧 Linux completo

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

---

## 🧠 Vibecoding con agentes de IA

![Agentes IA](./docs/assets/agentes-ia.svg)

Este proyecto ya trae archivos pensados para agentes:

| Archivo | Para qué sirve |
|---|---|
| `AGENTS.md` | Instrucciones generales para agentes de código. |
| `CLAUDE.md` | Entrada rápida para Claude. |
| `GEMINI.md` | Entrada rápida para Gemini. |
| `CODEX.md` | Entrada rápida para Codex. |
| `.github/copilot-instructions.md` | Contexto para GitHub Copilot. |
| `docs/AGENTES_IA.md` | Guía detallada para usar IA sin romper el proyecto. |
| `docs/GUIA_VIBECODING.md` | Manual paso a paso para vibecoding seguro. |

### Prompt inicial recomendado

```text
Estoy trabajando en Capi Pedidos SaaS. Lee README.md, AGENTS.md y docs/DOCUMENTACION_TECNICA.md antes de modificar código.

Reglas:
- Mantén la UI en español México.
- No agregues credenciales reales.
- No subas .env.
- Respeta tenantId en consultas.
- Si cambias funcionalidades, actualiza documentación.
- Ejecuta npm run lint y npm run build antes de terminar.

Tarea:
[describe aquí lo que quieres cambiar]
```

---

## 📚 Documentación

| Documento | Lectura recomendada |
|---|---|
| [Documentación técnica](./docs/DOCUMENTACION_TECNICA.md) | Arquitectura, rutas, datos y seguridad. |
| [Manual de uso](./docs/MANUAL_DE_USO.md) | Cómo usar admin, cocina, caja y demos. |
| [Guía de agentes IA](./docs/AGENTES_IA.md) | Cómo conectar Claude, Codex, Gemini y otros agentes. |
| [Guía de vibecoding](./docs/GUIA_VIBECODING.md) | Cómo pedir cambios sin romper el proyecto. |
| [Referencias de menús interactivos](./docs/ANALISIS_REFERENCIAS_MENUS_INTERACTIVOS.md) | Benchmark e ideas futuras. |
| [Seguridad](./SECURITY.md) | Reglas para no exponer datos sensibles. |
| [Contribuir](./CONTRIBUTING.md) | Cómo colaborar con Pull Requests. |

---

## 🔐 Seguridad básica

Antes de publicar o desplegar:

- Nunca subas `.env`.
- Cambia `NEXTAUTH_SECRET`.
- Cambia passwords seed.
- No uses credenciales demo reales en documentación pública.
- Revisa variables en Vercel y en tu proveedor de base de datos.
- Rota credenciales si alguna vez fueron compartidas.

---

## 🧱 Estructura del proyecto

```text
prisma/
  schema.prisma       Modelo de datos
  seed.ts             Datos demo realistas
src/
  app/                Rutas App Router
  components/         Componentes de UI
  lib/                Auth, Prisma, tenants, formatos y temas
docs/
  assets/             Imágenes SVG para GitHub
  AGENTES_IA.md       Guía para agentes
  GUIA_VIBECODING.md  Guía para cambios asistidos por IA
public/
  .well-known/security.txt
```

---

## ✅ Comandos de validación

Antes de subir cambios:

```bash
npm run lint
npm run build
```

Si cambias Prisma:

```bash
npm run prisma:generate
npx prisma db push
```

---

## 🗺️ Roadmap sugerido

- Rate limiting en login y pedidos.
- Auditoría de cambios administrativos.
- QR por mesa.
- Inventario ligero por insumo.
- Recetas y costos.
- Promociones por horario.
- PWA instalable.
- Pruebas end-to-end.
- Integración de pagos de suscripción.

---

## 📄 Licencia

Licencia pendiente por definir por el propietario del proyecto. Si deseas reutilizar este código fuera de una contribución al repositorio, solicita autorización primero.
