# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Version : 0.2.1 · Dernière mise à jour : 2026-11-22

🌐 https://atelier-verificare.chiuta.ro

> Boîte à outils de vérification locale pour journalistes : provenance des images, métadonnées, liens et domaines.

Trade-free : sans suivi, sans publicité, sans compte, fonctionne hors ligne.

## État

Alpha, utilisable : onze vérifications (neuf hors ligne, deux à la demande via le réseau) fonctionnent dans l’unique fichier `index.html` (à ouvrir hors ligne, sans serveur). Une vérification est un descripteur dans `data/checks/` plus un plugin dans `checks/` ; ce que ces vérifications ne peuvent pas prouver est indiqué plus bas.

## Ce que fait l’application

- Ajoutez des images, des vidéos, des liens, des domaines ou du texte collé (glisser-déposer, sélecteur de fichiers, collage) et lancez les vérifications sur chaque élément ; rien n’est envoyé.
- Structure du fichier : le type réel d’après le contenu, l’écart avec l’extension, les dimensions, les données ajoutées après la fin du fichier, la qualité JPEG estimée, la troncature, et un SHA-256 pour montrer plus tard que l’exemplaire analysé est celui que vous avez reçu.
- Inspecteur EXIF : appareil, objectif, logiciel (et s’il nomme un éditeur d’images), dates et fuseau horaire, une modification postérieure à la prise de vue, position GPS, vignette intégrée et écarts de dimensions, numéros de série.
- Autres métadonnées intégrées : XMP (outil, historique des modifications, source IA déclarée), champs de presse IPTC, commentaires JPEG et champs de texte PNG correspondant à la sortie de générateurs d’images IA.
- Content Credentials (C2PA) : lit les manifestes (qui a signé, avec quoi, quelles actions, déclarations sur l’IA) dans les JPEG, PNG, WebP, MP4, MOV, HEIC et AVIF ; il les lit mais ne valide pas les signatures.
- Analyse du niveau d’erreur pour JPEG, avec une carte enregistrable en PNG ; métadonnées vidéo (conteneur, dates, position stockée, signatures de réencodage) ; images clés extraites localement pour la recherche d’images inversée.
- Anatomie des liens (l’astuce du `@`, lettres semblables, adresses IP, raccourcisseurs, paramètres de suivi) et hygiène du texte (caractères invisibles, contrôles de direction du texte, lettres semblables), sans rien ouvrir.
- Deux vérifications facultatives par le réseau, seulement après avoir coché une case de consentement et appuyé sur leur bouton : un résumé DNS de deux résolveurs publics (envoie le nom de domaine à `cloudflare-dns.com` et `dns.google`) et une recherche dans Internet Archive (envoie l’adresse à `archive.org`). Les liens pour enregistrer ou voir des copies archivées sont de simples liens que vous ouvrez vous-même.
- Un rapport pour tout le dossier en Markdown, JSON ou impression/PDF, dans la langue de l’interface, avec la date, le SHA-256 de chaque fichier, chaque constat et les limites de la méthode.
- Interface en huit langues, thèmes sombre et clair, prise en charge du clavier et des lecteurs d’écran, mise en page mobile ; sans suivi, sans comptes.
- Installable comme une application et disponible hors ligne après la première visite lorsqu’elle est servie en HTTPS (un service worker conserve la page elle-même ; les vérifications facultatives par le réseau décrites plus haut sont les seules requêtes que la page émet, et le service worker n’y touche jamais). Ouverte depuis un fichier téléchargé, elle fonctionne de la même manière, sans installation.

## Comment ça marche

- `node scripts/build.mjs` assemble l’unique `index.html` à partir de `src/` : `src/engine.mjs` (analyseurs et fonctions pures), `checks/*.js` (un plugin par vérification ; API dans `docs/check-api.md`), `data/checks/*.json` (descripteurs validés par `schema.json`), `src/ui.js`, `src/app.css` et `src/i18n.mjs` ; `--check` vérifie que la page correspond aux sources.
- Une vérification renvoie des constats codés (`{code, level, args}`), jamais des phrases : l’interface les traduit dans la langue du lecteur, donc ajouter une langue ou corriger une phrase ne touche jamais aux analyseurs.
- Les fichiers sont lus dans le navigateur (File API) et ne quittent jamais l’appareil. Seuls le titre et les notes du dossier sont gardés dans le stockage local du navigateur ; les éléments et les résultats disparaissent au rechargement de la page.
- La Content-Security-Policy n’autorise les requêtes réseau que vers les hôtes déclarés par les descripteurs (`archive.org`, `cloudflare-dns.com`, `dns.google`). L’interface ajoute la porte du consentement, aucun identifiant, aucun referrer et un délai de 10 s, et un plugin ne peut pas appeler `fetch` lui-même.
- `npm test` exécute les analyseurs sur des fixtures générées (JPEG, PNG, WebP, MP4, WebM, magasins C2PA), les plugins avec un réseau et un canvas simulés, les traductions dans les huit langues et le contrat descripteurs/CSP ; les tests de navigateur du hub exercent toute la page. Le développement demande Node.js 24 ou plus récent ; la page elle-même n’exige qu’un navigateur compatible ES2017.
- `manifest.webmanifest`, `sw.js` et les icônes sont produits par `node scripts/build.mjs` via le kit commun (section `pwa` de `src/app.json`) ; `--check` les vérifie aussi, et `npm test` contrôle que le manifeste, la version du service worker et la CSP correspondent à la page.

## Ce que cet outil ne peut pas dire

- Il ne peut pas prouver qu'une image ou une vidéo est authentique. Il montre seulement des indices qui appuient ou contredisent une affirmation.
- Les métadonnées (EXIF, XMP, IPTC) se suppriment, se copient et se falsifient facilement. Leur absence dit peu de chose ; leur présence est une piste, pas une preuve. Les réseaux sociaux et les messageries en suppriment la plupart.
- Les Content Credentials (C2PA) sont lus, pas validés : la signature, la chaîne de certificats et l'empreinte du contenu ne sont pas vérifiées ici. Utilisez un vérificateur officiel pour cela.
- L'analyse du niveau d'erreur est un indice : elle éclaire aussi les contours nets, les zones saturées et les images enregistrées plusieurs fois. Les spécialistes la lisent avec d'autres éléments.
- La vérification des liens porte uniquement sur le texte de l'adresse. Une page web ne peut ni suivre les redirections, ni lire les certificats TLS, ni ouvrir la page cible : elle ne peut donc pas dire si un site est fiable.
- Les requêtes DNS montrent ce que répondent aujourd'hui deux résolveurs publics. Elles ne donnent ni la date d'enregistrement ni le titulaire d'un domaine.
- La recherche dans l'Internet Archive indique seulement si une copie existe et quel était son statut ; l'absence de copie ne prouve rien.
- La détection d'images générées par IA à partir des métadonnées ne trouve que des traces déclarées ou restantes. Un fichier propre peut quand même être synthétique, et un fichier signalé peut être une vraie photo retouchée avec un outil d'IA.
- L'interface existe en huit langues ; les traductions ont été rédigées avec une aide automatique et n'ont pas été relues par des locuteurs natifs. Les textes roumain et anglais font foi.

## Contribuer en 5 minutes

1. Faites un fork de ce dépôt.
2. Copiez `data/checks/example.json` vers `data/checks/<id>.json` et modifiez-le (schéma dans `schema.json`), puis lancez `python scripts/validate.py`.
3. Écrivez `checks/<id>.js` (voir `docs/check-api.md`) : un module ES qui exporte `async function run(input, ctx)` et renvoie des constats codés.
4. Ajoutez les textes de la vérification et de chaque code de constat dans les huit langues dans `src/i18n.mjs`.
5. Écrivez des tests dans `test/`, lancez `npm test` et `node scripts/build.mjs`, puis ouvrez une pull request.

## Bonnes premières tâches

Voir `ISSUES_GOOD_FIRST.md` pour des tâches toutes prêtes.

## Licence

Code : MIT. Données contribuées : indiquez la source ; elles sont publiées sous la même licence sauf mention contraire.

## Soutien

Si ce projet vous est utile, vous pouvez [m'offrir un café](https://buymeacoffee.com/echo.of.the.strings).
