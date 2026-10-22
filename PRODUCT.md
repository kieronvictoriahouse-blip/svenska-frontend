# Product: Swedish Cravings

> Ce dépôt est public. Ne rien écrire ici de confidentiel : pas de marge, de prix d'achat, de chiffre d'affaires, de budget publicitaire ni de donnée client.

## Platform

web

## Stack

- Front (ce dépôt) : site statique en HTML, CSS et JavaScript sans framework. Une page HTML par gabarit, fiches produit pré-rendues dans `produit/`, scripts de build dans `scripts/`. Déployé sur Vercel (`cleanUrls`, `/media/*` réécrit vers le stockage Supabase).
- Back-office séparé (`admin.swedishcravings.fr`, Next.js + Supabase) : catalogue, stock, commandes, contenus CMS et configuration de marque (couleurs, polices, textes d'annonce), lus par le front via `js/sd-api-client.js`.
- Paiement Stripe. Site trilingue français (par défaut), anglais et suédois, via les attributs `data-fr`, `data-en` et `data-sv`.

## Users

[à compléter par Kieron. Hypothèses à confirmer ou corriger :]
- Particuliers en France qui ont un lien avec la Suède (expatriés suédois et nordiques, personnes qui y ont vécu ou voyagé) et cherchent un produit précis qu'ils connaissent déjà.
- Curieux de la culture scandinave (fika, fredagsmys, design nordique) qui découvrent via les recettes ou Google Shopping.
- Acheteurs de cadeaux.
- Clients en Europe (Espagne, Portugal, Italie, Allemagne, Benelux, Suède).

## Product Purpose

Faire acheter en ligne des produits suédois authentiques (bonbons, chocolat, biscuits, épicerie salée, art de la table), importés de Suède et livrés en France et en Europe, avec une expérience qui donne envie de revenir.

Objectif principal d'une visite : [à compléter par Kieron, par exemple ajout au panier puis paiement, ou inscription à la newsletter pour une première visite]

## Positioning

Une épicerie fine suédoise à taille humaine, éditoriale et chaleureuse, face aux rayons « produits du monde » de la grande distribution et aux places de marché. La boutique se distingue par l'authenticité des marques (Marabou, Ahlgrens Bilar, OLW, Fazer, Kavli, Läkerol…), le soin de l'emballage et le contenu (recettes suédoises, guides par marque).

## Operating Context

- Une part importante du trafic arrive directement sur une fiche produit depuis Google Shopping ou la recherche, souvent sur mobile. [à confirmer par Kieron avec les données GA4]
- Le visiteur connaît souvent déjà le produit et veut vérifier le prix, le stock et les frais de port.

## Capabilities and Constraints

- Environ 70 produits, stock réel affiché sur les fiches.
- Panier en tiroir latéral, compte client, paiement par carte via Stripe et paiement fractionné selon éligibilité.
- Livraison en point relais, à domicile ou retrait. Le seuil de livraison offerte et les promotions de port sont réglés dans le back-office : ne jamais les coder en dur.
- Couleurs, polices, textes d'annonce et coordonnées sont pilotés par le back-office (marque blanche). Une couleur ajoutée au CSS doit passer par une variable.
- Bannière de consentement cookies (Consent Mode v2) obligatoire avant toute mesure.

## Brand Commitments

- Nom : Swedish Cravings. Slogan : « Bringing Sweden to your table ».
- Logo : monogramme « SC » entrelacé surmonté d'une couronne, vert mousse et or sur fond crème (`img/`).
- Authenticité : produits importés de Suède, jamais d'imitations.

## Evidence on Hand

- Photos produits (stockage Supabase) et photos d'ambiance gérées dans le CMS du back-office (`media/cms/`).
- Pages recettes, pages marques (OLW, Ahlgrens Bilar), bonbons suédois, maison.
- Avis clients (`avis.html`), flux Google Shopping (`google-shopping.xml`).

## Product Principles

[à compléter par Kieron. Exemples possibles : « le prix et le stock se voient sans défiler », « chaque page donne une raison de rester (recette, histoire du produit) », « aucune surprise sur les frais de port »]

## Accessibility & Inclusion

- Trois langues : chaque texte visible a sa version FR, EN et SV.
- Cible : WCAG 2.2 AA (contraste, focus clavier visible, cibles tactiles d'au moins 44px). [à confirmer par Kieron]
- Respecter `prefers-reduced-motion` pour les animations décoratives (bandeau défilant, apparitions au défilement).
