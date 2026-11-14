# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Version : 0.1.0 · Dernière mise à jour : 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Boîte à outils de vérification locale pour journalistes : provenance des images, métadonnées, liens et domaines.

Trade-free : sans suivi, sans publicité, sans compte, fonctionne hors ligne.

## État

Alpha : le dépôt contient la structure, le schéma de données ou les premiers exemples et les guides de contribution. Le périmètre ci-dessous est le plan, pas ce qui fonctionne aujourd’hui.

## Périmètre prévu

- Une API de contrôle commune (entrées, sorties, niveaux d’état) pour que chaque contrôle rende compte de la même façon.
- Contrôles d’images : un véritable analyseur EXIF (GPS, appareil, logiciel, horodatages), un contrôle hors ligne et en lecture seule du manifeste C2PA et l’analyse du niveau d’erreur pour JPEG.
- Contrôles de liens et de domaines : liens morts et chaînes de redirection pour une liste d’URL, et un résumé DNS/TLS via DoH public sans WHOIS.
- Un extracteur d’images clés vidéo (canvas, hors ligne) et une aide « enregistrer sur Internet Archive », lancée par l’utilisateur et clairement étiquetée.
- Un rapport de vérification imprimable (PDF/Markdown) et une note d’éthique sur ce que ces outils ne peuvent pas prouver.

Rien de tout cela n’est encore implémenté : chaque point est une tâche prête dans `ISSUES_GOOD_FIRST.md`.

## Contribuer en 5 minutes

1. Forkez ce dépôt.
2. Copiez `data/checks/example.json` dans `data/checks/` et modifiez-le.
3. Lancez `python scripts/validate.py`.
4. Ouvrez une pull request — aucune programmation n'est nécessaire pour les données.

## Bonnes premières tâches

Voir `ISSUES_GOOD_FIRST.md` pour des tâches toutes prêtes.

## Licence

Code : MIT. Données contribuées : indiquez la source ; elles sont publiées sous la même licence sauf mention contraire.

## Soutien

Si ce projet vous est utile, vous pouvez [m'offrir un café](https://buymeacoffee.com/echo.of.the.strings).
