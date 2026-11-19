# Registro de cambios

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · [Français](CHANGELOG.fr.md) · [Italiano](CHANGELOG.it.md) · **Español** · [Português](CHANGELOG.pt.md) · [Deutsch](CHANGELOG.de.md) · [Magyar](CHANGELOG.hu.md)

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Sin publicar]

## [0.2.1] - 2026-11-20

### Cambiado
- fff-kit 1.8.1: cuando el navegador bloquea el almacenamiento o carece de él (`localStorage`/`sessionStorage` lanzan un error o no existen), la página arranca con un almacenamiento temporal en memoria en lugar de detenerse; los datos no se conservan al cerrar la página.
- fff-kit 1.8.1: la guía que amplía los controles pequeños a 44 px mide ahora también el ancho del cuerpo de la página y del elemento padre, de modo que una fila de botones ya no puede salirse de la pantalla (el grupo se deja intacto cuando la ampliación lo haría demasiado ancho).

## [0.2.0] - 2026-11-17

### Añadido
- Once comprobaciones funcionales: estructura del archivo con SHA-256, inspector EXIF, otros metadatos incrustados (XMP, IPTC, texto PNG), lector de Content Credentials (C2PA), análisis del nivel de error para JPEG, metadatos de vídeo, fotogramas clave de vídeo, anatomía de enlaces, higiene del texto, resumen DNS y consulta a Internet Archive (las dos últimas solo a petición, tras el consentimiento).
- Una API común de comprobaciones (`docs/check-api.md`): hallazgos codificados con cuatro niveles, un descriptor y un plugin por comprobación, y una red y un canvas simulados para las pruebas.
- Vista del caso: añade archivos, enlaces, dominios y texto arrastrando, con el selector de archivos o pegando; ejecuta las comprobaciones por elemento o todas a la vez; un informe en Markdown, JSON o impresión/PDF con la fecha, cada SHA-256 y los límites; una sección sobre límites y ética (`docs/ethics.md`).
- Interfaz en ocho idiomas (291 textos cada una, comprobados para las mismas claves y marcadores), temas oscuro y claro, compatibilidad con teclado y lectores de pantalla, diseño móvil.
- La Content-Security-Policy enumera exactamente los tres hosts que usan las comprobaciones de red (`connect` en `src/app.json`); las comprobaciones de red permanecen desactivadas hasta que la persona marque una casilla de consentimiento.
- Pruebas: `node --test` para analizadores, plugins, traducciones y el contrato descriptores/CSP; pruebas de navegador en el hub (todos los idiomas, accesibilidad, archivos hostiles, red simulada).
- `src/`, `checks/` y `scripts/build.mjs`: el único `index.html` se construye ahora a partir de las fuentes, y `--check` lo verifica.
- ISSUES_GOOD_FIRST y CODE_OF_CONDUCT traducidos a los ocho idiomas.
- README en inglés, rumano, francés, italiano, español, portugués, alemán y húngaro: secciones de estado y de alcance previsto (derivadas de `ISSUES_GOOD_FIRST.md`).
- Instalable (PWA): `manifest.webmanifest`, `sw.js` y los iconos los genera el kit común (`fff-kit/pwa`); la página funciona sin conexión tras la primera visita por HTTPS.

### Cambiado
- `data/checks/example.json` es ahora el descriptor plantilla, y `docs/examples/my-check.js` el plugin plantilla correspondiente.
- `schema.json`: `input` acepta `file`, `image`, `video`, `url`, `domain` y `text` (solos o en lista), y `network` enumera los hosts de una comprobación que no es sin conexión.
- `scripts/validate.py` comprueba además que cada descriptor tenga su plugin, que el `id` coincida con el nombre del archivo y que cada host de red esté declarado en `src/app.json`.
- El workflow se ejecuta en Ubuntu 26.04 con Node.js 26 y ejecuta también las pruebas y la comprobación de la compilación.

## [0.1.0] - 2026-11-13

### Añadido
- Esqueleto inicial: estructura, esquema de datos o primeros ejemplos, guías de contribución en ocho idiomas.
