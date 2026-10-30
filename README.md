# MultiCode — démo statique

Démo publique de génération de **vrais QR codes statiques**, hébergée gratuitement sur GitHub Pages et servie sur `https://multicode.fr`.
Copyright © ZCOORE. Contact : [contact@multicode.fr](mailto:contact@multicode.fr).

## Ce que la démo fait réellement

- Génère dans le navigateur des QR codes pour un lien, du texte, un réseau Wi-Fi, une fiche contact, un e-mail ou un numéro de téléphone.
- Met à jour l’aperçu au fur et à mesure de la saisie.
- Télécharge les codes en PNG ou SVG.
- Enregistre les créations dans le `localStorage` de l’appareil pour les retrouver dans « Mes QR ».
- N’envoie pas le contenu saisi à un serveur et ne requiert ni compte, ni clé API, ni paiement.

Les QR de cette démo sont **statiques** : leur contenu est inscrit directement dans le code et ne peut pas être modifié après impression. Les fonctions qui nécessitent un backend (QR dynamiques, statistiques de scan, comptes, facturation, API et webhooks) ne sont pas simulées.

## Exécution locale — Docker uniquement

Depuis la racine du dépôt démo :

```sh
docker compose -f compose.yml up --build
```

Le conteneur exécute `npm ci`, les tests Vitest et le build Vite pendant la construction, puis sert les fichiers statiques avec Nginx. Ouvrir `http://localhost:4174`. Aucun `npm install`, build ou serveur Node n’est nécessaire sur l’hôte.

Arrêt :

```sh
docker compose -f compose.yml down
```

## Déploiement GitHub Pages

Le workflow `.github/workflows/pages.yml` installe les dépendances sur le runner GitHub, exécute les tests et publie `dist` après chaque push sur `main`. Le fichier `public/CNAME` définit `multicode.fr`; Vite le copie à la racine du site.

Dans les réglages du dépôt GitHub `zcorp/multicode`, activer **Settings → Pages → Build and deployment → Source: GitHub Actions** si ce n’est pas déjà fait. Pour le domaine apex OVH, vérifier que les entrées DNS pointent vers GitHub Pages :

- `A` pour `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Facultatif : les quatre entrées `AAAA` publiées dans la documentation GitHub Pages.
- Si `www.multicode.fr` doit aussi fonctionner, ajouter un `CNAME` `www` vers `zcorp.github.io.` puis configurer la redirection souhaitée chez OVH.

Le workflow n’accède à aucun secret applicatif ni à l’API MultiCode. L’activation de HTTPS peut attendre la propagation DNS et la validation du domaine par GitHub.

Si le premier workflow échoue avec `Get Pages site failed ... Not Found`, activer d’abord Pages comme ci-dessus, puis lancer `Deploy static demo to GitHub Pages` depuis l’onglet **Actions → Run workflow**.

## Stack

React, Material UI (composants et icônes), Vite et `qrcode`. Le générateur encode le contenu localement; aucune API tierce de génération de QR n’est appelée.
