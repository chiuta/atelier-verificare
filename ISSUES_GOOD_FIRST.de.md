# Gute erste Aufgaben

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · **Deutsch** · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Eine PDF-Metadatenprüfung ergänzen, die offline funktioniert (Info-Dictionary, XMP, Producer, Erstellungs- und Änderungsdaten, inkrementelle Updates)
- [ ] Das Byte-Scannen nach dem Exif-Block in HEIC und AVIF durch eine richtige ISO-BMFF-Item-Suche (`iinf`, `iloc`) ersetzen und Tests ergänzen
- [ ] Eine RDAP-Abfrage des Domainalters als klar gekennzeichnete Netzprüfung ergänzen (jeden Host im Descriptor und in `connect` deklarieren und dokumentieren, was gesendet wird)
- [ ] C2PA-Signaturen mit Web Crypto validieren (COSE_Sign1 und Zertifikatskette), getestet an den öffentlichen Beispieldateien von c2pa-rs
- [ ] `geo:`- und OpenStreetMap-Links für die GPS-Position im EXIF-Befund ergänzen (nur per Klick der Nutzerin oder des Nutzers geöffnet)
- [ ] Die Fehlerniveau-Karte verbessern: mehrere Qualitätsstufen und ein Verstärkungsregler, mit Tests an erzeugten Bildern
- [ ] Eine Offline-Prüfung für Audio-Metadaten ergänzen (ID3, MP4-Tags, Vorbis-Kommentare)
- [ ] Ein Hilfsmittel ergänzen, das ein Bild ohne EXIF, XMP und IPTC neu kodiert, damit man vor dem Veröffentlichen eine saubere Kopie speichern kann
- [ ] Die maschinell geschriebenen Übersetzungen der Oberfläche (fr, de, es, it, pt, hu) prüfen und korrigieren, was Muttersprachler nicht sagen würden
- [ ] Ein optionales, selbst gehostetes Hilfsmittel erforschen, das Weiterleitungsketten verfolgt (eine Webseite kann das nicht), und vor dem Programmieren ein Issue mit dem Entwurf eröffnen

Lege sie alle auf GitHub mit `scripts/create_issues.sh` an (benötigt die `gh`-CLI).
