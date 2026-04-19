# CONTRIBUTING

Gracias por querer mejorar Capi Pedidos SaaS. Este proyecto busca ser una base colaborativa para menus digitales, pedidos por WhatsApp y operacion restaurantera en Mexico y Latinoamerica.

## Antes de empezar

- No subas credenciales, `.env`, tokens, conexiones de base de datos ni datos reales de clientes.
- Usa datos ficticios en seeds, pruebas, capturas y documentacion.
- Si encuentras una vulnerabilidad, no abras un issue publico con el detalle explotable. Lee `SECURITY.md`.

## Flujo recomendado

1. Haz fork del repositorio.
2. Crea una rama:

```bash
git checkout -b mejora/nombre-del-cambio
```

3. Instala dependencias:

```bash
npm install
```

4. Copia variables:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

5. Corre validaciones:

```bash
npm run lint
npm run build
```

6. Abre Pull Request con:

- Que problema resuelve.
- Que archivos toca.
- Como se probo.
- Capturas si cambia UI.

## Convenciones

- Idioma de UI y documentacion: espanol Mexico.
- Moneda: pesos mexicanos.
- Formato de numeros: `es-MX`.
- Evitar textos en ingles en pantallas visibles al usuario final.
- Mantener multi-tenant: toda consulta operativa debe respetar `tenantId`.
- No asumir que todos los restaurantes quieren usar caja/POS; esos modulos deben ser opcionales.

## Areas donde se agradece ayuda

- Mejoras de UI/UX para menus publicos.
- Accesibilidad y responsive.
- Pruebas automatizadas.
- Seguridad de login, rate limiting y auditoria.
- Inventario, recetas, costos y merma.
- QR por mesa y comandas por area.
- PWA y modo offline parcial.
- Integraciones de pago y facturacion.
