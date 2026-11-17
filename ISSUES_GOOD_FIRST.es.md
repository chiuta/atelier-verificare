# Buenas primeras tareas

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · **Español** · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Añadir una comprobación de metadatos PDF que funcione sin conexión (diccionario Info, XMP, productor, fechas de creación y modificación, actualizaciones incrementales)
- [ ] Sustituir el barrido byte a byte del bloque Exif en HEIC y AVIF por una búsqueda correcta de elementos ISO BMFF (`iinf`, `iloc`) y añadir pruebas
- [ ] Añadir una consulta RDAP de la antigüedad de un dominio como comprobación de red claramente etiquetada (declarar cada host en el descriptor y en `connect`, y documentar qué se envía)
- [ ] Validar las firmas C2PA con Web Crypto (COSE_Sign1 y cadena de certificados), probadas con los archivos de muestra públicos de c2pa-rs
- [ ] Añadir enlaces `geo:` y OpenStreetMap para la posición GPS del hallazgo EXIF (se abren solo al hacer clic el usuario)
- [ ] Mejorar el mapa del nivel de error: varios niveles de calidad y un control de amplificación, con pruebas sobre imágenes generadas
- [ ] Añadir una comprobación sin conexión de metadatos de audio (ID3, etiquetas MP4, comentarios Vorbis)
- [ ] Añadir una ayuda que recodifique una imagen sin EXIF, XMP ni IPTC para que la persona guarde una copia limpia antes de publicar
- [ ] Revisar las traducciones de la interfaz escritas automáticamente (fr, de, es, it, pt, hu) y corregir lo que un hablante nativo no diría
- [ ] Investigar una ayuda opcional, alojada por el usuario, que siga cadenas de redirecciones (una página web no puede) y abrir un issue con el diseño antes de escribir código

Créalas todas en GitHub con `scripts/create_issues.sh` (requiere la CLI `gh`).
