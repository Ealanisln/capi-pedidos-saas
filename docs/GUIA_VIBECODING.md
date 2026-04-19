# Guía de vibecoding para Capi Pedidos SaaS

Vibecoding es trabajar con IA para crear o modificar software de forma conversacional. Puede ser muy poderoso, pero en un SaaS real hay que hacerlo con orden.

Esta guía está pensada para personas que no programan todos los días, pero quieren colaborar, probar ideas y pedir mejoras sin romper el proyecto.

---

## 1. Mentalidad correcta

No le pidas a la IA: `haz todo mejor`.

Pídele cambios pequeños, claros y verificables.

Buen ejemplo:

```text
Mejora la sección de planes en la landing.
Debe explicar mejor Lite, Pro y Enterprise.
No cambies precios ni rutas.
Actualiza README si cambias textos comerciales.
```

Mal ejemplo:

```text
Hazlo más moderno y completo.
```

---

## 2. Fórmula para pedir cambios

Usa esta estructura:

```text
Contexto:
[qué parte del sistema quieres tocar]

Objetivo:
[qué resultado quieres]

Restricciones:
[qué no debe cambiar]

Validación:
[qué comando o flujo debe pasar]
```

Ejemplo:

```text
Contexto:
El menú público de los restaurantes.

Objetivo:
Quiero que los ingredientes sean más visibles en productos Pro y Enterprise.

Restricciones:
No mostrar ingredientes en Lite.
No cambiar precios.
No tocar la base de datos.

Validación:
Ejecuta npm run lint y npm run build.
```

---

## 3. Cambios pequeños recomendados

| Quiero mejorar | Pide esto |
|---|---|
| Landing | Una sección específica, no toda la página. |
| Menú público | Una interacción: filtros, tarjetas, carrito, ingredientes. |
| Admin | Un módulo: productos, pedidos, cocina, caja o tenants. |
| Base de datos | Primero pide plan técnico, luego implementación. |
| Seguridad | Pide revisión antes de código. |
| Documentación | Pide ejemplos para principiantes. |

---

## 4. Cómo revisar si la IA hizo bien el trabajo

Corre:

```bash
npm run lint
npm run build
```

Luego revisa:

- Que no haya cambiado `.env`.
- Que no haya passwords en documentación.
- Que no haya textos en inglés en la UI final.
- Que no haya funciones prometidas sin implementar.
- Que Lite, Pro y Enterprise sigan teniendo diferencias reales.

---

## 5. Rutas que conviene conocer

| Ruta | Qué es |
|---|---|
| `/` | Landing comercial. |
| `/<slug>` | Menú público de un negocio. |
| `/admin/login` | Login. |
| `/admin` | Dashboard. |
| `/admin/products` | Productos. |
| `/admin/orders` | Pedidos. |
| `/admin/kitchen` | Cocina. |
| `/admin/cash` | Caja. |
| `/admin/tenants` | Gestión SaaS para super admin. |

---

## 6. Archivos que se tocan seguido

| Archivo | Cuándo tocarlo |
|---|---|
| `src/app/page.tsx` | Landing. |
| `src/components/public/menu-client.tsx` | Menú público y carrito. |
| `src/app/(admin)/admin/(protected)/products/page.tsx` | Gestión de productos. |
| `src/app/(admin)/admin/(protected)/orders/page.tsx` | Pedidos. |
| `src/app/(admin)/admin/(protected)/kitchen/page.tsx` | Cocina. |
| `src/app/(admin)/admin/(protected)/cash/page.tsx` | Caja. |
| `prisma/schema.prisma` | Modelo de datos. |
| `prisma/seed.ts` | Datos demo. |
| `docs/*` | Documentación. |

---

## 7. Prompts listos

### Mejorar landing

```text
Lee README.md y src/app/page.tsx.
Mejora una sección de la landing para que venda mejor Capi a restaurantes de México.
Mantén español México.
No agregues datos personales ni credenciales.
Ejecuta npm run lint y npm run build.
```

### Revisar un bug

```text
Tengo este bug:
[describe el bug]

Busca la causa probable en el código.
No edites todavía.
Devuélveme archivos relacionados, hipótesis y plan de solución.
```

### Implementar función

```text
Implementa esta función:
[describe función]

Restricciones:
- Respeta tenantId.
- Mantén español México.
- No cambies variables de entorno sin actualizar .env.example.
- Actualiza documentación.
- Ejecuta lint y build.
```

### Revisar seguridad

```text
Haz revisión de seguridad del flujo:
[login / pedidos / cron / tenants]

Prioriza:
- fugas de datos,
- autorización,
- tenantId,
- secretos,
- validación de entrada.
No edites hasta entregar hallazgos.
```

---

## 8. Cómo versionar cambios

Este proyecto usa numeración pública tipo:

- `v0.092`
- `v0.093`
- `v0.094`

En `package.json` se usa formato compatible con npm:

- `0.0.92`
- `0.0.93`
- `0.0.94`

Para una nueva versión:

```bash
npm pkg set version=0.0.93
npm install --package-lock-only --ignore-scripts
git add .
git commit -m "docs: enrich GitHub documentation v0.093"
git tag -a v0.093 -m "Version 0.093"
git push
git push origin v0.093
```

---

## 9. Señales de peligro

Detén el cambio si la IA:

- Quiere subir `.env`.
- Pega tokens o passwords en código.
- Borra validaciones.
- Quita `tenantId` de consultas.
- Cambia precios de planes sin pedir permiso.
- Cambia auth sin explicar impacto.
- Dice que implementó algo pero no actualizó UI o docs.

---

## 10. Consejo final

La IA es excelente para avanzar rápido, pero tú sigues siendo dueño del producto. Pide cambios pequeños, valida, prueba y versiona.
