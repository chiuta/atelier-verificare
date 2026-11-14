# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

Version: 0.1.0 · Letzte Aktualisierung: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Lokales Verifikations-Toolkit für Journalisten: Bildherkunft, Metadaten, Links und Domains.

Trade-free: kein Tracking, keine Werbung, keine Konten, funktioniert offline.

## Status

Alpha: Das Repository enthält die Struktur, das Datenschema oder die ersten Beispiele und die Beitragsleitfäden. Der Umfang unten ist der Plan, nicht das, was heute funktioniert.

## Geplanter Umfang

- Eine gemeinsame Prüf-API (Eingaben, Ausgaben, Statusstufen), damit jede Prüfung gleich berichtet.
- Bildprüfungen: ein vollständiger EXIF-Parser (GPS, Kamera, Software, Zeitstempel), eine schreibgeschützte Offline-Prüfung des C2PA-Manifests und Error-Level-Analyse für JPEG.
- Link- und Domainprüfungen: tote Links und Weiterleitungsketten für eine URL-Liste sowie eine DNS/TLS-Zusammenfassung über öffentliches DoH ohne WHOIS.
- Ein Video-Keyframe-Extraktor (Canvas, offline) und eine vom Nutzer ausgelöste, klar gekennzeichnete Hilfe „im Internet Archive speichern“.
- Ein druckbarer Prüfbericht (PDF/Markdown) und ein Ethikhinweis dazu, was diese Werkzeuge nicht beweisen können.

Nichts davon ist bisher umgesetzt: Jeder Punkt ist eine fertig vorbereitete Aufgabe in `ISSUES_GOOD_FIRST.md`.

## In 5 Minuten mitmachen

1. Forke dieses Repository.
2. Kopiere `data/checks/example.json` nach `data/checks/` und bearbeite die Datei.
3. Führe `python scripts/validate.py` aus.
4. Öffne einen Pull Request – für Daten ist keine Programmierung nötig.

## Gute erste Aufgaben

Siehe `ISSUES_GOOD_FIRST.md` für fertige Aufgaben.

## Lizenz

Code: MIT. Beigesteuerte Daten: Quelle angeben; sie stehen unter derselben Lizenz, sofern die Datei nichts anderes sagt.

## Unterstützung

Wenn dir das Projekt nützt, kannst du [mir einen Kaffee spendieren](https://buymeacoffee.com/echo.of.the.strings).
