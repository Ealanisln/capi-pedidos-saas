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

- Ver cobros del dia.
- Marcar pedido como pagado.
- Elegir metodo de pago.
- Registrar corte de caja.
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
