# Site M.T Répare — version statique pour Render

Mêmes adresses de pages que sur Webador (`/services`, `/tarifs`, `/devis`, `/a-propos`, `/f-a-q`), pour ne pas perdre le référencement.

## 1. Images

Toutes les images sont incluses (logo, mascotte et les 3 illustrations des services) : rien à ajouter.

## 2. Formulaire de devis (Web3Forms, gratuit)

1. Va sur https://web3forms.com, saisis `mtrepare@outlook.fr` → tu reçois une clé d'accès par e-mail.
2. Dans `devis/index.html`, remplace `VOTRE_CLE_WEB3FORMS` par cette clé.
3. Les demandes arriveront directement dans ta boîte mail.

## 3. Mise en ligne sur Render

1. Crée un nouveau dépôt GitHub (ex. `mtrepare-site`) et envoie-y tout ce dossier.
2. Render > New > **Static Site** > choisis le dépôt.
   - Build Command : (vide)
   - Publish Directory : `.`
3. Teste sur l'adresse `xxx.onrender.com` (pages, formulaire, mobile).
4. Settings > Custom Domains : ajoute `mtrepare.fr` et `www.mtrepare.fr`.
5. Une fois le domaine transféré chez OVH : enregistrement A `@` → 216.24.57.1 et CNAME `www` → `xxx.onrender.com` (comme pour gestatphone.fr).
6. Search Console : soumets `https://www.mtrepare.fr/sitemap.xml`.

Le fichier `render.yaml` ajoute une redirection de l'ancienne adresse `/services/devis` vers `/devis`. Si tu crées le site à la main (sans Blueprint), ajoute cette règle dans Render > Redirects/Rewrites.
