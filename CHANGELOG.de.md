# Änderungsprotokoll

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · [Français](CHANGELOG.fr.md) · [Italiano](CHANGELOG.it.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt.md) · **Deutsch** · [Magyar](CHANGELOG.hu.md)

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Unveröffentlicht]

## [0.2.0] - 2026-11-17

### Hinzugefügt
- Elf funktionierende Prüfungen: Dateistruktur mit SHA-256, EXIF-Inspektor, weitere eingebettete Metadaten (XMP, IPTC, PNG-Text), Content-Credentials-Leser (C2PA), Fehlerniveau-Analyse für JPEG, Videometadaten, Video-Schlüsselbilder, Link-Anatomie, Texthygiene, DNS-Zusammenfassung und Internet-Archive-Abfrage (die letzten beiden nur auf Anfrage, nach Einwilligung).
- Eine gemeinsame Prüf-API (`docs/check-api.md`): kodierte Befunde mit vier Stufen, ein Descriptor und ein Plugin je Prüfung sowie ein simuliertes Netz und Canvas für Tests.
- Fallansicht: Dateien, Links, Domains und Text per Ziehen und Ablegen, Dateiauswahl oder Einfügen hinzufügen; Prüfungen je Element oder alle zugleich ausführen; ein Bericht als Markdown, JSON oder Druck/PDF mit Datum, jedem SHA-256 und den Grenzen; ein Abschnitt zu Grenzen und Ethik (`docs/ethics.md`).
- Oberfläche in acht Sprachen (je 291 Texte, geprüft auf gleiche Schlüssel und Platzhalter), dunkles und helles Design, Tastatur- und Screenreader-Unterstützung, mobiles Layout.
- Die Content-Security-Policy nennt genau die drei Hosts, die die Netzprüfungen nutzen (`connect` in `src/app.json`); die Netzprüfungen bleiben aus, bis die Nutzerin oder der Nutzer ein Einwilligungsfeld ankreuzt.
- Tests: `node --test` für Parser, Plugins, Übersetzungen und den Descriptor/CSP-Vertrag; Browsertests im Hub (alle Sprachen, Barrierefreiheit, feindliche Dateien, simuliertes Netz).
- `src/`, `checks/` und `scripts/build.mjs`: Die eine `index.html` wird nun aus den Quellen gebaut, und `--check` prüft sie.
- ISSUES_GOOD_FIRST und CODE_OF_CONDUCT in alle acht Sprachen übersetzt.
- README auf Englisch, Rumänisch, Französisch, Italienisch, Spanisch, Portugiesisch, Deutsch und Ungarisch: Abschnitte zu Status und geplantem Umfang (abgeleitet aus `ISSUES_GOOD_FIRST.md`).
- Installierbar (PWA): `manifest.webmanifest`, `sw.js` und die Symbole werden vom gemeinsamen Kit (`fff-kit/pwa`) erzeugt; die Seite funktioniert nach dem ersten Besuch über HTTPS offline.

### Geändert
- `data/checks/example.json` ist jetzt der Vorlagen-Descriptor, und `docs/examples/my-check.js` das passende Vorlagen-Plugin.
- `schema.json`: `input` akzeptiert `file`, `image`, `video`, `url`, `domain` und `text` (einzeln oder als Liste), und `network` listet die Hosts einer Prüfung, die nicht offline ist.
- `scripts/validate.py` prüft zusätzlich, dass jeder Descriptor sein Plugin hat, dass die `id` zum Dateinamen passt und dass jeder Netz-Host in `src/app.json` deklariert ist.
- Der Workflow läuft auf Ubuntu 26.04 mit Node.js 26 und führt auch die Tests und die Build-Prüfung aus.

## [0.1.0] - 2026-11-13

### Hinzugefügt
- Erstes Gerüst: Struktur, Datenschema oder erste Beispiele, Beitragsanleitungen in acht Sprachen.
