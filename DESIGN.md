---
name: Swedish Cravings
description: Épicerie suédoise en ligne, ton éditorial et chaleureux, « Bringing Sweden to your table »
colors:
  taupe: "#A99282"
  taupe-soft: "#A99282CC"
  moss: "#4E6651"
  moss-soft: "#4E6651CC"
  sand: "#E9DDCF"
  ink: "#1B2118"
  warm-white: "#FEFCF7"
  parchment: "#EEE6D6"
  linen: "#DDD3BE"
  birch: "#C6BAAA"
  driftwood: "#9A8B74"
  slate: "#3A4636"
  dust: "#6C7A68"
  snow: "#FFFFFF"
  sage-pale: "#EAF2E7"
  sage-light: "#8CAE86"
  promo-red: "#C0392B"
  logo-moss: "#4A5A41"
  logo-wordmark: "#3C4A35"
  logo-gold: "#A48C5C"
  logo-cream: "#F5EFE0"
typography:
  display-hero:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(56px, 9vw, 112px)"
    fontWeight: 300
    lineHeight: 0.97
    letterSpacing: "-2px"
  display-section:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(28px, 3.5vw, 52px)"
    fontWeight: 300
    lineHeight: 1.1
  display-item:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  price:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "21px"
    fontWeight: 600
  body:
    fontFamily: "Crimson Pro, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.9
  body-italic-note:
    fontFamily: "Crimson Pro, Georgia, serif"
    fontSize: "13px"
    fontWeight: 400
  ui-label:
    fontFamily: "Jost, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "2px"
  ui-eyebrow:
    fontFamily: "Jost, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "4px"
rounded:
  hairline: "1px"
  sm: "2px"
  round: "50%"
spacing:
  section-y: "72px"
  section-x: "40px"
  section-x-tablet: "24px"
  section-x-mobile: "20px"
  card-body: "18px"
  max-width: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.snow}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.hairline}"
    padding: "15px 36px"
  button-primary-hover:
    backgroundColor: "{colors.moss-soft}"
  button-cart:
    backgroundColor: "{colors.taupe}"
    textColor: "{colors.snow}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.hairline}"
    padding: "10px 22px"
  button-cart-hover:
    backgroundColor: "{colors.taupe-soft}"
  button-checkout:
    backgroundColor: "{colors.taupe}"
    textColor: "{colors.snow}"
    rounded: "{rounded.hairline}"
    padding: "14px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.taupe}"
    rounded: "{rounded.hairline}"
    padding: "13px 32px"
  product-card:
    backgroundColor: "{colors.snow}"
    rounded: "0"
    padding: "{spacing.card-body}"
  badge:
    textColor: "{colors.snow}"
    rounded: "{rounded.hairline}"
    padding: "4px 10px"
---

# Design System: Swedish Cravings

## Overview

Épicerie fine suédoise en ligne, pensée comme un magazine culinaire plus que comme un supermarché : grandes photos d'ambiance (fika, lacs, saisons), titres serif légers avec un mot en italique coloré, beaucoup d'air, presque aucun arrondi. Le registre est « éditorial nordique » : chaleureux, artisanal, calme, jamais criard.

Le site est un design system en marque blanche. Les couleurs et polices de `css/style.css` sont des valeurs par défaut. Les valeurs réellement affichées viennent de la configuration de marque du back-office, injectées dans le HTML au build (`scripts/inject-wl.js`) puis réappliquées au chargement (`js/sd-api-client.js`, `applyWhiteLabel`). **Les jetons ci-dessus reprennent les valeurs en ligne du back-office (relevées le 2026-10-20) ; ce sont elles qui font foi.**

Mode Impeccable par surface : accueil, pages marques et pages recettes = *Persuade* ; boutique, fiche produit, panier, compte = *Operate* ; FAQ, livraison, pages légales = *Read*.

Ton visuel en trois mots : [à compléter par Kieron]

## Colors

### Primary
- **Taupe** (`--heather`, back-office `color_primary`) : bouton panier, bouton de paiement, bandeau défilant, badges « nouveau », titres de cartes produit. Sa variante `taupe-soft` (même teinte à 80 % d'opacité) sert au survol.

### Secondary
- **Mousse** (`--lingon`, back-office `color_secondary`) : appels à l'action principaux (`.btn-primary`), barre d'annonce, bandeau newsletter, mot en italique des titres de section, liens « Voir tout ». Sa variante `moss-soft` sert aux surtitres et au survol.

### Neutral
- **Sable** (`--cream`, back-office `color_bg`) : fond de l'en-tête, des sections éditoriales et du tiroir panier.
- **Blanc chaud** `warm-white` : fond de page. **Neige** `snow` : fond des cartes produit.
- **Parchemin / Lin / Bouleau / Bois flotté** : fonds secondaires, filets de 1px, textes discrets, bordure de carte au survol.
- **Encre** (`--midnight`, back-office `color_text`) : texte principal, pied de page, bandeau sombre éditorial, barre d'achat collante.
- **Ardoise** `slate` (texte courant) et **Poussière** `dust` (texte secondaire, mentions).

### Couleurs du logo
Le logo (monogramme « SC » entrelacé surmonté d'une couronne) utilise un vert mousse foncé (`logo-moss`, `logo-wordmark`), un or patiné pour la couronne (`logo-gold`) et un fond crème (`logo-cream`). Fichiers : `img/sc-logo-horizontal.jpg`, `img/sc-logo-vertical.jpg`, `img/sc-logo-vertfond.jpg`, `img/sc-monogramme.png`.

### Named Rules
- **Un seul accent par écran.** L'italique coloré des titres porte l'accent ; on n'ajoute pas un deuxième accent vif à côté.
- **Le rouge est réservé aux promotions.** `promo-red` ne sert qu'aux prix barrés, aux pastilles de remise et au prix soldé.

### Écarts connus (à arbitrer, ne pas « corriger » sans accord)
- Les valeurs par défaut du CSS (`--heather` vert `#3D5239`, `--lingon` orange airelle `#C4733A`, `--cream` `#F8F4ED`) diffèrent de la configuration en ligne. **Décision de Kieron (2026-10-22) : la palette en ligne (taupe + mousse) fait référence** ; les valeurs du CSS ne sont qu'un repli si le back-office ne répond pas.
- Restes d'une ancienne palette violette dans `index.html` : fond du hero `#16091a`, voile `rgba(18,8,22,…)`, ombre du badge éditorial `rgba(123,79,123,0.4)`.
- `--lingon-pale` et `--lingon-deep` sont définis mais pas utilisés dans `style.css`.
- Pastilles de stock et rouge promo codés en dur (`#D1FAE5`, `#FEF3C7`, `#FEE2E2`, `#C0392B`) hors du système de jetons.
- `js/app.js` code en dur `#3E5238` comme couleur de repli du widget « Suggérer ».

## Typography

Trois familles, chargées depuis Google Fonts :
- **Cormorant Garamond** (`--font-display`) : titres, noms de produits, prix, chiffres clés. Graisse 300 pour les grands titres, 600 pour les noms et les prix. Un mot du titre passe en italique coloré (`<em>`).
- **Crimson Pro** (`--font-body`) : texte courant, 17-18px, interligne généreux (1,7 à 2,0). L'italique sert aux mentions discrètes (origine produit, notes de livraison).
- **Jost** (`--font-ui`) : tout ce qui est interface (boutons, navigation, surtitres, badges, étiquettes) en capitales espacées, 9 à 12px, interlettrage de 1,5 à 6px.

### Hierarchy
1. Hero : Cormorant 300, `clamp(56px, 9vw, 112px)`, 46px sous 600px.
2. Titre de section : Cormorant 300, `clamp(28px, 3.5vw, 52px)`, précédé d'un surtitre Jost en capitales suivi d'un filet de 28px.
3. Nom de produit / titre de carte : Cormorant 600, 16-17px.
4. Prix : Cormorant 600, 18-26px selon le contexte.
5. Texte courant : Crimson Pro 17px.
6. Étiquettes d'interface : Jost 9-12px, capitales.

### Named Rules
- **Les chiffres parlent en Cormorant.** Prix, statistiques et notes s'affichent en Cormorant (ou en Jost pour les notes chiffrées), jamais en Crimson.
- **Notes chiffrées sur les cartes produit.** Note en Jost 600 + séparateur + nombre d'avis, sans étoiles. Écart connu : le bloc « Avis clients » de l'accueil affiche, lui, des étoiles ★ (`index.html`, `.testi-stars`).

## Layout

- Largeur maximale de 1280px, centrée.
- Sections : 72-80px en haut et en bas, 40px sur les côtés ; 60px / 24px sous 1024px ; 48px / 20px sous 600px.
- Points de rupture utilisés : 1024px (navigation en menu burger, grilles en 2 colonnes), 768px (en-tête compact, cibles tactiles agrandies), 600px, 480px, 400px.
- Grilles produits : 4 colonnes (16px de gouttière) ou 3 colonnes (20px) sur desktop, 2 colonnes jusqu'au mobile.
- L'accueil alterne des blocs pleine largeur en deux colonnes texte/image (intro éditoriale, bandeau sombre de saison, histoire), séparés par des filets `linen`.

## Elevation & Depth

Profondeur très discrète : la séparation passe d'abord par des filets de 1px et des changements de fond, l'ombre vient seulement au survol ou pour les surcouches.
- `--shadow-sm` `0 2px 12px rgba(27,33,24,0.07)` : survol des cartes catégorie.
- `--shadow-md` `0 6px 32px rgba(27,33,24,0.11)` : survol des cartes produit.
- `--shadow-lg` `0 16px 56px rgba(27,33,24,0.16)` : tiroir panier, recherche, toast.

## Shapes

Angles quasi droits partout : 1px sur les boutons et badges, 2px sur les boîtes (recherche, vignettes). Le rond (`50%`) est réservé aux pastilles (compteur du panier, badge éditorial, bouton favori). Exceptions existantes : pastilles de stock (20px) et bouton flottant « Suggérer » (50px).

## Components

### Buttons
Texte Jost en capitales espacées, angles à 1px, aucun dégradé. Primaire = fond mousse ; panier et paiement = fond taupe ; secondaire sur fond sombre = contour blanc à 30 % ; contour = filet taupe qui se remplit au survol. Transition de 0,2s sur la couleur de fond.

### Cards / Containers
Carte produit : fond neige, filet `linen`, aucun arrondi. Image carrée sur dégradé parchemin vers sable. Au survol : bordure bois flotté, `shadow-md`, montée de 2px, zoom de l'image à 105 %, apparition des boutons ajout rapide et favori (toujours visibles sur écran tactile). Corps : catégorie (Jost 9px), nom (Cormorant 600), origine (Crimson italique), puis prix et poids.

Carte catégorie : texte seul, sans emoji ; un filet mousse de 2px se déploie de gauche à droite au survol.

### Navigation
Barre de langues (FR / EN / SV) sur fond taupe, barre d'annonce sur fond mousse, en-tête collant sur fond sable avec monogramme et logo texte. L'en-tête se réduit au défilement (76px → 56px). Menu burger plein écran sous 1024px.

### Signature components
- **Bandeau défilant** sous le hero (fond taupe, Jost 9px, points séparateurs).
- **Barre de promesses** en texte seul, sans icônes : livraison offerte, saveurs authentiques, paiement sécurisé, emballage soigné.
- **Tiroir panier** latéral avec barre de progression vers la livraison offerte.
- **Barre d'achat collante** sur la fiche produit.

## Do's and Don'ts

### Do:
- Partir des photos : produits réels et scènes suédoises (fika, saisons, lacs).
- Garder les titres en Cormorant léger avec un seul mot en italique coloré.
- Séparer les blocs par des filets de 1px et des changements de fond plutôt que par des ombres.
- Écrire les textes d'interface en Jost capitales, courts.
- Prévoir les trois langues (attributs `data-fr`, `data-en`, `data-sv`).

### Don't:
- Pas d'emoji dans l'interface (les cartes catégorie et la barre de promesses ont été volontairement passées en texte seul).
- Pas d'étoiles sur les cartes produit (notes chiffrées).
- Pas d'angles très arrondis, de glassmorphism ni de dégradés vifs.
- Pas de nouvelle couleur codée en dur : passer par les variables CSS, que le back-office peut surcharger.
- Ne jamais afficher de prix d'achat, de coefficient ou de marge côté client.
- Aucune clé d'API secrète côté front.

Références et anti-références visuelles : [à compléter par Kieron]
