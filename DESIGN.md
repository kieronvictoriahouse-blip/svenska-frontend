---
name: Swedish Cravings
description: Épicerie suédoise en ligne, ton éditorial et chaleureux, « Bringing Sweden to your table »
colors:
  taupe: "#A99282"
  taupe-soft: "#A99282CC"
  taupe-text: "#695A51"
  moss: "#4E6651"
  moss-soft: "#4E6651CC"
  moss-light: "#AFBAB1"
  moss-hover: "#435745"
  sand: "#E9DDCF"
  ink: "#1B2118"
  warm-white: "#FEFCF7"
  parchment: "#EEE6D6"
  linen: "#DDD3BE"
  birch: "#C6BAAA"
  driftwood: "#9A8B74"
  slate: "#3A4636"
  dust: "#55614F"
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
  display-word:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(34px, 3.4vw, 46px)"
    fontWeight: 300
    lineHeight: 1
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
    fontSize: "14px"
    fontWeight: 400
  ui-label:
    fontFamily: "Jost, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "2px"
  ui-eyebrow:
    fontFamily: "Jost, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "3px"
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
  touch-target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.snow}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.hairline}"
    padding: "15px 36px"
  button-primary-hover:
    backgroundColor: "{colors.moss-hover}"
  button-cart:
    backgroundColor: "{colors.taupe}"
    textColor: "{colors.ink}"
    typography: "{typography.ui-label}"
    rounded: "{rounded.hairline}"
    padding: "10px 22px"
  button-cart-hover:
    backgroundColor: "{colors.taupe-soft}"
  button-checkout:
    backgroundColor: "{colors.taupe}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "14px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.taupe-text}"
    rounded: "{rounded.hairline}"
    padding: "13px 32px"
  product-card:
    backgroundColor: "{colors.snow}"
    rounded: "0"
    padding: "{spacing.card-body}"
  badge:
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "4px 9px"
---

# Design System: Swedish Cravings

## Overview

Épicerie fine suédoise en ligne, pensée comme un magazine culinaire plus que comme un supermarché : grandes photos, titres serif légers avec un mot en italique coloré, beaucoup d'air, presque aucun arrondi. Le registre est « éditorial nordique » : chaleureux, artisanal, calme, jamais criard. Ce qui la distingue d'une boutique générique : les rituels suédois (fredagsmys, fika, lördagsgodis), les vrais paquets de marques suédoises et la voix de la fondatrice, Victoria.

Le site est un design system en marque blanche. Les couleurs et polices de `css/style.css` sont des valeurs par défaut. Les valeurs réellement affichées viennent de la configuration de marque du back-office, injectées dans le HTML au build (`scripts/inject-wl.js`) puis réappliquées au chargement (`js/sd-api-client.js`, `applyWhiteLabel`). **Les jetons ci-dessus reprennent les valeurs en ligne du back-office (relevées le 2026-10-20) ; ce sont elles qui font foi** (décision de Kieron du 2026-10-22).

Mode Impeccable par surface : accueil, pages marques et pages recettes = *Persuade* ; boutique, fiche produit, panier, compte = *Operate* ; FAQ, livraison, pages légales = *Read*.

Ton visuel en trois mots : [à compléter par Kieron]

## Colors

### Primary
- **Taupe** (`--heather`, back-office `color_primary`) : aplats de marque (barre de langues, bandeau défilant, bouton panier, bouton de paiement, badge « Nouveau », menu mobile). Le texte posé sur un aplat taupe est **à l'encre** (`--on-heather`, 5,6:1), jamais blanc (2,95:1).
- **Taupe texte** (`--heather-text`, dérivé : 62 % du taupe + noir) : le taupe quand il sert de couleur de texte sur fond clair (noms de produits, titres de promesses, logo texte, bouton contour). 4,9:1 sur sable, 6,4:1 sur blanc chaud.

### Secondary
- **Mousse** (`--lingon`, back-office `color_secondary`) : appels à l'action principaux (`.btn-primary`), barre d'annonce, bandeau newsletter, mot en italique des titres, surtitres, liens « Voir tout ». Survol : `--lingon-hover` (mousse assombrie, le texte blanc reste lisible).
- **Mousse claire** (`--lingon-light`, dérivé : 45 % de mousse + blanc) : accents sur les fonds sombres (bandeau de saison, pied de page, barre d'achat collante). 8:1 sur l'encre.
- Les variantes sont calculées avec `color-mix()` à partir des couleurs du back-office : si Kieron change la palette, elles suivent. Si la couleur primaire devenait foncée, `--on-heather` devrait repasser en blanc.

### Neutral
- **Sable** (`--cream`, back-office `color_bg`) : fond de l'en-tête, des rituels, de l'histoire et du tiroir panier.
- **Blanc chaud** `warm-white` : fond de page. **Neige** `snow` : fond des cartes produit.
- **Parchemin / Lin / Bouleau / Bois flotté** : fonds secondaires, filets de 1px, bordure de carte au survol. **Jamais de texte en bouleau** (1,9:1).
- **Encre** (`--midnight`, back-office `color_text`) : texte principal, titres de section, pied de page, bandeau sombre de saison.
- **Ardoise** `slate` (texte courant) et **Poussière** `dust` (texte secondaire, mentions ; assombrie à `#55614F` pour passer 4,5:1 sur tous les fonds clairs).

### Couleurs du logo
Le logo (monogramme « SC » entrelacé surmonté d'une couronne) utilise un vert mousse foncé (`logo-moss`, `logo-wordmark`), un or patiné pour la couronne (`logo-gold`) et un fond crème (`logo-cream`). Fichiers : `img/sc-logo-horizontal.jpg`, `img/sc-logo-vertical.jpg`, `img/sc-logo-vertfond.jpg`, `img/sc-monogramme.png`.

### Named Rules
- **Un seul accent.** Les titres sont à l'encre ; seul le mot en italique est coloré (mousse sur fond clair, mousse claire sur fond sombre, mousse éclaircie `--hero-accent` sur photo).
- **Contraste d'abord.** Texte courant et texte d'exemple des champs ≥ 4,5:1, grands titres ≥ 3:1. Sur un aplat coloré, le texte prend une teinte de cet aplat ou l'encre, jamais un gris ni du blanc transparent sous 70 %.
- **Le rouge est réservé aux promotions.** `promo-red` ne sert qu'aux prix barrés, aux pastilles de remise et au prix soldé.

### Écarts connus (à arbitrer, ne pas « corriger » sans accord)
- Les valeurs par défaut du CSS (`--heather` vert `#3D5239`, `--lingon` orange airelle `#C4733A`, `--cream` `#F8F4ED`) ne sont qu'un repli si le back-office ne répond pas.
- `--lingon-pale` et `--lingon-deep` sont définis mais pas utilisés dans `style.css`.
- La boutique (`js/catalog-v3.js`) a ses propres couleurs de cartes et son format de prix (« €4,89 ») : à aligner sur ce système.
- Surtitres en capitales au-dessus des titres, mot de titre en italique et fond crème sont signalés par le détecteur Impeccable comme des tics de sites générés. Ils font partie de l'identité actuelle et sont gardés ; les surtitres sont la piste la plus simple si l'on veut alléger.

## Typography

Trois familles, chargées depuis Google Fonts :
- **Cormorant Garamond** (`--font-display`) : titres, noms de produits, prix, mots suédois des rituels. Graisse 300 pour les grands titres, 600 pour les noms et les prix. Un mot du titre passe en italique coloré (`<em>`).
- **Crimson Pro** (`--font-body`) : texte courant, 17-18px, interligne généreux (1,7 à 2,0). L'italique sert aux mentions discrètes (origine produit, liens « recette »).
- **Jost** (`--font-ui`) : tout ce qui est interface (boutons, navigation, surtitres, badges, étiquettes) en capitales espacées, **11 à 12px**, interlettrage de 1 à 3px.

### Hierarchy
1. Hero : Cormorant 300, `clamp(56px, 9vw, 112px)`, 46px sous 600px.
2. Titre de section : Cormorant 300, `clamp(28px, 3.5vw, 52px)`, à l'encre, précédé d'un surtitre Jost 11px en mousse.
3. Mot de rituel : Cormorant 300 italique, `clamp(34px, 3.4vw, 46px)`.
4. Nom de produit / titre de carte : Cormorant 600, 16-17px.
5. Prix : Cormorant 600, 18-26px selon le contexte, chiffres alignés.
6. Texte courant : Crimson Pro 17px.
7. Étiquettes d'interface : Jost 11-12px, capitales.

### Named Rules
- **Plancher de 11px.** Aucun texte d'interface ou d'information sous 11px (seule exception : le slogan du logo, qui fait partie du logotype).
- **Les chiffres parlent en Cormorant.** Prix et chiffres s'affichent en Cormorant (ou en Jost pour les notes), jamais en Crimson.
- **Prix au format de la langue.** « 6,19 € » en français, « €6.19 » en anglais, couronnes en suédois (`fmtPrice`).
- **Notes chiffrées, pas d'étoiles.** Cartes produit et avis : « 4,8/5 », en Jost.
- **Guillemets de la langue.** « … » avec espaces insécables en français, “…” en anglais, ”…” en suédois (`_sdQuote` normalise les citations du CMS).

## Layout

- Largeur maximale de 1280px, centrée.
- Sections : 72-80px en haut et en bas, 40px sur les côtés ; 60px / 24px sous 1024px ; 48px / 20px sous 600px.
- Points de rupture : 1024px (menu burger, grilles en 3 colonnes), 768px (en-tête compact, langues dans le menu, annonce sur une ligne), 600px (grilles en 2 colonnes, rituels empilés, rayons en rail), 480px, 400px.
- Grilles produits : 4 colonnes sur ordinateur, 3 sur tablette, 2 sur téléphone. Sur l'accueil : 8, 6 puis 4 produits par liste.
- Le hero tient dans l'écran sous l'en-tête (`calc(100svh - 152px)`, 96px sur mobile).
- **Accueil, dans l'ordre :** hero, bandeau défilant, promesses, rituels, best-sellers, rayons, bandeau de saison, nouveautés, histoire (signée par Victoria), avis (si disponibles), newsletter.
- **En-tête collant sur l'accueil** (`#header-root { display: contents }`). À étendre aux autres pages une fois la boutique adaptée (elle mesure `#header-root` pour placer ses barres).

## Elevation & Depth

Profondeur très discrète : la séparation passe d'abord par des filets de 1px et des changements de fond, l'ombre vient seulement au survol ou pour les surcouches.
- `--shadow-sm` `0 2px 12px rgba(27,33,24,0.07)` : survol des cartes catégorie.
- `--shadow-md` `0 6px 32px rgba(27,33,24,0.11)` : survol des cartes produit.
- `--shadow-lg` `0 16px 56px rgba(27,33,24,0.16)` : tiroir panier, recherche, toast.
- Voiles sur photo : encre (`rgba(27,33,24,…)`), dense au centre derrière le texte et en bas.

## Shapes

Angles quasi droits partout : 1px sur les boutons et badges, 2px sur les boîtes (recherche, vignettes). Le rond (`50%`) est réservé aux pastilles (compteur du panier, bouton favori, portrait de la fondatrice, bulles flottantes).

## Components

### Buttons
Texte Jost en capitales espacées, angles à 1px, aucun dégradé. Primaire = fond mousse, texte blanc ; panier et paiement = fond taupe, texte encre ; secondaire sur fond sombre = contour blanc à 55 % ; contour = filet taupe texte qui se remplit au survol. Transition de 0,2s sur la couleur de fond. Toute cible tactile fait au moins 44px (zone étendue par un pseudo-élément si le visuel est plus petit).

### Cards / Containers
Carte produit : fond neige, filet `linen`, aucun arrondi. Le nom du produit est un vrai lien `<a class="prod-link">` étiré sur toute la carte ; « + » et favori restent au-dessus, nommés pour les lecteurs d'écran. Au survol ou au focus clavier : bordure bois flotté, `shadow-md`, apparition des boutons (toujours visibles sur écran tactile). Corps : catégorie (Jost 11px, mousse), nom (Cormorant 600, taupe texte), origine (Crimson italique, poussière), puis prix et poids. Stock : seules les exceptions s'affichent (« Stock limité » sur parchemin, « Bientôt disponible » sur encre).

Carte rayon : texte seul, sans emoji, nom en Cormorant 20px et nombre de produits ; un filet mousse de 2px se déploie au survol. Lien vers `boutique.html?rayon=<slug>`, qui fait défiler la boutique jusqu'au rayon.

### Navigation
Barre de langues (FR / EN / SV) sur fond taupe, texte encre (dans le menu sur mobile). Barre d'annonce sur fond mousse : sur mobile, seul le premier message, sur une ligne. En-tête sur fond sable avec monogramme et logo texte ; menu : Accueil, Boutique, Maison, Recettes, Notre histoire, Contact. Menu burger plein écran sous 1024px, avec les rayons et les langues. Échap ferme menu, recherche et panier ; le focus revient au bouton d'origine. Lien « Aller au contenu » en premier arrêt clavier.

### Signature components
- **Rituels** : un petit dictionnaire de trois mots suédois (fredagsmys, fika, lördagsgodis). Pour chacun : photo de la box, mot en Cormorant italique (`lang="sv"`), catégorie grammaticale, définition, lien vers la box (prix relu dans le catalogue) et vers la recette ou le guide.
- **Signature de la fondatrice** : sous « Notre histoire », prénom en Cormorant italique et rôle en Jost ; portrait rond de 72px dès qu'une photo est fournie (clé CMS `founder_photo`).
- **Bandeau défilant** sous le hero : fond taupe, Jost 11px encre, bouton pause (WCAG 2.2.2), immobile si l'utilisateur réduit les animations. Les messages de livraison sont calculés depuis les réglages, jamais saisis à la main.
- **Barre de promesses** en texte seul : livraison offerte (seuils des réglages), saveurs authentiques, paiement sécurisé, emballage soigné.
- **Tiroir panier** latéral avec barre de progression vers la livraison offerte.
- **Barre d'achat collante** sur la fiche produit.

## Do's and Don'ts

### Do:
- Partir des photos réelles : produits et box. Remplacer les images générées (paquets inventés) dès qu'une vraie photo existe.
- Garder les titres en Cormorant léger, à l'encre, avec un seul mot en italique coloré.
- Séparer les blocs par des filets de 1px et des changements de fond plutôt que par des ombres.
- Calculer tout chiffre commercial affiché (seuils de livraison, prix, nombres de produits) depuis les données, jamais en texte libre.
- Prévoir les trois langues (attributs `data-fr`, `data-en`, `data-sv`).
- Respecter `prefers-reduced-motion` et laisser le focus clavier visible (`:focus-visible` mousse, blanc sur fond sombre).

### Don't:
- Pas d'emoji dans l'interface.
- Pas d'étoiles pour les notes.
- Pas de texte blanc sur un aplat taupe, pas de texte en taupe clair ou en bouleau.
- Pas d'angles très arrondis, de glassmorphism ni de dégradés vifs.
- Pas de nouvelle couleur codée en dur : passer par les variables CSS, que le back-office peut surcharger.
- Pas d'affirmation non vérifiable (« 100 % origine certifiée », « sans conservateurs » sur de la confiserie).
- Ne jamais afficher de prix d'achat, de coefficient ou de marge côté client.
- Aucune clé d'API secrète côté front.

Références et anti-références visuelles : [à compléter par Kieron]
