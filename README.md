# Atelier de verificare

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Version: 0.2.1 · Last updated: 2026-11-22

🌐 https://atelier-verificare.chiuta.ro

> A local-first verification toolkit for journalists: image provenance, metadata, links and domains.

Trade-free: no tracking, no ads, no accounts, works offline.

## Status

Alpha, usable: eleven checks (nine offline, two on request over the network) work in the single `index.html` (open it offline, no server). A check is a descriptor in `data/checks/` plus a plugin in `checks/`; what these checks cannot prove is listed below.

## What it does

- Add images, videos, links, domains or pasted text (drag and drop, file picker, paste) and run the checks on each item; nothing is uploaded.
- File structure: the real type from the content, mismatch with the extension, dimensions, data appended after the end of the file, JPEG quality estimate, truncation, and a SHA-256 so you can later show that the copy you analysed is the one you received.
- EXIF inspector: camera, lens, software (and whether it names an image editor), dates and time zone, a modification later than the capture, GPS position, embedded thumbnail and size mismatches, serial numbers.
- Other embedded metadata: XMP (tool, edit history, declared AI source), IPTC press fields, JPEG comments, and PNG text fields that match the output of AI image generators.
- Content Credentials (C2PA): reads the manifests (who signed, with what, which actions, AI declarations) in JPEG, PNG, WebP, MP4, MOV, HEIC and AVIF; it reads them but does not validate signatures.
- Error-level analysis for JPEG, with a map you can save as PNG; video metadata (container, dates, stored location, re-encoding signatures); keyframes extracted locally for reverse-image search.
- Link anatomy (the `@` trick, look-alike letters, IP addresses, shorteners, tracking parameters) and text hygiene (invisible characters, text-direction controls, look-alike letters), without opening anything.
- Two optional network checks, only after you tick a consent box and press their button: a DNS summary from two public resolvers (sends the domain name to `cloudflare-dns.com` and `dns.google`) and an Internet Archive lookup (sends the address to `archive.org`). The links to save or view archived copies are plain links you open yourself.
- A report for the whole case as Markdown, JSON or print/PDF, in the interface language, with the date, each file’s SHA-256, every finding and the limits of the method.
- Interface in eight languages, dark and light themes, keyboard and screen-reader support, mobile layout; no tracking, no accounts.
- Installable as an app and available offline after the first visit when served over HTTPS (a service worker keeps the page itself; the optional network checks described above are the only requests the page ever makes, and the service worker never touches them). Opened from a downloaded file it works the same, without installation.

## How it works

- `node scripts/build.mjs` assembles the single `index.html` from `src/`: `src/engine.mjs` (parsers and pure functions), `checks/*.js` (one plugin per check; API in `docs/check-api.md`), `data/checks/*.json` (descriptors validated by `schema.json`), `src/ui.js`, `src/app.css` and `src/i18n.mjs`; `--check` verifies that the page matches the sources.
- A check returns coded findings (`{code, level, args}`), never sentences: the interface turns them into the reader’s language, so adding a language or fixing a sentence never touches the parsers.
- Files are read in the browser (File API) and never leave the device. Only the case title and notes are kept in the browser’s local storage; the items and results disappear when you reload the page.
- The Content-Security-Policy allows network requests only to the hosts the descriptors declare (`archive.org`, `cloudflare-dns.com`, `dns.google`). The interface adds the consent gate, no credentials, no referrer and a 10 s timeout, and a plugin cannot call `fetch` itself.
- `npm test` runs the parsers on generated fixtures (JPEG, PNG, WebP, MP4, WebM, C2PA stores), the plugins with a simulated network and canvas, the translations in all eight languages and the descriptor/CSP contract; the hub’s browser tests exercise the whole page. Development needs Node.js 24 or newer; the page itself only needs a browser with ES2017.
- `manifest.webmanifest`, `sw.js` and the icons are produced by `node scripts/build.mjs` through the shared kit (`pwa` in `src/app.json`); `--check` also verifies them, and `npm test` checks that the manifest, the service worker version and the CSP match the page.

## What this tool cannot tell you

- It cannot prove that an image or video is authentic. It can only show signs that support or contradict a claim.
- Metadata (EXIF, XMP, IPTC) is easy to remove, copy or forge. Its absence says little; its presence is a lead, not proof. Social networks and messaging apps strip most of it.
- Content Credentials (C2PA) are read, not validated: the signature, the certificate chain and the content hash are not checked here. Use an official verifier for that.
- Error-level analysis is a hint: it also lights up sharp edges, saturated areas and images saved several times. Experts read it together with other evidence.
- The link check works on the text of the address only. A web page cannot follow redirects, read TLS certificates or open the target page for you, so it cannot say whether a site is trustworthy.
- DNS lookups show what two public resolvers answer now. They do not give the registration date or the owner of a domain.
- The Internet Archive lookup only tells whether a copy exists and what status it had; the absence of a copy proves nothing.
- Detecting AI-generated images from metadata only finds declared or leftover traces. A clean file can still be synthetic, and a flagged file can be a real photo edited with an AI tool.
- The interface exists in eight languages; the translations were written with machine assistance and have not been reviewed by native speakers. The Romanian and English texts are the reference.

## Contribute in 5 minutes

1. Fork this repository.
2. Copy `data/checks/example.json` to `data/checks/<id>.json` and edit it (schema in `schema.json`), then run `python scripts/validate.py`.
3. Write `checks/<id>.js` (see `docs/check-api.md`): an ES module that exports `async function run(input, ctx)` and returns coded findings.
4. Add the texts for the check and for each finding code in all eight languages in `src/i18n.mjs`.
5. Write tests in `test/`, run `npm test` and `node scripts/build.mjs`, and open a pull request.

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
