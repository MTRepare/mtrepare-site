# Site M.T Répare — mode d'emploi

Site statique hébergé sur Render (Static Site), mis à jour automatiquement à chaque modification sur GitHub.

## Clé Web3Forms (formulaires Devis + Montage PC)
Fichier `assets/config.js` : remplace `VOTRE_CLE_WEB3FORMS` par ta clé.
⚠️ Lors des futures mises à jour, ne réenvoie jamais ce fichier (sinon la clé est écrasée).

## Mettre à jour la liste des composants (page Montage PC)
Fichier `data/composants.csv` — sur GitHub : ouvre le fichier > crayon ✏️ > modifie > Commit changes.
- Une ligne = un composant, colonnes séparées par des points-virgules `;`
- `categorie;modele;socket;memoire;format;disponible;info`
- Rupture chez le fournisseur : mets `non` dans la colonne `disponible` (le composant disparaît du site sans être supprimé).
- Nouveau composant : copie une ligne de la même catégorie et change le nom.
- `socket` (processeurs + cartes mères), `memoire` (DDR4/DDR5) et `format` (ATX/mATX/ITX) servent à la vérification de compatibilité : remplis-les pour ces catégories.

## Galerie « Nos réalisations »
1. Envoie la photo dans `img/realisations/` (Add file > Upload files depuis ce dossier).
2. Ajoute une ligne dans `data/realisations.csv` : `nom-photo.jpg;Titre;Description`
La galerie apparaît automatiquement dès qu'il y a au moins une ligne.

## Avis Google
Note, nombre d'avis et textes : à mettre à jour avec Claude (fichiers index.html et a-propos/index.html).
