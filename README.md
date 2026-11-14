# Atelier de verificare

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Version: 0.1.0 · Last updated: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> A local-first verification toolkit for journalists: image provenance, metadata, links and domains.

Trade-free: no tracking, no ads, no accounts, works offline.

## Status

Alpha: the repository holds the structure, the data schema or the first examples and the contribution guides. The scope below is the plan, not what works today.

## Planned scope

- A common check API (inputs, outputs, status levels) so every check reports the same way.
- Image checks: a proper EXIF parser (GPS, camera, software, timestamps), an offline read-only C2PA manifest check and error-level analysis for JPEG.
- Link and domain checks: link rot and redirect chains for a URL list, and a DNS/TLS summary over public DoH without WHOIS.
- A video keyframe extractor (canvas, offline) and a user-initiated, clearly labelled “save to Internet Archive” helper.
- A printable verification report (PDF/Markdown) and an ethics note on what these tools cannot prove.

None of this is implemented yet: each item is a ready-made task in `ISSUES_GOOD_FIRST.md`.

## Contribute in 5 minutes

1. Fork this repository.
2. Copy `data/checks/example.json` into `data/checks/` and edit it.
3. Run `python scripts/validate.py`.
4. Open a pull request — data contributions need no coding.

## Good first issues

See `ISSUES_GOOD_FIRST.md` for ready-made tasks.

## License

Code: MIT. Contributed data: state its source; it is released under the same licence unless the file says otherwise.

## Support

If this project is useful, you can [buy me a coffee](https://buymeacoffee.com/echo.of.the.strings).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Add yourself with `@all-contributors please add @you for data` in your pull request.
