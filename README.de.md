# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

Version: 0.2.1 · Letzte Aktualisierung: 2026-11-20

🌐 https://atelier-verificare.chiuta.ro

> Lokales Verifikations-Toolkit für Journalisten: Bildherkunft, Metadaten, Links und Domains.

Trade-free: kein Tracking, keine Werbung, keine Konten, funktioniert offline.

## Status

Alpha, nutzbar: elf Prüfungen (neun offline, zwei auf Anfrage über das Netz) laufen in der einen Datei `index.html` (offline öffnen, ohne Server). Eine Prüfung ist ein Descriptor in `data/checks/` plus ein Plugin in `checks/`; was diese Prüfungen nicht beweisen können, steht weiter unten.

## Was es kann

- Füge Bilder, Videos, Links, Domains oder eingefügten Text hinzu (Ziehen und Ablegen, Dateiauswahl, Einfügen) und führe die Prüfungen für jedes Element aus; es wird nichts hochgeladen.
- Dateistruktur: der tatsächliche Typ aus dem Inhalt, Abweichung von der Endung, Abmessungen, nach dem Dateiende angehängte Daten, geschätzte JPEG-Qualität, Abschneiden und ein SHA-256, mit dem du später zeigen kannst, dass die analysierte Kopie die erhaltene ist.
- EXIF-Inspektor: Kamera, Objektiv, Software (und ob sie einen Bildeditor nennt), Daten und Zeitzone, eine Änderung nach der Aufnahme, GPS-Position, eingebettetes Vorschaubild und Größenabweichungen, Seriennummern.
- Weitere eingebettete Metadaten: XMP (Werkzeug, Bearbeitungsverlauf, angegebene KI-Quelle), IPTC-Pressefelder, JPEG-Kommentare und PNG-Textfelder, die der Ausgabe von KI-Bildgeneratoren entsprechen.
- Content Credentials (C2PA): liest die Manifeste (wer signiert hat, womit, welche Aktionen, KI-Angaben) in JPEG, PNG, WebP, MP4, MOV, HEIC und AVIF; sie werden gelesen, Signaturen aber nicht validiert.
- Fehlerniveau-Analyse für JPEG mit einer Karte, die du als PNG speichern kannst; Videometadaten (Container, Daten, gespeicherter Ort, Spuren einer Neukodierung); lokal extrahierte Schlüsselbilder für die umgekehrte Bildersuche.
- Link-Anatomie (der `@`-Trick, ähnlich aussehende Buchstaben, IP-Adressen, Kurzlinks, Tracking-Parameter) und Texthygiene (unsichtbare Zeichen, Textrichtungssteuerzeichen, ähnlich aussehende Buchstaben), ohne etwas zu öffnen.
- Zwei optionale Netzprüfungen, erst nachdem du ein Einwilligungsfeld angekreuzt und ihre Schaltfläche gedrückt hast: eine DNS-Zusammenfassung von zwei öffentlichen Resolvern (sendet den Domainnamen an `cloudflare-dns.com` und `dns.google`) und eine Internet-Archive-Abfrage (sendet die Adresse an `archive.org`). Die Links zum Speichern oder Ansehen archivierter Kopien sind gewöhnliche Links, die du selbst öffnest.
- Ein Bericht für den ganzen Fall als Markdown, JSON oder Druck/PDF, in der Sprache der Oberfläche, mit Datum, dem SHA-256 jeder Datei, jedem Befund und den Grenzen der Methode.
- Oberfläche in acht Sprachen, dunkles und helles Design, Tastatur- und Screenreader-Unterstützung, mobiles Layout; kein Tracking, keine Konten.
- Als App installierbar und nach dem ersten Besuch offline verfügbar, wenn sie über HTTPS ausgeliefert wird (ein Service Worker behält die Seite selbst; die oben beschriebenen optionalen Netzprüfungen sind die einzigen Anfragen, die die Seite stellt, und der Service Worker berührt sie nie). Aus einer heruntergeladenen Datei geöffnet, funktioniert sie genauso, ohne Installation.

## Wie es funktioniert

- `node scripts/build.mjs` setzt die eine `index.html` aus `src/` zusammen: `src/engine.mjs` (Parser und reine Funktionen), `checks/*.js` (ein Plugin je Prüfung; API in `docs/check-api.md`), `data/checks/*.json` (Descriptoren, validiert durch `schema.json`), `src/ui.js`, `src/app.css` und `src/i18n.mjs`; `--check` prüft, ob die Seite zu den Quellen passt.
- Eine Prüfung liefert kodierte Befunde (`{code, level, args}`), nie Sätze: Die Oberfläche übersetzt sie in die Sprache der Leserin oder des Lesers, sodass eine neue Sprache oder ein korrigierter Satz die Parser nie berührt.
- Dateien werden im Browser gelesen (File API) und verlassen das Gerät nie. Nur Titel und Notizen des Falls bleiben im lokalen Speicher des Browsers; Elemente und Ergebnisse verschwinden beim Neuladen der Seite.
- Die Content-Security-Policy erlaubt Netzanfragen nur an die Hosts, die die Descriptoren deklarieren (`archive.org`, `cloudflare-dns.com`, `dns.google`). Die Oberfläche fügt die Einwilligungsschranke hinzu, keine Anmeldedaten, keinen Referrer und ein Zeitlimit von 10 s; ein Plugin kann `fetch` nicht selbst aufrufen.
- `npm test` führt die Parser auf erzeugten Fixtures (JPEG, PNG, WebP, MP4, WebM, C2PA-Speicher), die Plugins mit simuliertem Netz und Canvas, die Übersetzungen in allen acht Sprachen und den Descriptor/CSP-Vertrag aus; die Browsertests im Hub prüfen die ganze Seite. Die Entwicklung braucht Node.js 24 oder neuer; die Seite selbst braucht nur einen Browser mit ES2017.
- `manifest.webmanifest`, `sw.js` und die Symbole erzeugt `node scripts/build.mjs` über das gemeinsame Kit (Abschnitt `pwa` in `src/app.json`); `--check` prüft sie ebenfalls, und `npm test` stellt sicher, dass Manifest, Service-Worker-Version und CSP zur Seite passen.

## Was dieses Werkzeug nicht sagen kann

- Es kann nicht beweisen, dass ein Bild oder Video echt ist. Es zeigt nur Hinweise, die eine Behauptung stützen oder ihr widersprechen.
- Metadaten (EXIF, XMP, IPTC) lassen sich leicht entfernen, kopieren oder fälschen. Ihr Fehlen sagt wenig; ihr Vorhandensein ist ein Anhaltspunkt, kein Beweis. Soziale Netzwerke und Messenger entfernen das meiste.
- Content Credentials (C2PA) werden gelesen, nicht validiert: Signatur, Zertifikatskette und Inhalts-Hash werden hier nicht geprüft. Verwenden Sie dafür einen offiziellen Prüfer.
- Die Fehlerniveau-Analyse ist ein Hinweis: Sie leuchtet auch an scharfen Kanten, in gesättigten Bereichen und bei mehrfach gespeicherten Bildern auf. Fachleute lesen sie zusammen mit anderen Belegen.
- Die Linkprüfung arbeitet nur mit dem Text der Adresse. Eine Webseite kann weder Weiterleitungen verfolgen noch TLS-Zertifikate lesen noch die Zielseite öffnen; sie kann also nicht sagen, ob eine Website vertrauenswürdig ist.
- DNS-Abfragen zeigen, was zwei öffentliche Resolver jetzt antworten. Sie nennen weder das Registrierungsdatum noch den Inhaber einer Domain.
- Die Internet-Archive-Suche sagt nur, ob es eine Kopie gibt und welchen Status sie hatte; das Fehlen einer Kopie beweist nichts.
- Die Erkennung KI-generierter Bilder anhand von Metadaten findet nur angegebene oder zurückgebliebene Spuren. Eine saubere Datei kann trotzdem synthetisch sein, und eine markierte Datei kann ein echtes, mit einem KI-Werkzeug bearbeitetes Foto sein.
- Die Oberfläche gibt es in acht Sprachen; die Übersetzungen wurden mit maschineller Hilfe erstellt und nicht von Muttersprachlern geprüft. Maßgeblich sind die rumänischen und englischen Texte.

## In 5 Minuten mitmachen

1. Forke dieses Repository.
2. Kopiere `data/checks/example.json` nach `data/checks/<id>.json` und bearbeite die Datei (Schema in `schema.json`), dann führe `python scripts/validate.py` aus.
3. Schreibe `checks/<id>.js` (siehe `docs/check-api.md`): ein ES-Modul, das `async function run(input, ctx)` exportiert und kodierte Befunde zurückgibt.
4. Ergänze die Texte der Prüfung und jedes Befundcodes in allen acht Sprachen in `src/i18n.mjs`.
5. Schreibe Tests in `test/`, führe `npm test` und `node scripts/build.mjs` aus und öffne einen Pull Request.

## Gute erste Aufgaben

Siehe `ISSUES_GOOD_FIRST.md` für fertige Aufgaben.

## Lizenz

Code: MIT. Beigesteuerte Daten: Quelle angeben; sie stehen unter derselben Lizenz, sofern die Datei nichts anderes sagt.

## Unterstützung

Wenn dir das Projekt nützt, kannst du [mir einen Kaffee spendieren](https://buymeacoffee.com/echo.of.the.strings).
