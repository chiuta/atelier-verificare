# Journal des modifications

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · **Français** · [Italiano](CHANGELOG.it.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt.md) · [Deutsch](CHANGELOG.de.md) · [Magyar](CHANGELOG.hu.md)

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Non publié]

## [0.2.1] - 2026-11-20

### Modifié
- fff-kit 1.8.1 : lorsque le navigateur bloque le stockage ou en est dépourvu (`localStorage`/`sessionStorage` lèvent une erreur ou sont absents), la page démarre avec un stockage temporaire en mémoire au lieu de s’arrêter ; les données ne sont pas conservées après la fermeture de la page.
- fff-kit 1.8.1 : le dispositif qui agrandit les petits contrôles à 44 px mesure désormais aussi la largeur du corps de la page et de l’élément parent ; une rangée de boutons ne peut donc plus sortir de l’écran (le groupe reste inchangé lorsque l’agrandissement le ferait déborder).

## [0.2.0] - 2026-11-17

### Ajouté
- Onze vérifications fonctionnelles : structure du fichier avec SHA-256, inspecteur EXIF, autres métadonnées intégrées (XMP, IPTC, texte PNG), lecteur Content Credentials (C2PA), analyse du niveau d’erreur pour JPEG, métadonnées vidéo, images clés vidéo, anatomie des liens, hygiène du texte, résumé DNS et recherche Internet Archive (les deux dernières seulement à la demande, après consentement).
- Une API commune des vérifications (`docs/check-api.md`) : constats codés à quatre niveaux, un descripteur et un plugin par vérification, et un réseau et un canvas simulés pour les tests.
- Vue de dossier : ajout de fichiers, liens, domaines et texte par glisser-déposer, sélecteur de fichiers ou collage ; vérifications par élément ou toutes à la fois ; un rapport en Markdown, JSON ou impression/PDF avec la date, chaque SHA-256 et les limites ; une section sur les limites et l’éthique (`docs/ethics.md`).
- Interface en huit langues (291 textes chacune, vérifiés pour les mêmes clés et substituants), thèmes sombre et clair, prise en charge du clavier et des lecteurs d’écran, mise en page mobile.
- La Content-Security-Policy liste exactement les trois hôtes utilisés par les vérifications réseau (`connect` dans `src/app.json`) ; les vérifications réseau restent désactivées tant que l’utilisateur n’a pas coché une case de consentement.
- Tests : `node --test` pour les analyseurs, les plugins, les traductions et le contrat descripteurs/CSP ; tests de navigateur dans le hub (toutes les langues, accessibilité, fichiers hostiles, réseau simulé).
- `src/`, `checks/` et `scripts/build.mjs` : l’unique `index.html` est désormais construit à partir des sources, et `--check` le vérifie.
- ISSUES_GOOD_FIRST et CODE_OF_CONDUCT traduits dans les huit langues.
- README en anglais, roumain, français, italien, espagnol, portugais, allemand et hongrois : sections d’état et de périmètre prévu (dérivées de `ISSUES_GOOD_FIRST.md`).
- Installable (PWA) : `manifest.webmanifest`, `sw.js` et les icônes sont générés par le kit commun (`fff-kit/pwa`) ; la page fonctionne hors ligne après la première visite en HTTPS.

### Modifié
- `data/checks/example.json` est désormais le descripteur modèle, et `docs/examples/my-check.js` le plugin modèle correspondant.
- `schema.json` : `input` accepte `file`, `image`, `video`, `url`, `domain` et `text` (seuls ou en liste), et `network` liste les hôtes d’une vérification qui n’est pas hors ligne.
- `scripts/validate.py` vérifie aussi que chaque descripteur a son plugin, que l’`id` correspond au nom du fichier et que chaque hôte réseau est déclaré dans `src/app.json`.
- Le workflow s’exécute sur Ubuntu 26.04 avec Node.js 26 et lance aussi les tests et la vérification de la construction.

## [0.1.0] - 2026-11-13

### Ajouté
- Squelette initial : structure, schéma de données ou premiers exemples, guides de contribution en huit langues.
