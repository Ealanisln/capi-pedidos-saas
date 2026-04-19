# Manual de uso - Capi Pedidos SaaS

Este manual explica como usar la plataforma desde tres perspectivas:

- Super administrador SaaS.
- Administrador de restaurante.
- Cliente final que entra al menu publico.

Las URLs de este documento usan `http://localhost:3000` como ejemplo. En produccion cambia ese dominio por el de tu instalacion.

## 1. Entradas principales

| Area | URL local |
|---|---|
| Landing | `http://localhost:3000/` |
| Login admin | `http://localhost:3000/admin/login` |
| Panel admin | `http://localhost:3000/admin` |
| Menu demo Lite | `http://localhost:3000/fonda_lupita` |
| Menu demo Pro | `http://localhost:3000/taqueria_don_jose` |
| Menu demo Enterprise | `http://localhost:3000/grupo_nopal` |

## 2. Iniciar sesion

1. Entra a `/admin/login`.
2. Usa el correo definido en `SEED_ADMIN_EMAIL`.
3. Usa la clave definida en `SEED_ADMIN_PASSWORD`.
4. Presiona `Entrar`.

Para instalaciones publicas, no compartas el super admin. Crea usuarios por negocio.

## 3. Super administrador SaaS

Ruta: `/admin/tenants`

El super administrador puede:

- Crear nuevos negocios.
- Cambiar plan Lite/Pro/Enterprise.
- Definir fecha de contratacion.
- Definir fecha de renovacion/vencimiento.
- Marcar un negocio como demo.
- Reiniciar demo manualmente.
- Ver fecha de ultimo/proximo reinicio demo.

### Alta de nuevo negocio

1. Entra como `SUPER_ADMIN`.
2. Ve a `Negocios SaaS`.
3. Captura nombre comercial.
4. Define slug en minusculas y con guion bajo si lo prefieres, por ejemplo `tacos_el_primo`.
5. Captura WhatsApp del negocio con codigo de pais.
6. Selecciona plan.
7. Define meses contratados.
8. Guarda.
9. Comparte URL publica: `https://tu-dominio.com/tacos_el_primo`.

### Cambio de plan

1. Ve a `/admin/tenants`.
2. Busca el negocio.
3. Selecciona plan nuevo.
4. Guarda.

Solo el super administrador debe cambiar planes. El restaurante puede ver su plan y vigencia, pero no modificarlos.

### Vigencia del cliente

Cada negocio debe tener:

- Fecha de contratacion.
- Fecha de renovacion/vencimiento.
- Plan contratado.

El panel muestra esta informacion para que el cliente sepa cuantos dias faltan para renovar.

## 4. Administrador de restaurante

El administrador de restaurante entra a `/admin` y ve solo informacion de su negocio.

### Dashboard

Muestra:

- Pedidos recientes.
- Venta estimada.
- Productos mas vendidos.
- Resumen de caja.
- Alertas de operacion.
- Plan y vigencia.

### Categorias

Ruta: `/admin/categories`

Sirve para:

- Crear categoria.
- Renombrar categoria.
- Ordenar o mantener clasificacion del menu.
- Eliminar categorias que ya no se usan.

Ejemplos:

- Tacos.
- Bebidas.
- Combos.
- Postres.
- Especialidades.

### Productos

Ruta: `/admin/products`

Permite editar:

- Nombre.
- Precio.
- Descripcion.
- Categoria.
- Imagen.
- Disponibilidad.
- Ingredientes visibles.
- Modificadores.

Si escribiste mal un precio o descripcion, edita el producto desde esta pantalla y guarda.

### Ingredientes visibles

En planes Pro/Enterprise:

1. Entra a `/admin/products`.
2. Selecciona o crea producto.
3. Agrega ingredientes en el bloque correspondiente.
4. Guarda.

El cliente vera algo como:

```text
Lleva: cebolla, cilantro, pina, salsa de la casa
```

### Modificadores

En planes Pro/Enterprise:

1. Entra a `/admin/products`.
2. Crea un grupo, por ejemplo `Tamaño`, `Extras`, `Nivel de picante`.
3. Define si es obligatorio.
4. Define minimo y maximo de seleccion.
5. Agrega opciones con precio adicional.
6. Guarda.

Ejemplos:

| Grupo | Opcion | Precio adicional |
|---|---|---|
| Tamaño | Grande | $20 |
| Extras | Queso extra | $12 |
| Picante | Bravo | $0 |

### Pedidos

Ruta: `/admin/orders`

Permite:

- Ver pedidos nuevos.
- Cambiar estatus.
- Revisar datos del cliente.
- Ver notas especiales.
- Consultar productos vendidos.

Estados principales:

- Pendiente.
- Confirmado.
- Preparando.
- Listo.
- Completado.
- Cancelado.

### Cocina

Ruta: `/admin/kitchen`

Pensado para comandas activas.

Uso recomendado:

1. Cocina abre `/admin/kitchen`.
2. Revisa pedidos nuevos.
3. Marca `Preparar` cuando empieza.
4. Marca `Listo` cuando sale.
5. Cancela solo cuando realmente no se preparara.

### Caja

Ruta: `/admin/cash`

Modulo opcional. Sirve para negocios que no tienen POS o quieren control adicional.

Permite:

- Crear cajas segun el plan contratado.
- Abrir turno con fondo inicial.
- Ver cobros del dia.
- Marcar pedido como pagado.
- Elegir metodo de pago, con efectivo como opcion predeterminada.
- Capturar monto recibido y ver cambio.
- Registrar gastos, retiros, entradas, adelantos y pagos a proveedor.
- Visualizar precorte antes de cerrar.
- Cerrar caja y guardar corte.
- Ver diferencias entre esperado y contado.

Metodos de pago:

- Efectivo.
- Tarjeta.
- Transferencia.
- Otro.

### Ajustes

Ruta: `/admin/settings`

Permite configurar:

- WhatsApp.
- Mensaje de bienvenida.
- Redes sociales.
- Sitio web.
- Tema/template publico.

Si el negocio no configura redes sociales, el menu publico no muestra botones de redes.

## 5. Cliente final

El cliente entra a `/<slug>`.

Puede:

- Ver productos.
- Filtrar categorias.
- Buscar productos si el plan lo permite.
- Ver ingredientes si el plan lo permite.
- Personalizar productos si el plan lo permite.
- Agregar al carrito.
- Capturar sus datos.
- Enviar pedido a WhatsApp.

## 6. Demos locales

Despues de `npm run db:seed`, las demos locales quedan asi:

| Demo | URL | Usuario local |
|---|---|---|
| Lite | `/fonda_lupita` | `demo.lite@<SEED_DEMO_EMAIL_DOMAIN>` |
| Pro | `/taqueria_don_jose` | `demo.pro@<SEED_DEMO_EMAIL_DOMAIN>` |
| Enterprise | `/grupo_nopal` | `demo.enterprise@<SEED_DEMO_EMAIL_DOMAIN>` |
| Marisqueria | `/mariscos_el_faro` | `demo.mariscos@<SEED_DEMO_EMAIL_DOMAIN>` |
| Cafeteria | `/cafe_amanecer` | `demo.cafe@<SEED_DEMO_EMAIL_DOMAIN>` |
| Pizzeria | `/pizza_barrio` | `demo.pizza@<SEED_DEMO_EMAIL_DOMAIN>` |

La clave local demo es la variable `SEED_DEMO_PASSWORD`.

No publiques claves demo reales en repositorios, issues o capturas.

## 7. Temas publicos

El administrador puede elegir un tema desde `/admin/settings`.

Ejemplos:

- Clasico.
- Mercado mexicano.
- Elegante nocturno.
- Taqueria viva.
- Marisqueria fresca.
- Cafeteria urbana.
- Pizzeria familiar.
- Sushi.
- Hamburguesas.
- Antojitos.
- Bar botanero.
- Dark kitchen.
- Polleria.

## 8. Buenas practicas de operacion

- Mantener precios actualizados.
- Marcar productos agotados a tiempo.
- Revisar pedidos antes de prepararlos.
- No depender solo del mensaje de WhatsApp; revisar el panel.
- Cerrar caja diario si se usa el modulo de caja.
- No compartir usuarios admin entre varias personas.
- Cambiar contrasenas cuando alguien deja de trabajar en el negocio.

## 9. Preguntas frecuentes

### Puedo usarlo si ya tengo punto de venta?

Si. Caja y cocina son modulos opcionales. El restaurante puede usar Capi solo para menu y pedidos.

### Puedo tener varios restaurantes?

Si. El super administrador crea un `Tenant` por restaurante.

### Puedo cambiar de Lite a Pro?

Si, pero solo el super administrador debe hacerlo desde `/admin/tenants`.

### Puedo ocultar redes sociales?

Si. Si no configuras redes en ajustes, no se muestran botones.

### Los datos demo se reinician?

Si. Los tenants demo tienen configuracion de reinicio automatico y tambien pueden reiniciarse manualmente.

## 10. Tickets de venta y producción

Capi permite imprimir tickets desde el panel administrador usando el navegador.

### Ticket de venta

Se usa para caja o comprobante del cliente.

Incluye:

- Nombre del negocio.
- Número de pedido.
- Fecha y hora.
- Cliente y teléfono si existen.
- Tipo de servicio: mesa, mostrador, recoger o domicilio.
- Productos, cantidades, extras y notas.
- Subtotal y total.
- Estado de pago.
- Mensaje de agradecimiento.
- Mensaje de propina.
- WiFi si está configurado.
- Redes sociales si están activadas.

Se puede abrir desde:

- `/admin/orders`
- `/admin/cash`

### Ticket de producción

Se usa cuando no hay monitor de cocina o cuando cocina/barra necesitan papel.

Incluye:

- Número de pedido.
- Cliente.
- Tipo de servicio.
- Mesa o referencia.
- Notas del cliente.
- Productos filtrados por área.
- Modificadores, rellenos y notas por producto.

Se puede abrir desde:

- `/admin/orders`
- `/admin/kitchen`

### Configuración

Ruta: `/admin/settings`

El restaurante puede configurar:

- Ancho de ticket: 80mm o 58mm.
- Mensaje de agradecimiento.
- Mensaje de producción.
- Mensaje de propina.
- Nombre y clave de WiFi.
- Mostrar u ocultar redes sociales.

### Ruteo por categoría

Ruta: `/admin/categories`

Cada categoría puede asignarse a:

- General.
- Cocina.
- Barra.
- Caja.

Ejemplo:

| Categoría | Área sugerida |
|---|---|
| Tacos | Cocina |
| Hamburguesas | Cocina |
| Bebidas | Barra |
| Postres | Cocina |
| Promociones de caja | Caja |

### Impresoras térmicas

La primera versión imprime usando el navegador. Esto funciona con impresoras USB, Bluetooth o red siempre que el equipo del restaurante ya pueda imprimir desde Windows, macOS, Linux, Android o iPad.

Para impresión automática directa tipo ESC/POS se recomienda una segunda fase con un puente local instalado en el restaurante.

## 11. Cola de impresión automática

Ruta: `/admin/print`

Esta pantalla muestra los trabajos de impresión preparados para una app local de impresión.

### Cuándo se generan trabajos

- Al entrar un pedido nuevo, Capi genera tickets de producción por área según las categorías del pedido.
- Al marcar un pedido como pagado, Capi genera ticket de venta para caja.

### Estados

| Estado | Significado |
|---|---|
| Pendiente | El ticket está esperando ser tomado. |
| Tomado por puente | La app local ya lo consultó. |
| Impreso | La app local confirmó impresión. |
| Falló | La app local reportó error. |
| Cancelado | Trabajo descartado manualmente o por regla futura. |

### Áreas

Las áreas vienen de `/admin/categories`:

- General.
- Cocina.
- Barra.
- Caja.

### Conexión futura con impresoras

La app local del restaurante consultará:

```text
GET /api/print/jobs?tenantSlug=mi_negocio&area=COCINA
Authorization: Bearer TU_PRINT_BRIDGE_TOKEN
```

Después de imprimir, reportará:

```text
POST /api/print/jobs
Authorization: Bearer TU_PRINT_BRIDGE_TOKEN

{
  "jobId": "id_del_trabajo",
  "status": "PRINTED"
}
```

Si falla:

```text
{
  "jobId": "id_del_trabajo",
  "status": "FAILED",
  "error": "Impresora sin papel"
}
```

## 12. Puente local de impresion silenciosa

Ruta del codigo: `tools/capi-print-bridge`

Esta app local sirve para restaurantes que quieren imprimir automaticamente sin abrir el navegador ni presionar el boton de imprimir.

### Que necesita el restaurante

- Una computadora encendida en el negocio.
- Impresoras instaladas en el sistema operativo.
- Internet estable.
- El archivo `config.json` con el restaurante, token y nombres de impresoras.

### Configuracion basica

1. Entrar a `tools/capi-print-bridge`.
2. Copiar `config.example.json` como `config.json`.
3. Configurar:

| Campo | Que significa |
| --- | --- |
| `appUrl` | URL del SaaS, normalmente `https://capi.nohmendez.xyz`. |
| `tenantSlug` | Slug del restaurante, por ejemplo `capibara`. |
| `token` | Token privado de impresion. |
| `pollEveryMs` | Cada cuantos milisegundos revisa pedidos nuevos. |
| `printerName` | Nombre de la impresora instalada. Vacio usa predeterminada. |
| `copies` | Cantidad de copias. |

### Flujo diario

1. El cliente realiza un pedido.
2. Capi genera tickets pendientes.
3. El puente local detecta el trabajo.
4. La impresora de cocina/barra/caja imprime en silencio.
5. El puente confirma si imprimio o si fallo.

### Tickets de venta

Al cobrar en efectivo, caja puede capturar el monto recibido. El ticket muestra:

- Total.
- Total en letras.
- Monto recibido.
- Cambio.

### Botones manuales

Aunque exista puente local, los botones manuales de ticket siguen disponibles como respaldo por si se acaba el papel, se desconecta la impresora o se necesita reimprimir.

## 13. Mesas, meseros y precuenta

Rutas:

| Ruta | Uso |
| --- | --- |
| `/admin/mesas` | Ver mapa operativo de mesas. |
| `/admin/meseros` | Ver personal con rol de mesero. |
| `/admin/caja` | Alias en español para caja. |
| `/admin/impresion` | Alias en español para impresión. |

### Límites por plan

| Plan | Meseros | Mesas | Cajas | Estaciones de impresión |
| --- | ---: | ---: | ---: | ---: |
| Lite | 2 | 10 | 1 | 3 |
| Pro | 8 | 35 | 3 | 6 |
| Enterprise | 30 | 120 | 8 | 12 |

### Flujo recomendado con meseros

1. El mesero levanta el pedido en mesa.
2. El pedido se envía a cocina.
3. Cocina imprime o visualiza sólo productos nuevos.
4. Cuando el cliente pide cuenta, se imprime precuenta.
5. La cuenta queda marcada como `Precuenta impresa; esperando cobro`.
6. Caja cobra y genera ticket final.
7. Si se necesita reabrir la cuenta, se hace desde caja con motivo.

### Precuenta vs ticket final

| Documento | Cuándo se usa |
| --- | --- |
| Precuenta | Antes de cobrar, para que el cliente revise su consumo. |
| Ticket final | Después de cobrar, con método de pago, recibido y cambio si aplica. |

## 14. Configuración de impresoras por estación

Ruta: `/admin/impresion`

El restaurante puede crear estaciones como:

- Caja principal.
- Cocina caliente.
- Barra de bebidas.
- Impresora general.
- Bar.
- Repostería.

Ruta: `/admin/categorias`

Cada categoría puede enviarse a una estación. Ejemplos:

| Categoría | Estación |
| --- | --- |
| Tacos | Cocina caliente |
| Tortas | Cocina caliente |
| Refrescos | Barra de bebidas |
| Cafés | Barra de bebidas |
| Ticket de venta | Caja principal |

Si el negocio tiene una sola impresora, puede usar el mismo nombre de impresora física en varias estaciones. Cuando compre más hardware, sólo cambia la estación desde el panel.

## 15. Datos demo enriquecidos

Al correr `npm run db:seed`, las demos quedan listas para enseñar y vender:

- Productos mexicanos por giro.
- Ingredientes y modificadores.
- Mesas y meseros.
- Cajas y turnos abiertos.
- Estaciones de impresión.
- Pedidos de dos meses.
- Pedidos cancelados, pendientes, listos y pagados.
- Propinas, cambios y referencias.
- Precuentas y cuentas por cobrar.
- Cortes históricos.

Los tenants demo se reinician automáticamente según su configuración, normalmente cada 5 días, o manualmente desde el panel del super administrador.
