# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versión: 0.2.1 · Última actualización: 2026-11-20

🌐 https://atelier-verificare.chiuta.ro

> Kit de verificación local para periodistas: procedencia de imágenes, metadatos, enlaces y dominios.

Trade-free: sin rastreo, sin anuncios, sin cuentas, funciona sin conexión.

## Estado

Alfa, utilizable: once comprobaciones (nueve sin conexión, dos a petición por la red) funcionan en el único archivo `index.html` (se abre sin conexión, sin servidor). Una comprobación es un descriptor en `data/checks/` más un plugin en `checks/`; lo que estas comprobaciones no pueden demostrar se enumera más abajo.

## Qué hace

- Añade imágenes, vídeos, enlaces, dominios o texto pegado (arrastrar y soltar, selector de archivos, pegar) y ejecuta las comprobaciones sobre cada elemento; no se sube nada.
- Estructura del archivo: el tipo real según el contenido, la discrepancia con la extensión, las dimensiones, los datos añadidos tras el final del archivo, la calidad JPEG estimada, el truncamiento y un SHA-256 para demostrar después que la copia analizada es la recibida.
- Inspector EXIF: cámara, objetivo, software (y si nombra un editor de imágenes), fechas y zona horaria, una modificación posterior a la captura, posición GPS, miniatura incrustada e incoherencias de tamaño, números de serie.
- Otros metadatos incrustados: XMP (herramienta, historial de ediciones, fuente de IA declarada), campos de prensa IPTC, comentarios JPEG y campos de texto PNG que coinciden con la salida de generadores de imágenes con IA.
- Content Credentials (C2PA): lee los manifiestos (quién firmó, con qué, qué acciones, declaraciones sobre IA) en JPEG, PNG, WebP, MP4, MOV, HEIC y AVIF; los lee, pero no valida las firmas.
- Análisis del nivel de error para JPEG, con un mapa que puedes guardar como PNG; metadatos de vídeo (contenedor, fechas, ubicación guardada, firmas de recodificación); fotogramas clave extraídos en local para la búsqueda inversa de imágenes.
- Anatomía de los enlaces (el truco de la `@`, letras parecidas, direcciones IP, acortadores, parámetros de seguimiento) e higiene del texto (caracteres invisibles, controles de dirección del texto, letras parecidas), sin abrir nada.
- Dos comprobaciones opcionales por la red, solo después de marcar una casilla de consentimiento y pulsar su botón: un resumen DNS de dos resolvedores públicos (envía el nombre de dominio a `cloudflare-dns.com` y `dns.google`) y una consulta a Internet Archive (envía la dirección a `archive.org`). Los enlaces para guardar o ver copias archivadas son enlaces normales que abres tú.
- Un informe de todo el caso en Markdown, JSON o impresión/PDF, en el idioma de la interfaz, con la fecha, el SHA-256 de cada archivo, cada hallazgo y los límites del método.
- Interfaz en ocho idiomas, temas oscuro y claro, compatibilidad con teclado y lectores de pantalla, diseño móvil; sin rastreo, sin cuentas.
- Instalable como aplicación y disponible sin conexión tras la primera visita cuando se sirve por HTTPS (un service worker conserva la propia página; las comprobaciones opcionales por la red descritas arriba son las únicas peticiones que hace la página, y el service worker nunca las toca). Abierta desde un archivo descargado funciona igual, sin instalación.

## Cómo funciona

- `node scripts/build.mjs` ensambla el único `index.html` a partir de `src/`: `src/engine.mjs` (analizadores y funciones puras), `checks/*.js` (un plugin por comprobación; API en `docs/check-api.md`), `data/checks/*.json` (descriptores validados por `schema.json`), `src/ui.js`, `src/app.css` y `src/i18n.mjs`; `--check` verifica que la página coincida con las fuentes.
- Una comprobación devuelve hallazgos codificados (`{code, level, args}`), nunca frases: la interfaz los convierte al idioma del lector, así que añadir un idioma o corregir una frase no toca nunca los analizadores.
- Los archivos se leen en el navegador (File API) y no salen nunca del dispositivo. Solo el título y las notas del caso se guardan en el almacenamiento local del navegador; los elementos y los resultados desaparecen al recargar la página.
- La Content-Security-Policy solo permite peticiones de red a los hosts que declaran los descriptores (`archive.org`, `cloudflare-dns.com`, `dns.google`). La interfaz añade la puerta del consentimiento, sin credenciales, sin referrer y con un tiempo límite de 10 s, y un plugin no puede llamar a `fetch` por sí mismo.
- `npm test` ejecuta los analizadores sobre fixtures generados (JPEG, PNG, WebP, MP4, WebM, almacenes C2PA), los plugins con red y canvas simulados, las traducciones en los ocho idiomas y el contrato descriptores/CSP; las pruebas de navegador del hub ejercitan toda la página. El desarrollo requiere Node.js 24 o posterior; la página solo necesita un navegador con ES2017.
- `manifest.webmanifest`, `sw.js` y los iconos los produce `node scripts/build.mjs` mediante el kit común (sección `pwa` de `src/app.json`); `--check` también los verifica, y `npm test` comprueba que el manifiesto, la versión del service worker y la CSP coincidan con la página.

## Lo que esta herramienta no puede decirte

- No puede demostrar que una imagen o un vídeo sea auténtico. Solo muestra indicios que respaldan o contradicen una afirmación.
- Los metadatos (EXIF, XMP, IPTC) se borran, copian y falsifican con facilidad. Su ausencia dice poco; su presencia es una pista, no una prueba. Las redes sociales y las aplicaciones de mensajería eliminan la mayoría.
- Los Content Credentials (C2PA) se leen, no se validan: la firma, la cadena de certificados y el hash del contenido no se comprueban aquí. Para eso usa un verificador oficial.
- El análisis de nivel de error es un indicio: también ilumina bordes nítidos, zonas saturadas e imágenes guardadas varias veces. Los especialistas lo leen junto con otras pruebas.
- La comprobación de enlaces trabaja solo con el texto de la dirección. Una página web no puede seguir redirecciones, leer certificados TLS ni abrir la página de destino, así que no puede decir si un sitio es fiable.
- Las consultas DNS muestran lo que responden ahora dos resolutores públicos. No dan la fecha de registro ni el titular de un dominio.
- La búsqueda en Internet Archive solo dice si existe una copia y qué estado tenía; la ausencia de copia no prueba nada.
- La detección de imágenes generadas por IA a partir de metadatos solo encuentra rastros declarados o residuales. Un archivo limpio puede ser sintético, y uno marcado puede ser una foto real retocada con una herramienta de IA.
- La interfaz existe en ocho idiomas; las traducciones se escribieron con ayuda automática y no las han revisado hablantes nativos. Los textos en rumano e inglés son la referencia.

## Contribuye en 5 minutos

1. Haz un fork de este repositorio.
2. Copia `data/checks/example.json` en `data/checks/<id>.json` y edítalo (esquema en `schema.json`), luego ejecuta `python scripts/validate.py`.
3. Escribe `checks/<id>.js` (consulta `docs/check-api.md`): un módulo ES que exporta `async function run(input, ctx)` y devuelve hallazgos codificados.
4. Añade los textos de la comprobación y de cada código de hallazgo en los ocho idiomas en `src/i18n.mjs`.
5. Escribe pruebas en `test/`, ejecuta `npm test` y `node scripts/build.mjs`, y abre un pull request.

## Buenas primeras tareas

Consulta `ISSUES_GOOD_FIRST.md` para tareas ya preparadas.

## Licencia

Código: MIT. Datos aportados: indica la fuente; se publican con la misma licencia salvo que el archivo diga otra cosa.

## Apoyo

Si el proyecto te resulta útil, puedes [invitarme a un café](https://buymeacoffee.com/echo.of.the.strings).
