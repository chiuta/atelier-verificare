# Bonnes premières tâches

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · **Français** · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Ajouter une vérification des métadonnées PDF qui fonctionne hors ligne (dictionnaire Info, XMP, producteur, dates de création et de modification, mises à jour incrémentales)
- [ ] Remplacer le balayage octet par octet du bloc Exif dans HEIC et AVIF par une vraie recherche d’élément ISO BMFF (`iinf`, `iloc`) et ajouter des tests
- [ ] Ajouter une recherche RDAP de l’âge d’un domaine comme vérification réseau clairement étiquetée (déclarer chaque hôte dans le descripteur et dans `connect`, et documenter ce qui est envoyé)
- [ ] Valider les signatures C2PA avec Web Crypto (COSE_Sign1 et chaîne de certificats), testées sur les fichiers d’exemple publics de c2pa-rs
- [ ] Ajouter des liens `geo:` et OpenStreetMap pour la position GPS du constat EXIF (ouverts seulement au clic de l’utilisateur)
- [ ] Améliorer la carte du niveau d’erreur : plusieurs niveaux de qualité et un curseur d’amplification, avec des tests sur des images générées
- [ ] Ajouter une vérification hors ligne des métadonnées audio (ID3, balises MP4, commentaires Vorbis)
- [ ] Ajouter un utilitaire qui réencode une image sans EXIF, XMP ni IPTC pour que l’utilisateur enregistre une copie propre avant publication
- [ ] Relire les traductions de l’interface écrites automatiquement (fr, de, es, it, pt, hu) et corriger ce qu’un locuteur natif ne dirait pas
- [ ] Étudier un utilitaire facultatif, auto-hébergé, qui suit les chaînes de redirections (une page web ne le peut pas) et ouvrir un issue avec la conception avant d’écrire du code

Créez-les toutes sur GitHub avec `scripts/create_issues.sh` (nécessite la CLI `gh`).
