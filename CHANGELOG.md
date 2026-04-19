# Changelog

## v0.097 - Caja operativa, comandero y demos enriquecidos

- Límites reales por plan para cajas, meseros, mesas y estaciones de impresión.
- Nuevos modelos operativos: cajas, turnos de caja, movimientos, pagos, mesas y estaciones de impresión.
- Panel de caja con apertura, precorte, entradas/salidas, cobro, propinas, cambio y cierre.
- Flujo de precuenta con bloqueo de cuenta esperando cobro y reapertura controlada desde caja.
- Nuevas rutas en español México: `/admin/caja`, `/admin/mesas`, `/admin/meseros`, `/admin/impresion`, `/admin/categorias`, `/admin/productos`, `/admin/pedidos` y `/admin/configuracion`.
- Configuración de estaciones de impresión por cocina, barra, caja o general.
- Categorías pueden asignarse a una estación específica para imprimir producción en el lugar correcto.
- Seeds demo con mesas, meseros, cajas, estaciones, dos meses de ventas, pagos, propinas, precuentas y movimientos.
- Documentación técnica, README y manual de uso actualizados para colaboradores y agentes de IA.
## v0.096 - Puente local de impresion y tickets de caja

- App local `Capi Print Bridge` basada en Electron para impresion silenciosa por caja, cocina, barra y general.
- Ruta protegida para HTML de tickets del puente local sin iniciar sesion de administrador.
- API de cola ahora devuelve `ticketHtmlUrl` para imprimir desde el puente.
- Tickets de venta con total en letras, monto recibido y cambio.
- Caja permite capturar monto recibido en pagos en efectivo.
- Correccion de botones duplicados de tickets en cocina y caja.
- Revision de textos visibles para mantenerlos en espanol Mexico.
## v0.095 - Cola de impresion y puente local

- Cola de trabajos de impresion por restaurante para tickets de venta y produccion.
- API protegida `/api/print/jobs` para que un puente local consulte, tome y confirme trabajos.
- Pantalla administrativa `/admin/print` para revisar trabajos pendientes, impresos, fallidos y cancelados.
- Generacion automatica de trabajos de produccion al recibir un pedido nuevo.
- Generacion automatica de ticket de venta cuando caja marca un pedido como pagado.
- Preparacion para conectar impresoras termicas por area: cocina, barra y caja.
- Documentacion tecnica y manual de uso actualizados con el flujo de impresion automatica.
## v0.094 - Tickets térmicos de venta y producción

- Tickets imprimibles por pedido desde el panel administrador.
- Ticket de venta con datos del cliente, tipo de pedido, productos, totales, pago, WiFi, propina, redes sociales y mensaje de agradecimiento.
- Ticket de producción para cocina/barra con datos del cliente, tipo de pedido, notas y productos filtrados por área.
- Configuración de ancho 80mm o 58mm desde Ajustes.
- Configuración de mensajes de ticket desde Ajustes.
- Configuración para mostrar u ocultar redes sociales en ticket de venta.
- Ruteo de categorías por área de impresión: General, Cocina, Barra o Caja.
- Botones de impresión en Pedidos, Cocina y Caja.
- Base preparada para una segunda fase con puente local ESC/POS para impresión automática.
## v0.093 - Documentación enriquecida y demos con acceso automático

- README enriquecido para GitHub con iconos, tablas, diagramas y guía para principiantes.
- Nuevas imágenes SVG para arquitectura, flujo de pedido y trabajo con agentes IA.
- Nueva guía para vibecoding responsable.
- Nueva guía para conectar Claude, Codex, Gemini, Copilot y otros agentes.
- Archivos de contexto para `CODEX.md`, `GEMINI.md`, `CLAUDE.md` y Copilot.
- Acceso automático a paneles demo desde links `/admin/login?demo=...`.
- Proveedor NextAuth `demo` limitado a tenants marcados como demo y activos.
- Login demo sin publicar ni autocompletar contraseñas.
## v0.092 - Publicacion inicial

- Publicacion inicial del proyecto Capi Pedidos SaaS.
- Landing comercial para planes Lite, Pro y Enterprise.
- Panel administrativo multi-tenant.
- Menus publicos por negocio.
- Pedidos por WhatsApp.
- Monitor de cocina y caja diaria opcional.
- Seeds demo realistas para negocios de comida en Mexico.
- Documentacion tecnica, manual de uso, guia de contribucion y seguridad.
- Sanitizacion de credenciales para repositorio publico.

## v0.098

- Se agrego modulo Admin > Reportes para crear y revocar tokens de ventas.
- Se agrego endpoint CSV/JSON para Excel, PowerBI e integraciones externas.
- Se agregaron logs de auditoria de exportaciones.
- Se documentaron About de GitHub, ramas, colaboracion, licencia, impresion local y reportes.
- Se limpiaron caracteres problematicos en seeds y separadores visuales que podian romperse en tickets.
- Se agregaron templates de issues y pull requests para colaboracion publica.
