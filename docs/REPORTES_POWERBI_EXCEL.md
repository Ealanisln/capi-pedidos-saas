# Reportes para Excel, PowerBI e IA

Capi permite que cada restaurante conecte sus ventas a herramientas externas usando una URL con token. Esto ayuda a crear tablas dinamicas, dashboards, analisis de productos, horarios pico y ventas por metodo de pago.

## Donde se configura

En el panel del restaurante:

```text
Admin > Reportes
```

Desde ahi se puede:

- Crear un token nuevo.
- Ver el prefijo del token.
- Definir fecha de vencimiento.
- Revocar tokens.
- Ver historial de uso.
- Copiar ejemplos CSV y JSON.

## Seguridad del token

El token funciona como una contrasena de solo lectura para reportes.

Buenas practicas:

- No compartirlo en capturas.
- Crear un token por archivo o persona.
- Revocar tokens que ya no se usen.
- Poner fecha de vencimiento.
- No usar el token de impresion para reportes.

## Endpoint CSV

```text
GET /api/reportes/[slug]/ventas
```

Parametros:

| Parametro | Requerido | Ejemplo | Descripcion |
|---|---:|---|---|
| token | Si | TU_TOKEN | Token creado en Admin > Reportes. |
| formato | No | csv | Puede ser csv o json. |
| desde | No | 2026-03-01 | Fecha inicial. |
| hasta | No | 2026-04-19 | Fecha final. |

Ejemplo:

```text
https://capi.nohmendez.xyz/api/reportes/taqueria_don_jose/ventas?token=TU_TOKEN&formato=csv&desde=2026-03-01&hasta=2026-04-19
```

## Columnas del CSV

| Columna | Significado |
|---|---|
| restaurante | Nombre comercial. |
| slug_restaurante | Identificador del negocio. |
| folio | Folio del pedido. |
| fecha | Fecha ISO del pedido. |
| cliente | Nombre del cliente. |
| telefono | Telefono capturado. |
| tipo_servicio | MESA, RECOGER, DOMICILIO o MOSTRADOR. |
| mesa | Mesa o referencia. |
| area_mesa | Salon, terraza o barra. |
| estado_pedido | PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED. |
| estado_pago | PENDIENTE, PAGADO o CANCELADO. |
| metodo_pago | EFECTIVO, TARJETA, TRANSFERENCIA u OTRO. |
| subtotal_mxn | Subtotal en pesos mexicanos. |
| total_mxn | Total del pedido. |
| total_pagado_mxn | Total pagado registrado. |
| propina_mxn | Propina. |
| cambio_mxn | Cambio entregado al cliente. |
| cantidad_productos | Cantidad total de piezas. |
| productos | Resumen de productos. |
| mesero_o_usuario | Mesero o usuario asignado. |
| cancelado | SI o NO. |
| pagado | SI o NO. |

## Conectar con Excel

1. Abre Excel.
2. Entra a Datos.
3. Selecciona Obtener datos > Desde web.
4. Pega la URL CSV completa.
5. Elige cargar tabla.
6. Crea tablas dinamicas por fecha, producto, metodo de pago o mesero.

## Conectar con PowerBI

1. Abre PowerBI Desktop.
2. Selecciona Obtener datos > Web.
3. Pega la URL CSV.
4. Usa credenciales anonimas porque el token ya va en la URL.
5. Revisa tipos de datos.
6. Crea graficas de ventas, tickets promedio, productos vendidos y horarios.

## Ejemplos demo

Estos tokens son solamente para demos y pueden reiniciarse:

| Demo | URL ejemplo |
|---|---|
| Fonda Lupita | https://capi.nohmendez.xyz/api/reportes/fonda_lupita/ventas?token=demo_fonda_lupita_ventas_2026&formato=csv |
| Taqueria Don Jose | https://capi.nohmendez.xyz/api/reportes/taqueria_don_jose/ventas?token=demo_taqueria_don_jose_ventas_2026&formato=csv |
| Grupo Nopal | https://capi.nohmendez.xyz/api/reportes/grupo_nopal/ventas?token=demo_grupo_nopal_ventas_2026&formato=csv |

## Para agentes de IA

Si una IA necesita analizar datos, dale la URL JSON y esta instruccion:

```text
Lee este JSON de ventas de Capi. Resume productos mas vendidos, horarios pico, tickets promedio, metodos de pago y oportunidades de mejora. No expongas el token en tu respuesta.
```
