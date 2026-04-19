# ANALISIS DE REFERENCIAS - MENUS INTERACTIVOS (ABRIL 2026)

## Objetivo
Tomar referencias reales de plataformas de menu interactivo y convertirlas en mejoras concretas para Capi Pedidos SaaS.

## Sitios analizados
1. Square Online Ordering
- URL: https://squareup.com/us/en/online-store
- Aporte observado: gestion de catalogo digital, venta online con enfoque de conversion y operacion simple.

2. Toast (ecosistema de pedidos digitales)
- URL: https://pos.toasttab.com/
- Aporte observado: enfoque fuerte en flujo de pedidos, operacion en restaurante y experiencia omnicanal.

3. BentoBox (web + ordering para restaurantes)
- URL: https://www.getbento.com/
- Aporte observado: importancia de marca visual del restaurante, diseno y conversion desde sitio propio.

4. GloriaFood (online ordering para restaurantes)
- URL: https://www.gloriafood.com/
- Aporte observado: menu digital rapido de publicar, control de pedidos y administracion sencilla.

5. SmartNet Company
- URL: https://www.smartnetcompany.com/
- Aporte observado: opera como sistema integral para restaurantes, con punto de venta, admin web, monitoreo movil, lealtad, control de cocina, call center, facturacion, inventarios y reportes en tiempo real.

6. Soft Restaurant
- URL: https://softrestaurant.com/
- Aporte observado: referencia fuerte en Mexico para punto de venta restaurantero, mesas, comandas, caja, inventarios, facturacion y operacion local.

7. ComandaIA
- URL: https://comandaia.com/
- Aporte observado: captura de pedidos, comandas de cocina con letra grande, folios, caja, reportes, clientes/direcciones, reparto y automatizacion por WhatsApp.

8. Fudo / Waitry / OlaClick / Poster POS
- Aporte observado: el mercado latinoamericano empuja una mezcla de POS, QR, pedidos, cocina, caja, reportes, delivery y CRM simple.

## Hallazgos clave
- Los menus exitosos priorizan velocidad de compra, no solo catalogo.
- La marca visual del restaurante importa para conversion (tipografias, color, fotos).
- La administracion debe ser simple para personal no tecnico.
- Personalizacion de productos (modificadores) aumenta ticket promedio.
- Analitica operativa visible en admin ayuda a tomar decisiones del dia.
- Los sistemas mas valiosos conectan pedido -> cocina -> caja -> reporte.
- El dueno necesita ver venta, cobro pendiente, tiempos de cocina y productos vendidos sin estar en el local.
- Los restaurantes que ya tienen POS necesitan modulos opcionales, no un sistema que los obligue a migrar todo.

## Mejoras aterrizadas a Capi (ya aplicadas)
1. Plantillas publicas elegibles desde admin (`CLASICO`, `MERCADO`, `ELEGANTE`).
2. Diferencias visibles por plan para no vender humo.
3. Ingredientes y modificadores mas obvios en la experiencia cliente.
4. Analytics en admin de pedidos para Pro/Enterprise.
5. Seed de demos enriquecido con ejemplos de comida mexicana.
6. Monitor de cocina conectado a pedidos (`/admin/kitchen`).
7. Caja diaria opcional con estado de cobro y metodo de pago (`/admin/cash`).
8. Tipo de servicio por pedido: mesa, mostrador, recoger o domicilio.
9. Demos con 60 dias de ventas, cancelaciones, caja y cortes.
10. Reinicio automatico de demos por Vercel Cron y control manual desde super admin.

## Plan tipo SoftRestaurant / SmartNet adaptado a Capi
### Nivel 1: Operacion conectada
- Pedido publico o admin.
- Monitor de cocina.
- Caja diaria opcional.
- Estados de pedido y pago.
- Reporte de ventas basico.

### Nivel 2: Restaurante con salon
- QR por mesa.
- Boton llamar mesero.
- Mesas abiertas.
- Separar cuenta o juntar cuentas.
- Comandas por area: cocina, bar, postres.

### Nivel 3: Control administrativo
- Inventario por insumo.
- Recetas/costos.
- Merma.
- Compras/proveedores.
- Margen por producto.

### Nivel 4: Crecimiento
- CRM.
- Lealtad.
- Cupones.
- Recordatorios por WhatsApp.
- Reseñas Google.
- Multi-sucursal y tablero del dueno.

## Mejoras recomendadas (siguiente sprint)
1. Galeria multiple por producto (no solo una imagen).
2. Favoritos del cliente en navegador.
3. Modo oscuro opcional por tenant.
4. PWA instalable para acceso rapido desde celular.
5. Cupones/promociones por horario.
6. Etiquetas comerciales por producto (nuevo, recomendado, promo).
7. Tablero de conversion (visitas -> carrito -> pedido).
8. Pagos de suscripcion con Stripe para upgrades automáticos.
9. QR por mesa con link `/<slug>?mesa=4`.
10. Areas de preparacion para separar cocina/bar/postres.
11. Corte de caja con ingresos/retiros.
12. Inventario ligero por insumo y receta.
