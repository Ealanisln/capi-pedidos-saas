# Capi Print Bridge

App local para imprimir tickets de Capi en tiempo real y de forma silenciosa.

## Que hace

- Consulta la API `/api/print/jobs` cada pocos segundos.
- Detecta trabajos pendientes por area: caja, cocina, barra o general.
- Descarga el HTML protegido de cada ticket.
- Imprime en silencio usando Electron `webContents.print({ silent: true })`.
- Reporta a Capi si el ticket se imprimio o fallo.

## Instalacion local

1. Copia `config.example.json` como `config.json`.
2. Configura:
   - `appUrl`: `https://capi.nohmendez.xyz`
   - `tenantSlug`: el slug del restaurante.
   - `token`: el valor privado de `PRINT_BRIDGE_TOKEN`.
   - `printerName`: nombre exacto de la impresora en Windows, macOS o Linux. Si se deja vacio usa la predeterminada.
3. Instala dependencias:

```bash
npm install
```

4. Ejecuta:

```bash
npm start
```

## Recomendacion operativa

- Caja: impresora en mostrador.
- Cocina: impresora termica cerca de cocina.
- Barra: impresora termica para bebidas.
- Si un restaurante solo tiene una impresora, deja `printerName` vacio en todas las areas para usar la predeterminada.

## Seguridad

No publiques `config.json`. Contiene el token privado del puente de impresion.
