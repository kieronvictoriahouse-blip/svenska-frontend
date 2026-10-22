# CLAUDE.md : Swedish Cravings (front)

Site statique (HTML, CSS, JS sans framework) de l'épicerie suédoise Swedish Cravings, déployé sur Vercel. Les données (produits, CMS, couleurs et polices de la marque) viennent du back-office via `js/sd-api-client.js`.

- **Dépôt public.** N'écrire dans aucun fichier (code, Markdown, commentaires) de secret, de marge, de prix d'achat ni de chiffre commercial.
- **Marque blanche.** Les couleurs et polices réellement affichées sont celles du back-office, pas les valeurs par défaut de `css/style.css`. Toute nouvelle couleur passe par une variable CSS.
- **Serveur local :** `node .claude/dev-server.js 8088`, puis http://localhost:8088. Il reproduit le routage Vercel (URLs sans `.html`, `/a-propos`, `/media/*`). Le site local lit l'API de production : se limiter à la navigation, ne jamais passer de vraie commande ni soumettre de formulaire depuis le local.

## Boucle design (obligatoire pour tout travail d'interface)

Avant de coder :
1. Lis DESIGN.md et PRODUCT.md.
2. Pour une nouvelle page ou section, utilise `/impeccable shape` pour proposer la structure en texte avant d'écrire du code.

Après chaque modification visuelle :
1. Lance le serveur local s'il ne tourne pas.
2. Avec Playwright, ouvre la page modifiée et prends des captures en 375px, 768px et 1440px de large.
3. Compare le rendu à DESIGN.md : couleurs, typographie, espacements, signatures visuelles.
4. Vérifie : débordements horizontaux, textes tronqués, contrastes, états hover/focus, cohérence avec les autres pages, et les trois langues (FR, EN, SV) si des textes ont changé.
5. Corrige, puis recommence. Maximum 3 itérations, puis résume ce qui reste à arbitrer.
6. Si des animations ont été ajoutées, demande à Kieron de lancer `/review-animations` avant de conclure (cette skill ne peut être lancée que par l'utilisateur).

Ne déclare jamais un travail d'interface terminé sans avoir vu les captures.
