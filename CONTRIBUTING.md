# Como colaborar en Capi Pedidos SaaS

Gracias por querer ayudar. Capi nacio para apoyar negocios reales de comida en Quintana Roo y puede crecer mucho con colaboracion bien ordenada.

## Antes de empezar

Lee estos archivos:

| Archivo | Por que importa |
|---|---|
| README.md | Vision general y demo publica. |
| docs/DOCUMENTACION_TECNICA.md | Arquitectura y modelos. |
| docs/MANUAL_DE_USO.md | Como lo usara un restaurante. |
| SECURITY.md | Reglas para no exponer datos. |
| LICENSE | Alcance de uso y derechos reservados. |

## Convencion de branches

Usa nombres claros, en minusculas y sin espacios.

| Tipo | Ejemplo | Cuando usarlo |
|---|---|---|
| feat | feat/caja-pago-mixto | Nueva funcionalidad. |
| fix | fix/ticket-cambio-efectivo | Correccion de bug. |
| docs | docs/manual-impresion | Documentacion. |
| chore | chore/actualizar-dependencias | Mantenimiento. |
| refactor | refactor/reportes-api | Cambio interno sin nueva funcion. |
| hotfix | hotfix/login-produccion | Arreglo urgente. |
| codex | codex/reportes-powerbi | Trabajo generado con Codex. |

## Flujo recomendado

1. Crea un issue o comenta que vas a trabajar.
2. Crea branch desde `main`.
3. Haz cambios pequenos.
4. Ejecuta `npm run lint`.
5. Ejecuta `npm run build`.
6. Si cambias Prisma, ejecuta `npx prisma db push` en tu entorno local y actualiza seed si aplica.
7. Abre Pull Request con descripcion clara.

## Reglas importantes

- No subir `.env`.
- No publicar tokens, passwords, URLs privadas de bases de datos ni capturas con secretos.
- Mantener textos visibles en espa?ol Mexico.
- Respetar multi-tenant: toda consulta sensible debe filtrar por `tenantId`.
- No cambiar planes comerciales sin explicarlo.
- No romper demos: deben seguir sirviendo para vender y probar.
- Si agregas pantalla nueva, documentala.
- Si agregas API nueva, explica seguridad y ejemplo.

## Checklist de Pull Request

- [ ] Explique que problema resuelve.
- [ ] Agregue capturas si cambia UI.
- [ ] Actualice documentacion si cambio comportamiento.
- [ ] Verifique `npm run lint`.
- [ ] Verifique `npm run build`.
- [ ] No agregue credenciales reales.
- [ ] Revise que el cambio respeta `tenantId`.

## Para vibecoders

Si usas Claude, Codex, Gemini, Cursor, Windsurf o Antigravity, dale este contexto al agente:

```text
Estoy colaborando en Capi Pedidos SaaS.
Lee README.md, CONTRIBUTING.md, docs/DOCUMENTACION_TECNICA.md y docs/MANUAL_DE_USO.md.
No subas secretos.
Mant?n UI en espa?ol Mexico.
No mezcles cambios no relacionados.
Ejecuta lint/build y resume archivos cambiados.
```
