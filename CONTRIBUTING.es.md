# Cómo contribuir — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · **Español** · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Versión: 0.2.1 · Última actualización: 2026-11-20

1. Haz un fork de este repositorio.
2. Copia `data/checks/example.json` en `data/checks/<id>.json` y edítalo (esquema en `schema.json`), luego ejecuta `python scripts/validate.py`.
3. Escribe `checks/<id>.js` (consulta `docs/check-api.md`): un módulo ES que exporta `async function run(input, ctx)` y devuelve hallazgos codificados.
4. Añade los textos de la comprobación y de cada código de hallazgo en los ocho idiomas en `src/i18n.mjs`.
5. Escribe pruebas en `test/`, ejecuta `npm test` y `node scripts/build.mjs`, y abre un pull request.

## Reglas

- Una comprobación = un descriptor (`data/checks/<id>.json`) + un plugin (`checks/<id>.js`) + pruebas.
- Cita siempre una fuente.
- Aporta solo material que puedas compartir legalmente (sin texto protegido copiado).
- Sé amable: consulta el Código de conducta.

## Añadir una comprobación

1. Añade `data/checks/<id>.json` (parte de `data/checks/example.json`; esquema en `schema.json`) y ejecuta `python scripts/validate.py`. El `id`, el nombre del archivo y el nombre del plugin deben coincidir.
2. Escribe `checks/<id>.js` como módulo ES (sintaxis ES2017, sin imports) que exporta `async function run(input, ctx)` y devuelve `ctx.lib.result(findings, data, artifacts)`. Cada hallazgo es `ctx.lib.finding(code, level, args)`, con `level` entre `ok`, `info`, `warn` o `fail` y `args` una lista de cadenas o números. No pongas nunca frases en un hallazgo: el código es el mensaje (consulta `docs/check-api.md`).
3. Añade los textos a `src/i18n.mjs` en los ocho idiomas: `c_<id>_name`, `c_<id>_desc` y `f_<código con los puntos cambiados por guiones bajos>` para cada código. `npm test` falla si a un idioma le falta una clave o si un código no tiene texto.
4. Una comprobación que necesita la red pone `"offline": false` y enumera cada host en `"network"`; añade los mismos orígenes a `connect` en `src/app.json`, llama solo a `ctx.net.json(url)` y di en la descripción qué se envía. Prefiere una comprobación que funcione sin conexión: un host nuevo necesita una razón en el pull request.
5. Escribe pruebas en `test/` con muestras generadas o de dominio público (nunca fotos de personas reales) y ejecuta `npm test`.
6. Ejecuta `node scripts/build.mjs` y haz commit de `index.html`, `sw.js` y `app.json` regenerados junto con `src/`.
