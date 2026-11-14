# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versión: 0.1.0 · Última actualización: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Kit de verificación local para periodistas: procedencia de imágenes, metadatos, enlaces y dominios.

Trade-free: sin rastreo, sin anuncios, sin cuentas, funciona sin conexión.

## Estado

Alfa: el repositorio contiene la estructura, el esquema de datos o los primeros ejemplos y las guías de contribución. El alcance de abajo es el plan, no lo que funciona hoy.

## Alcance previsto

- Una API de comprobaciones común (entradas, salidas, niveles de estado) para que cada comprobación informe igual.
- Comprobaciones de imágenes: un analizador EXIF completo (GPS, cámara, software, marcas de tiempo), una comprobación sin conexión y de solo lectura del manifiesto C2PA y análisis de nivel de error para JPEG.
- Comprobaciones de enlaces y dominios: enlaces rotos y cadenas de redirecciones para una lista de URL, y un resumen DNS/TLS mediante DoH público sin WHOIS.
- Un extractor de fotogramas clave de vídeo (canvas, sin conexión) y una ayuda «guardar en Internet Archive», iniciada por la persona usuaria y claramente etiquetada.
- Un informe de verificación imprimible (PDF/Markdown) y una nota ética sobre lo que estas herramientas no pueden demostrar.

Nada de esto está implementado todavía: cada punto es una tarea preparada en `ISSUES_GOOD_FIRST.md`.

## Contribuye en 5 minutos

1. Haz un fork de este repositorio.
2. Copia `data/checks/example.json` en `data/checks/` y edítalo.
3. Ejecuta `python scripts/validate.py`.
4. Abre un pull request: para los datos no hace falta programar.

## Buenas primeras tareas

Consulta `ISSUES_GOOD_FIRST.md` para tareas ya preparadas.

## Licencia

Código: MIT. Datos aportados: indica la fuente; se publican con la misma licencia salvo que el archivo diga otra cosa.

## Apoyo

Si el proyecto te resulta útil, puedes [invitarme a un café](https://buymeacoffee.com/echo.of.the.strings).
