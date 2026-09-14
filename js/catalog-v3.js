/* ═══════════════════════════════════════════════════════════════════════
   CATALOGUE v3 — « une seule page, on défile »
   Recréation fidèle du handoff « Restructuration du catalogue confiseries »
   (desktop + mobile), branchée sur le vrai système :
     · produits réels  → window.PRODUCTS (événement sdapi:ready)
     · panier existant → global `cart`, saveCart(), updateCartBadge()
     · i18n existant   → global LANG + onLangChange()  (jamais setLang ici)
     · photos          → p.photo   (aspect-ratio 1/1, object-fit cover)

   Le modèle produit ne porte pas de sous-rayon : on le dérive côté client
   (classifieur par mots-clés du nom + catégorie réelle). C'est une
   proposition de rangement — à valider/répliquer en back-office (Odoo).
   Chargé APRÈS app.js et AVANT sd-api-client.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Familles → sous-rayons (ordre d'affichage du design) ──
  var GROUPS = [
    ['Confiseries', ['Bonbons']],
    ['Apéritif & Snacks', ['Chips', 'Mélanges pour dips', 'Noix & apéritif', 'Fromages & tartinables', 'Soufflés & popcorn']],
    ['Épices & Marinades', ['Épices & poivres', 'Marinades & BBQ', 'Sel & aromates']],
    ['Sauces', ['Sauces & condiments']],
    ['Bake & Fika', ['Fika & pâtisserie']],
    ['Boissons', ['Boissons']]
  ];

  var TINTS = {
    'Bonbons': '#F6E3DC',
    'Épices & poivres': '#F3E7D2', 'Mélanges pour dips': '#EDE8D8', 'Sel & aromates': '#F0EBE0',
    'Marinades & BBQ': '#F2E4D0', 'Noix & apéritif': '#F3E9D9', 'Fromages & tartinables': '#F0E8D6',
    'Chips': '#F7E9D0', 'Soufflés & popcorn': '#F8EED4',
    'Fika & pâtisserie': '#F1EADC', 'Sauces & condiments': '#E6EDDE', 'Boissons': '#E4DAC8'
  };

  var SHORT = {
    'Bonbons': 'Bonbons',
    'Épices & poivres': 'Épices', 'Mélanges pour dips': 'Dips', 'Sel & aromates': 'Sel',
    'Marinades & BBQ': 'Marinades', 'Noix & apéritif': 'Noix', 'Fromages & tartinables': 'Fromages',
    'Chips': 'Chips', 'Soufflés & popcorn': 'Soufflés',
    'Fika & pâtisserie': 'Fika', 'Sauces & condiments': 'Sauces', 'Boissons': 'Boissons'
  };

  // Traductions des noms de sous-rayons / familles (FR/EN/SV)
  var SUB_I18N = {
    'Bonbons':            { fr: 'Bonbons',            en: 'Sweets',              sv: 'Godis' },
    'Épices & poivres':   { fr: 'Épices & poivres',   en: 'Spices & peppers',    sv: 'Kryddor & peppar' },
    'Marinades & BBQ':    { fr: 'Marinades & BBQ',    en: 'Marinades & BBQ',     sv: 'Marinader & BBQ' },
    'Mélanges pour dips': { fr: 'Mélanges pour dips', en: 'Dip mixes',           sv: 'Dipmixer' },
    'Noix & apéritif':    { fr: 'Noix & apéritif',    en: 'Nuts & nibbles',      sv: 'Nötter & tilltugg' },
    'Fromages & tartinables': { fr: 'Fromages & tartinables', en: 'Cheese & spreads', sv: 'Ost & bredbart' },
    'Sel & aromates':     { fr: 'Sel & aromates',     en: 'Salt & seasonings',   sv: 'Salt & smaksättare' },
    'Chips':              { fr: 'Chips & crackers',   en: 'Crisps & crackers',   sv: 'Chips & knäcke' },
    'Soufflés & popcorn': { fr: 'Soufflés & popcorn', en: 'Puffs & popcorn',     sv: 'Ostbågar & popcorn' },
    'Fika & pâtisserie':  { fr: 'Bake & Fika',        en: 'Bake & Fika',         sv: 'Baka & Fika' },
    'Sauces & condiments':{ fr: 'Sauces & condiments',en: 'Sauces & condiments', sv: 'Såser & tillbehör' },
    'Boissons':           { fr: 'Boissons',           en: 'Drinks',              sv: 'Drycker' }
  };
  var SHORT_I18N = {
    'Bonbons': { fr: 'Bonbons', en: 'Sweets', sv: 'Godis' },
    'Épices & poivres': { fr: 'Épices', en: 'Spices', sv: 'Kryddor' },
    'Marinades & BBQ': { fr: 'Marinades', en: 'Marinades', sv: 'Marinader' },
    'Mélanges pour dips': { fr: 'Dips', en: 'Dips', sv: 'Dip' },
    'Noix & apéritif': { fr: 'Noix', en: 'Nuts', sv: 'Nötter' },
    'Fromages & tartinables': { fr: 'Fromages', en: 'Cheese', sv: 'Ost' },
    'Sel & aromates': { fr: 'Sel', en: 'Salt', sv: 'Salt' },
    'Chips': { fr: 'Chips', en: 'Crisps', sv: 'Chips' },
    'Soufflés & popcorn': { fr: 'Soufflés', en: 'Puffs', sv: 'Bågar' },
    'Fika & pâtisserie': { fr: 'Bake & Fika', en: 'Bake & Fika', sv: 'Baka & Fika' },
    'Sauces & condiments': { fr: 'Sauces', en: 'Sauces', sv: 'Såser' },
    'Boissons': { fr: 'Boissons', en: 'Drinks', sv: 'Dryck' }
  };
  var FAM_I18N = {
    'Confiseries': { fr: 'Bonbons', en: 'Sweets', sv: 'Godis' },
    'Apéritif & Snacks': { fr: 'Apéritif & Snacks', en: 'Snacks & nibbles', sv: 'Tilltugg & snacks' },
    'Épices & Marinades': { fr: 'Épices & Marinades', en: 'Spices & marinades', sv: 'Kryddor & marinader' },
    'Bake & Fika': { fr: 'Bake & Fika', en: 'Bake & Fika', sv: 'Baka & Fika' },
    'Boissons': { fr: 'Boissons', en: 'Drinks', sv: 'Drycker' },
    'Sauces': { fr: 'Sauces', en: 'Sauces', sv: 'Såser' },
    'Autres': { fr: 'Autres', en: 'Other', sv: 'Övrigt' }
  };

  // « Envies » : filtres cumulatifs en OU
  var ENVIES = [
    ['sale', { fr: 'Salé', en: 'Salty', sv: 'Salt' }],
    ['sucre', { fr: 'Sucré', en: 'Sweet', sv: 'Sött' }],
    ['reglisse', { fr: 'Réglisse', en: 'Liquorice', sv: 'Lakrits' }],
    ['fika', { fr: 'Fika', en: 'Fika', sv: 'Fika' }],
    ['vegan', { fr: 'Vegan', en: 'Vegan', sv: 'Vegan' }],
    ['petit', { fr: 'Moins de €3', en: 'Under €3', sv: 'Under €3' }]
  ];

  // Badges (drapeaux) traduits
  var FLAG_I18N = {
    soon: { fr: 'Bientôt', en: 'Soon', sv: 'Snart' },
    new: { fr: 'Nouveau', en: 'New', sv: 'Nyhet' },
    low: { fr: 'Derniers', en: 'Last few', sv: 'Få kvar' },
    best: { fr: 'Best-seller', en: 'Best-seller', sv: 'Bästsäljare' },
    bestShort: { fr: 'Best', en: 'Best', sv: 'Bäst' }
  };

  // Chaînes d'interface
  var T = {
    heroEyebrow: { fr: 'Épicerie suédoise', en: 'Swedish grocery', sv: 'Svensk delikatess' },
    inStock: { fr: 'références en stock', en: 'items in stock', sv: 'varor i lager' },
    heroTitle1: { fr: 'Composez votre', en: 'Build your', sv: 'Sätt ihop ditt' },
    heroTitleEm: { fr: 'colis suédois', en: 'Swedish parcel', sv: 'svenska paket' },
    heroP: {
      fr: 'Tout le catalogue sur une seule page. Vous ajoutez au fil du scroll, le panier se remplit à droite — livraison offerte dès €',
      en: 'The whole catalogue on one page. Add as you scroll, the basket fills up on the right — free delivery from €',
      sv: 'Hela sortimentet på en sida. Lägg till medan du bläddrar, korgen fylls till höger — fri frakt från €'
    },
    searchPh: { fr: 'Rechercher un produit, une marque…', en: 'Search a product, a brand…', sv: 'Sök en produkt, ett märke…' },
    searchPhShort: { fr: 'Rechercher : bilar, OLW, salmiak…', en: 'Search: bilar, OLW, salmiak…', sv: 'Sök: bilar, OLW, salmiak…' },
    clear: { fr: 'Effacer', en: 'Clear', sv: 'Rensa' },
    products: { fr: 'produits', en: 'products', sv: 'produkter' },
    product: { fr: 'produit', en: 'product', sv: 'produkt' },
    ref: { fr: 'réf.', en: 'items', sv: 'varor' },
    catalogTitle: { fr: 'Le catalogue', en: 'The catalogue', sv: 'Sortimentet' },
    railFoot: {
      fr: 'Une envie précise&nbsp;? <a href="contact.html">Demandez-nous un produit</a> — on l\'ajoute au prochain conteneur.',
      en: 'Something specific in mind? <a href="contact.html">Ask us for a product</a> — we\'ll add it to the next container.',
      sv: 'Något särskilt i åtanke? <a href="contact.html">Be oss om en produkt</a> — vi lägger till den i nästa container.'
    },
    photo: { fr: 'photo produit', en: 'product photo', sv: 'produktfoto' },
    notify: { fr: 'Me prévenir', en: 'Notify me', sv: 'Meddela mig' },
    notified: { fr: 'Inscrit ✓', en: 'Subscribed ✓', sv: 'Anmäld ✓' },
    emptyTitle: { fr: 'Rien trouvé.', en: 'Nothing found.', sv: 'Inget hittat.' },
    emptyHint: { fr: 'Essayez « bilar », « OLW », « salmiak » ou « cannelle ».', en: 'Try “bilar”, “OLW”, “salmiak” or “cinnamon”.', sv: 'Prova ”bilar”, ”OLW”, ”salmiak” eller ”kanel”.' },
    seeAll: { fr: 'Voir les', en: 'See the', sv: 'Visa alla' },
    allCatalog: { fr: 'Tout le catalogue', en: 'Whole catalogue', sv: 'Hela sortimentet' },
    cartTitle: { fr: 'Votre panier', en: 'Your basket', sv: 'Din korg' },
    cartEmptyWord: { fr: 'Vide', en: 'Empty', sv: 'Tom' },
    articles: { fr: 'articles', en: 'items', sv: 'varor' },
    article: { fr: 'article', en: 'item', sv: 'vara' },
    cartEmptyExplain: {
      fr: 'Votre panier est vide. Ajoutez des produits avec le « + ».',
      en: 'Your basket is empty. Add products with the “+”.',
      sv: 'Din korg är tom. Lägg till varor med ”+”.'
    },
    cartEmptyShort: { fr: 'Votre panier est vide.', en: 'Your basket is empty.', sv: 'Din korg är tom.' },
    subtotal: { fr: 'Sous-total', en: 'Subtotal', sv: 'Delsumma' },
    order: { fr: 'Commander', en: 'Checkout', sv: 'Till kassan' },
    securePay: { fr: 'Paiement sécurisé', en: 'Secure payment', sv: 'Säker betalning' },
    shipped48: { fr: 'Expédié sous 48 h', en: 'Shipped within 48 h', sv: 'Skickas inom 48 h' },
    myBasket: { fr: 'Mon panier', en: 'My basket', sv: 'Min korg' },
    basketEmpty: { fr: 'Panier vide', en: 'Empty basket', sv: 'Tom korg' },
    shipFrom: {
      fr: 'Livraison offerte dès €{X} d’achat.',
      en: 'Free delivery from €{X}.',
      sv: 'Fri frakt från €{X}.'
    },
    shipLeft: {
      fr: 'Plus que {X} pour la livraison offerte.',
      en: 'Only {X} to go for free delivery.',
      sv: 'Bara {X} kvar till fri frakt.'
    },
    shipDone: {
      fr: 'Livraison offerte — colis expédié sous 48 h.',
      en: 'Free delivery — parcel shipped within 48 h.',
      sv: 'Fri frakt — paket skickas inom 48 h.'
    }
  };

  // Surcharges manuelles éventuelles du sous-rayon : mot-clé (normalisé) → sous-rayon.
  // Sert à corriger un rangement sans toucher au classifieur.
  var OVERRIDE = {};

  // ── État ──
  var state = { q: '', envies: {}, active: '', sheet: false, notified: {} };
  var _built = false, _sc = null, _headH = 0;

  var L = function () { return (typeof LANG !== 'undefined' ? LANG : 'fr'); };
  var tr = function (o) { return o[L()] || o.fr; };

  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function money(n) {
    n = Number(n) || 0;
    if (L() === 'sv' && typeof fmtPrice === 'function') { var s = fmtPrice(n); if (/kr/.test(s)) return s; }
    return '€' + n.toFixed(2).replace('.', ',');
  }

  function gramsOf(w) {
    w = norm(w).replace(',', '.');
    var m = w.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/);
    if (m) { var v = parseFloat(m[1]) * parseFloat(m[2]); return m[3] === 'kg' ? v * 1000 : v; }
    m = w.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
    if (m) { var v2 = parseFloat(m[1]); return m[2] === 'kg' ? v2 * 1000 : v2; }
    return 0;
  }

  function shopProducts() {
    var excl = (typeof SHOP_EXCLUDED_CATS !== 'undefined') ? SHOP_EXCLUDED_CATS : ['Art de la table', 'Maison & Déco'];
    return (window.PRODUCTS || []).filter(function (p) { return p && excl.indexOf(p.cat) === -1; });
  }

  // ⚠ ORDRE = priorité (première regex qui matche gagne). Les règles les plus
  // spécifiques d'abord ; les dips AVANT le fromage (dips au fromage) ; les
  // sauces AVANT le poivre (« sauce au poivre vert ») ; les biscuits AVANT le
  // chocolat (biscuits au chocolat). Testé sur les 82 produits réels.
  var CLASSIFY = [
    [/kexchoklad|\bjapp\b|ballerina|singoalla|biscuit/, 'Bonbons'],           // biscuits sucrés → Bonbons
    [/\bdip\b|dipmix|bearnaise/, 'Mélanges pour dips'],                       // avant fromage (dips « au fromage »)
    [/fromage|graddost|gräddost|vasterbotten|västerbotten|kavli|tartiner|\bost\b/, 'Fromages & tartinables'],
    [/\bnoix\b|cajou|edamame|\bfeves?\b|\bfèves?\b|pistache|cacahu|amandes? grill/, 'Noix & apéritif'],
    [/marinade|\brub\b|\bbbq\b|barbecue/, 'Marinades & BBQ'],
    [/\bsauce\b|hollandaise|cafe de paris|café de paris|bearnaise|béarnaise/, 'Sauces & condiments'], // avant poivre
    [/cheez|doodles|ostbagar|skruvar|popcorn|soufflé|souffle|\bbagar\b/, 'Soufflés & popcorn'],
    [/chips|dillchips|grillchips|lantchips|estrella|crackers?/, 'Chips'],
    [/o.?boy|chocolat chaud|chocolat en poudre|\bcacao\b|glogg|glögg|\bo\W?boy\b/, 'Boissons'],  // avant chocolat
    [/marabou|\bplopp\b|\bcenter\b|\bdumle\b|kexchoklad|choklad|chocolat|\bkorkat\b/, 'Bonbons'],
    [/lakrits|reglisse|salmiak|djungelvral|salta katten|tyrkisk|lakerol|\bkick\b|skumgodis|sockerbitar|spattor/, 'Bonbons'],
    [/\bbilar\b|ahlgrens|voitures|gott ?& ?blandat|tutti frutti|skumbanan|\bbubs\b|zoo|malaco|nappar|sursnoren|gelifi|\bgodis\b|gummy|pasteque|pastèque/, 'Bonbons'],
    [/falksalt|flingsalt|flocons de sel|sel d.?ail|herbes a gravlax|\bsel\b/, 'Sel & aromates'],
    [/parlsocker|kanelbullar|sucre perle|sucre perlé|sucre vanille|vaniljsocker|pate d.?amande|pâte d.?amande|dulce|\bamande/, 'Fika & pâtisserie'],
    [/poivre|peppar|cannelle|\bkanel\b|cardamome|kardemumma|genevrier|enbar|\baneth\b|\bdill\b|gravlax|kockens|santa maria|\bepice|krydd|paprika/, 'Épices & poivres'],
    [/kaviar|kalles|airelles|lingon|confiture|\bsylt\b|bla band/, 'Sauces & condiments']
  ];
  var CAT_FALLBACK = {
    'Confiseries': 'Bonbons', 'Chips & Snacks': 'Chips',
    'Épices': 'Épices & poivres', 'Mélanges': 'Épices & poivres', 'Farines & Graines': 'Épices & poivres', 'Flocons & Céréales': 'Épices & poivres',
    'Fika & Boulangerie': 'Fika & pâtisserie', 'Sucres & Sirops': 'Fika & pâtisserie', 'Pâtisserie & Essentiels': 'Fika & pâtisserie', 'Bake & Fika': 'Fika & pâtisserie',
    'Basics suédois': 'Sauces & condiments', 'Sauces': 'Sauces & condiments', 'Boissons': 'Boissons'
  };

  function sousRayonOf(p) {
    var n = norm((p.name && (p.name.fr || p.name[L()])) || '');
    for (var k in OVERRIDE) { if (OVERRIDE.hasOwnProperty(k) && n.indexOf(k) > -1) return OVERRIDE[k]; }
    for (var i = 0; i < CLASSIFY.length; i++) { if (CLASSIFY[i][0].test(n)) return CLASSIFY[i][1]; }
    if (CAT_FALLBACK[p.cat]) return CAT_FALLBACK[p.cat];
    return p.cat || 'Épices & poivres';
  }

  function familyOf(sub) {
    for (var i = 0; i < GROUPS.length; i++) { if (GROUPS[i][1].indexOf(sub) > -1) return GROUPS[i][0]; }
    return 'Autres';
  }

  // Modèle produit v3 (un objet par produit réel)
  function build(p) {
    var cid = p.uuid || p.id;
    var sale = !!(window.SDPrice && SDPrice.active(p));
    var price = sale ? SDPrice.effective(p.price, p) : (p.price || 0);
    var grams = gramsOf(p.weight);
    var sub = sousRayonOf(p);
    var parent = familyOf(sub);
    var tracked = !!p.trackStock && p.stock != null;
    var stock = tracked && p.stock <= 0 ? 'soon' : (tracked && p.stock <= 2 ? 'low' : 'in');
    // Envies dérivées
    var realTags = (p.tags || []).map(function (t) { return norm(t); });
    var nn = norm((p.name && (p.name.fr || p.name[L()])) || '');
    var tags = {};
    if (parent === 'Apéritif & Snacks' || parent === 'Épices & Marinades' || parent === 'Sauces') tags.sale = true;
    if (parent === 'Confiseries' || parent === 'Bake & Fika' || parent === 'Boissons') tags.sucre = true;
    if (/lakrits|reglisse|salmiak|djungelvral|salta katten|tyrkisk|\bkick\b|skumgodis|sockerbitar|spattor/.test(nn)) tags.reglisse = true;
    if (sub === 'Fika & pâtisserie' || /kanel|cannelle|kardemumma|cardamome|\bkex\b|ballerina|singoalla|parlsocker|kanelbullar/.test(nn)) tags.fika = true;
    if (realTags.indexOf('vegan') > -1 || realTags.indexOf('vegansk') > -1) tags.vegan = true;
    if (price > 0 && price < 3) tags.petit = true;
    if (p.bestseller) tags.best = true;
    if (p.isNew) tags.new = true;
    return {
      id: cid, uuid: p.uuid, rawId: p.id, ref: p,
      name: (p.name && p.name[L()]) || (p.name && p.name.fr) || '',
      sub: sub, parent: parent,
      price: price, sale: sale, oldPrice: p.price || 0,
      weight: p.weight || '',
      origin: (typeof p.origin === 'object' && p.origin) ? (p.origin[L()] || p.origin.fr || '') : (p.origin || ''),
      grams: grams, stock: stock,
      tint: TINTS[sub] || '#F1EADC',
      tags: tags,
      photo: p.photo || ''
    };
  }

  // ── Panier (état partagé, ajout SILENCIEUX — pas de drawer ni toast) ──
  function cartMap() { return (typeof cart !== 'undefined' && cart) ? cart : {}; }
  function keyOf(cid) { return String(cid); }
  function qtyOf(cid) { var c = cartMap(); return c[keyOf(cid)] || 0; }

  function snapshot(v) {
    try {
      var cp = JSON.parse(localStorage.getItem('sd_cart_products') || '{}');
      cp[String(v.id)] = {
        name: v.ref.name, photo: v.photo, price: v.ref.price, weight: v.weight,
        variants: v.ref.variants || [], pickup_only: !!v.ref.pickup_only,
        discountType: v.ref.discountType, discountValue: v.ref.discountValue,
        discountStart: v.ref.discountStart, discountEnd: v.ref.discountEnd
      };
      localStorage.setItem('sd_cart_products', JSON.stringify(cp));
    } catch (e) {}
  }

  function bump(v, d) {
    if (typeof cart === 'undefined') return;
    var key = keyOf(v.id);
    // Contrôle de stock (réutilise les aides du site si présentes)
    if (d > 0 && typeof _sdStock === 'function') {
      var max = _sdStock(v.ref);
      var already = (typeof _sdCartQtyForProduct === 'function') ? _sdCartQtyForProduct(v.id) : (cart[key] || 0);
      if (isFinite(max) && already >= max) { if (typeof showToast === 'function' && typeof _sdStockMsg === 'function') showToast(_sdStockMsg('max')); return; }
    }
    var n = (cart[key] || 0) + d;
    if (n <= 0) delete cart[key]; else cart[key] = n;
    if (typeof saveCart === 'function') saveCart();
    if (d > 0) snapshot(v);
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof renderCartDrawer === 'function') renderCartDrawer();
    if (d > 0 && typeof sdTrackAddToCart === 'function') { try { sdTrackAddToCart(v.ref, 1); } catch (e) {} }
    renderDynamic();
  }
  function bumpId(cid, d) { var p = findProd(cid); if (p) bump(build(p), d); }
  function findProd(cid) {
    var list = window.PRODUCTS || [];
    for (var i = 0; i < list.length; i++) { if (String(list[i].uuid || list[i].id) === String(cid)) return list[i]; }
    return null;
  }

  // ── Dérivés (filtrage, sections, rail, panier) ──
  function compute() {
    var products = shopProducts().map(build);
    var q = state.q.trim().toLowerCase();
    var on = Object.keys(state.envies).filter(function (k) { return state.envies[k]; });

    var list = products.filter(function (p) {
      if (on.length && !on.some(function (t) { return p.tags[t]; })) return false;
      if (q) {
        var hay = (p.name + ' ' + p.sub + ' ' + p.parent + ' ' + p.origin).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    // Sections + rail dans l'ordre des familles ; sous-rayons inconnus rattachés à leur famille
    var order = [];
    GROUPS.forEach(function (g) { g[1].forEach(function (s) { order.push([g[0], s]); }); });
    // sous-rayons présents mais hors design → ajoutés à la fin (famille "Autres" ou repli)
    var known = {}; order.forEach(function (o) { known[o[1]] = true; });
    var extraSubs = {};
    list.forEach(function (p) { if (!known[p.sub]) extraSubs[p.sub] = p.parent; });
    Object.keys(extraSubs).forEach(function (s) { order.push([extraSubs[s], s]); });

    var sections = [], rail = [], lastFam = null;
    order.forEach(function (pair) {
      var fam = pair[0], sub = pair[1];
      var items = list.filter(function (p) { return p.sub === sub; });
      if (!items.length) return;
      if (fam !== lastFam) { rail.push({ lvl: 0, fam: fam, key: sub }); lastFam = fam; }
      var subLabel = SUB_I18N[sub] ? tr(SUB_I18N[sub]) : subLabelFallback(sub);
      var shortLabel = SHORT_I18N[sub] ? tr(SHORT_I18N[sub]) : subLabel;
      sections.push({ key: sub, title: subLabel, parent: fam, count: items.length, items: items });
      rail.push({ lvl: 1, key: sub, label: subLabel, short: shortLabel, count: items.length });
    });

    // Panier
    var ids = Object.keys(cartMap());
    var lines = ids.map(function (key) {
      var cid = key.indexOf('_') > -1 ? key.slice(0, key.indexOf('_')) : key;
      var raw = findProd(cid); if (!raw) return null;
      var v = build(raw); var qty = cartMap()[key];
      return { key: key, name: v.name, unit: v.weight + ' · ' + money(v.price), qty: qty, tint: v.tint, line: money(v.price * qty), v: v };
    }).filter(Boolean);

    var cartCount = ids.reduce(function (n, k) { return n + cartMap()[k]; }, 0);
    var cartTotal = lines.reduce(function (n, l) { return n + l.v.price * l.qty; }, 0);
    var threshold = (window.SD_SHIP && SD_SHIP.threshold) ? SD_SHIP.threshold(false) : 49;
    var suggestions = products.filter(function (p) { return p.tags.best && !qtyOf(p.id) && p.stock !== 'soon'; }).slice(0, 3);

    return {
      products: products, list: list, sections: sections, rail: rail,
      lines: lines, cartCount: cartCount, cartTotal: cartTotal, threshold: threshold,
      suggestions: suggestions, empty: cartCount === 0, dirty: !!q || on.length > 0
    };
  }
  function subLabelFallback(sub) { return (typeof CAT_LABELS !== 'undefined' && CAT_LABELS[sub] && CAT_LABELS[sub][L()]) || sub; }

  // ── Rendu ──
  function flagOf(v, mobile) {
    if (v.stock === 'soon') return { t: tr(FLAG_I18N.soon), bg: '#EFE8DC', fg: '#5B534B' };
    if (v.tags.new) return { t: tr(FLAG_I18N.new), bg: '#5F7052', fg: '#FFFDF9' };
    if (v.stock === 'low') return { t: tr(FLAG_I18N.low), bg: '#FBF1E4', fg: '#8A5B22' };
    if (v.tags.best) return { t: tr(mobile ? FLAG_I18N.bestShort : FLAG_I18N.best), bg: '#FFFFFF', fg: '#6B564A' };
    return null;
  }

  function cardHTML(v) {
    var qty = qtyOf(v.id);
    var soon = v.stock === 'soon';
    var flag = flagOf(v, false);
    var img = v.photo
      ? '<img class="c3-img" src="' + esc(v.photo) + '" alt="' + esc(v.name) + '" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<span class="c3-photo">' + esc(tr(T.photo)) + '</span>';
    var control;
    if (soon) {
      var nl = state.notified[v.id] ? tr(T.notified) : tr(T.notify);
      control = '<button class="c3-notify" data-notify="' + esc(v.id) + '">' + esc(nl) + '</button>';
    } else if (qty > 0) {
      control = '<div class="c3-step"><button data-dec="' + esc(v.id) + '">−</button><span>' + qty + '</span><button data-inc="' + esc(v.id) + '">+</button></div>';
    } else {
      control = '<button class="c3-add" data-add="' + esc(v.id) + '" title="' + esc(tr(T.order)) + '">+</button>';
    }
    var price = v.sale
      ? '<span class="c3-old">' + money(v.oldPrice) + '</span><span class="c3-price">' + money(v.price) + '</span>'
      : '<span class="c3-price">' + money(v.price) + '</span>';
    return '<article class="c3-card" data-nav="' + esc(v.id) + '">' +
      '<div class="c3-imgwrap" style="background:' + v.tint + '">' + img +
      (flag ? '<span class="c3-flag" style="background:' + flag.bg + ';color:' + flag.fg + '">' + esc(flag.t) + '</span>' : '') +
      control +
      '</div>' +
      '<div class="c3-cbody">' +
      '<div class="c3-name">' + esc(v.name) + '</div>' +
      '<div class="c3-meta"><span class="c3-meta-w">' + esc(v.weight) + '</span>' + (v.origin ? '<span class="c3-meta-o"> · ' + esc(v.origin) + '</span>' : '') + '</div>' +
      '<div class="c3-prices">' + price + '</div>' +
      '</div></article>';
  }

  function sectionsHTML(sections, empty, totalCount) {
    if (empty) {
      return '<div class="c3-empty">' +
        '<p class="c3-empty-t">' + esc(tr(T.emptyTitle)) + '</p>' +
        '<p class="c3-empty-h">' + esc(tr(T.emptyHint)) + '</p>' +
        '<button class="c3-empty-btn" data-clear>' + esc(tr(T.seeAll)) + ' ' + totalCount + ' ' + esc(tr(T.products)) + '</button></div>';
    }
    return sections.map(function (s) {
      var head = '<div class="c3-sechead"><h2>' + esc(s.title) + '</h2>' +
        '<span class="c3-seccount">' + s.count + ' ' + esc(s.count > 1 ? tr(T.products) : tr(T.product)) + '</span>' +
        '<span class="c3-secfam">' + esc(FAM_I18N[s.parent] ? tr(FAM_I18N[s.parent]) : s.parent) + '</span></div>';
      var grid = '<div class="c3-grid">' + s.items.map(cardHTML).join('') + '</div>';
      return '<section class="c3-section" data-sec="' + esc(s.key) + '">' + head + grid + '</section>';
    }).join('');
  }

  function railHTML(rail) {
    var rows = rail.map(function (r) {
      if (r.lvl === 0) {
        return '<button class="c3-railfam" data-go="' + esc(r.key) + '"><span>' + esc(FAM_I18N[r.fam] ? tr(FAM_I18N[r.fam]) : r.fam) + '</span></button>';
      }
      var active = state.active === r.key;
      return '<button class="c3-railsub' + (active ? ' on' : '') + '" data-go="' + esc(r.key) + '">' +
        '<span>' + esc(r.label) + '</span><span class="c3-railcnt">' + r.count + '</span></button>';
    }).join('');
    return '<div class="c3-railtitle">' + esc(tr(T.catalogTitle)) + '</div>' + rows +
      '<div class="c3-railfoot">' + tr(T.railFoot) + '</div>';
  }

  function chipsHTML(rail) {
    return rail.filter(function (r) { return r.lvl === 1; }).map(function (r) {
      var active = state.active === r.key;
      return '<button class="c3-chip' + (active ? ' on' : '') + '" data-railkey="' + esc(r.key) + '" data-go="' + esc(r.key) + '">' +
        esc(r.short) + ' · ' + r.count + '</button>';
    }).join('');
  }

  function enviesHTML() {
    return ENVIES.map(function (e) {
      var on = !!state.envies[e[0]];
      return '<button class="c3-envie' + (on ? ' on' : '') + '" data-envie="' + e[0] + '">' + esc(tr(e[1])) + '</button>';
    }).join('');
  }

  function cartLinesHTML(lines) {
    return lines.map(function (l) {
      return '<div class="c3-line">' +
        '<span class="c3-line-tint" style="background:' + l.tint + '"></span>' +
        '<div class="c3-line-info"><span class="c3-line-name">' + esc(l.name) + '</span><span class="c3-line-unit">' + esc(l.unit) + '</span></div>' +
        '<div class="c3-line-step"><button data-dec="' + esc(l.v.id) + '">−</button><span>' + l.qty + '</span><button data-inc="' + esc(l.v.id) + '">+</button></div>' +
        '<span class="c3-line-total">' + l.line + '</span></div>';
    }).join('');
  }

  function suggestionsHTML(suggestions, small) {
    return suggestions.map(function (s) {
      return '<button class="c3-sugg" data-add="' + esc(s.id) + '">' +
        '<span class="c3-sugg-tint" style="background:' + s.tint + '"></span>' +
        '<span class="c3-sugg-name">' + esc(s.name) + '</span>' +
        '<span class="c3-sugg-price">' + money(s.price) + '</span></button>';
    }).join('');
  }

  function shipMsg(d) {
    var thr = d.threshold, left = Math.max(0, thr - d.cartTotal);
    if (d.empty) return tr(T.shipFrom).replace('{X}', thr.toFixed(0));
    if (left > 0) return tr(T.shipLeft).replace('{X}', money(left));
    return tr(T.shipDone);
  }

  // Rendu de la partie dynamique (n'écrase PAS le champ de recherche)
  function renderDynamic() {
    var d = compute();
    var host = document.getElementById('cat3-root'); if (!host) return;

    // Envies (desktop + mobile partagent la même liste, on met à jour les deux)
    document.querySelectorAll('.c3-envies').forEach(function (el) { el.innerHTML = enviesHTML(); });
    // Compteur de résultats + Effacer
    var rl = d.list.length + ' ' + (d.list.length > 1 ? tr(T.products) : tr(T.product));
    document.querySelectorAll('.c3-result').forEach(function (el) { el.textContent = rl; });
    document.querySelectorAll('.c3-clearwrap').forEach(function (el) { el.style.display = d.dirty ? '' : 'none'; });

    // Rail (desktop) + chips (mobile)
    var railEl = document.getElementById('c3-rail'); if (railEl) railEl.innerHTML = railHTML(d.rail);
    var chipsEl = document.getElementById('c3-chips'); if (chipsEl) chipsEl.innerHTML = chipsHTML(d.rail);

    // Sections
    var mainEl = document.getElementById('c3-main');
    if (mainEl) mainEl.innerHTML = sectionsHTML(d.sections, d.list.length === 0, d.products.length);

    // Panier desktop
    var cartEl = document.getElementById('c3-cart');
    if (cartEl) cartEl.innerHTML = cartPanelHTML(d);
    // Barre panier mobile
    var mbar = document.getElementById('c3-mobar');
    if (mbar) mbar.innerHTML = mobileBarHTML(d);

    // Hero eyebrow (compteur références) + seuil livraison (hero statique)
    document.querySelectorAll('.c3-refcount').forEach(function (el) { el.textContent = d.products.length; });
    document.querySelectorAll('.c3-shipthr').forEach(function (el) { el.textContent = d.threshold.toFixed(0); });

    fillHero(d.products);
    updateScrollSpy();
  }

  // Remplit les 3 blocs d'ambiance du hero avec de vraies photos produit variées.
  var _heroFilled = false;
  function fillHero(products) {
    var blocks = [document.querySelector('.c3-hg1'), document.querySelector('.c3-hg2'), document.querySelector('.c3-hg3')];
    if (!blocks[0]) return;
    var withPhoto = products.filter(function (p) { return p.photo; });
    if (_heroFilled || !withPhoto.length) return;
    function pick(pred) {
      var b = withPhoto.filter(function (p) { return pred(p) && p.tags.best; });
      if (!b.length) b = withPhoto.filter(pred);
      return b[0] || null;
    }
    var used = {};
    var picks = [
      pick(function (p) { return p.parent === 'Confiseries'; }),
      pick(function (p) { return p.parent === 'Bake & Fika' || p.sub === 'Fika & pâtisserie'; }),
      pick(function (p) { return p.parent === 'Apéritif & Snacks' || p.sub === 'Chips'; })
    ];
    var pool = withPhoto.slice();
    picks = picks.map(function (pk) {
      // évite les doublons ; complète depuis le pool si un créneau est vide
      while ((!pk || used[pk.id]) && pool.length) pk = pool.shift();
      if (pk) used[pk.id] = true;
      return pk;
    });
    blocks.forEach(function (el, i) {
      var pk = picks[i]; if (!el || !pk) return;
      el.innerHTML = '<img src="' + esc(pk.photo) + '" alt="' + esc(pk.name) + '" loading="lazy" onerror="this.remove()" style="width:100%;height:100%;object-fit:contain;padding:14px;display:block">';
    });
    _heroFilled = true;
  }

  function cartPanelHTML(d) {
    var head = '<div class="c3-cart-head"><span class="c3-cart-title">' + esc(tr(T.cartTitle)) + '</span>' +
      '<span class="c3-cart-count">' + (d.empty ? esc(tr(T.cartEmptyWord)) : d.cartCount + ' ' + esc(d.cartCount > 1 ? tr(T.articles) : tr(T.article))) + '</span></div>';
    var body;
    if (d.empty) {
      body = '<div class="c3-cart-empty"><p>' + esc(tr(T.cartEmptyExplain)) + '</p></div>';
    } else {
      body = '<div class="c3-cart-lines">' + cartLinesHTML(d.lines) + '</div>';
    }
    var pct = Math.min(100, (d.cartTotal / d.threshold) * 100).toFixed(1);
    var foot = '<div class="c3-cart-foot">' +
      '<div class="c3-bar"><div class="c3-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<p class="c3-shipmsg">' + esc(shipMsg(d)) + '</p>' +
      '<div class="c3-subtotal"><span>' + esc(tr(T.subtotal)) + '</span><span class="c3-total">' + money(d.cartTotal) + '</span></div>' +
      '<button class="c3-order' + (d.empty ? ' off' : '') + '"' + (d.empty ? ' disabled' : ' data-checkout') + '>' + esc(tr(T.order)) + '</button>' +
      '<div class="c3-trust"><span>' + esc(tr(T.securePay)) + '</span><span>' + esc(tr(T.shipped48)) + '</span></div>' +
      '</div>';
    return head + body + foot;
  }

  function mobileBarHTML(d) {
    var pct = Math.min(100, (d.cartTotal / d.threshold) * 100).toFixed(1);
    var sheet = '';
    if (state.sheet) {
      var inner = d.empty
        ? '<div class="c3-sheet-empty"><p>' + esc(tr(T.cartEmptyShort)) + '</p></div>'
        : '<div class="c3-sheet-lines">' + cartLinesHTML(d.lines) + '</div>';
      sheet = '<div class="c3-sheet"><div class="c3-sheet-head"><span>' + esc(tr(T.cartTitle)) + '</span>' +
        '<button class="c3-sheet-x" data-sheet-close>✕</button></div>' + inner + '</div>';
    }
    var label = d.empty ? tr(T.basketEmpty) : tr(T.myBasket) + ' · ' + d.cartCount + ' ' + (d.cartCount > 1 ? tr(T.articles) : tr(T.article));
    var bar = '<div class="c3-mobar-inner">' +
      '<div class="c3-mobar-bar"><div class="c3-mobar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="c3-mobar-pad">' +
      '<p class="c3-mobar-msg">' + esc(shipMsg(d)) + '</p>' +
      '<button class="c3-mobar-btn" data-sheet-toggle>' +
      '<span class="c3-mobar-label">' + esc(label) + '</span>' +
      '<span class="c3-mobar-right"><span class="c3-mobar-total">' + money(d.cartTotal) + '</span><span class="c3-mobar-chev">' + (state.sheet ? '▾' : '▴') + '</span></span>' +
      '</button></div></div>';
    return sheet + bar;
  }

  // Coquille statique (hero + barre de recherche + ossature) — champ de recherche préservé
  function renderShell() {
    var host = document.getElementById('cat3-root'); if (!host) return;
    var ph = tr(T.searchPh), phS = tr(T.searchPhShort);
    host.innerHTML =
      // NB : le HERO (h1 + intro) vit en HTML STATIQUE dans boutique.html (SEO
      // + i18n data-sv/fr/en). Ici on ne rend que les parties interactives.
      // BARRE STICKY (recherche + envies + résultat)
      '<div class="c3-filterbar"><div class="c3-filterbar-in">' +
        '<input id="c3-search" class="c3-search" type="text" placeholder="' + esc(ph) + '">' +
        '<div class="c3-envies c3-envies-desk"></div>' +
        '<span class="c3-result"></span>' +
        '<span class="c3-clearwrap" style="display:none"><button class="c3-clear" data-clear>' + esc(tr(T.clear)) + '</button></span>' +
      '</div></div>' +
      // MOBILE : header compact (marque + réf + search + chips)
      '<div class="c3-mhead"><div class="c3-mhead-row"><span class="c3-mbrand">Swedish Cravings</span><span class="c3-mref"><span class="c3-refcount">0</span> ' + esc(tr(T.ref)) + '</span></div>' +
        '<input id="c3-search-m" class="c3-search-m" type="text" placeholder="' + esc(phS) + '">' +
        '<div id="c3-chips" class="c3-chips"></div></div>' +
      // MOBILE : envies + résultat
      '<div class="c3-menvies"><div class="c3-envies c3-envies-mob"></div>' +
        '<div class="c3-clearwrap c3-mclear" style="display:none"><span class="c3-result"></span><button class="c3-clear" data-clear>' + esc(tr(T.clear)) + '</button></div></div>' +
      // CORPS
      '<div class="c3-body"><div class="c3-body-in">' +
        '<nav id="c3-rail" class="c3-rail"></nav>' +
        '<main id="c3-main" class="c3-main"></main>' +
        '<aside id="c3-cart" class="c3-cart"></aside>' +
      '</div></div>' +
      // MOBILE : barre panier + feuille
      '<div id="c3-mobar" class="c3-mobar"></div>';

    // Champs de recherche
    var s1 = document.getElementById('c3-search'), s2 = document.getElementById('c3-search-m');
    [s1, s2].forEach(function (inp) {
      if (!inp) return;
      inp.value = state.q;
      inp.addEventListener('input', function () {
        state.q = inp.value;
        var other = inp === s1 ? s2 : s1; if (other && other.value !== inp.value) other.value = inp.value;
        renderDynamic();
      });
    });

    // Délégation d'événements (une fois)
    host.addEventListener('click', onClick);
  }
  function shipThr() { var t = (window.SD_SHIP && SD_SHIP.threshold) ? SD_SHIP.threshold(false) : 49; return t.toFixed(0); }

  function onClick(e) {
    var el = e.target.closest('[data-add],[data-inc],[data-dec],[data-notify],[data-go],[data-envie],[data-clear],[data-checkout],[data-sheet-toggle],[data-sheet-close]');
    if (!el) {
      // Clic ailleurs sur une carte → fiche produit (allergènes, ingrédients, etc.)
      var card = e.target.closest('.c3-card[data-nav]');
      if (card) window.location.href = 'produit.html?id=' + encodeURIComponent(card.getAttribute('data-nav'));
      return;
    }
    if (el.hasAttribute('data-add')) { bumpId(el.getAttribute('data-add'), 1); return; }
    if (el.hasAttribute('data-inc')) { bumpId(el.getAttribute('data-inc'), 1); return; }
    if (el.hasAttribute('data-dec')) { bumpId(el.getAttribute('data-dec'), -1); return; }
    if (el.hasAttribute('data-notify')) { var id = el.getAttribute('data-notify'); state.notified[id] = true; renderDynamic(); return; }
    if (el.hasAttribute('data-go')) { goTo(el.getAttribute('data-go')); return; }
    if (el.hasAttribute('data-envie')) { var k = el.getAttribute('data-envie'); state.envies[k] = !state.envies[k]; renderDynamic(); return; }
    if (el.hasAttribute('data-clear')) { state.q = ''; state.envies = {}; var s1 = document.getElementById('c3-search'), s2 = document.getElementById('c3-search-m'); if (s1) s1.value = ''; if (s2) s2.value = ''; renderDynamic(); return; }
    if (el.hasAttribute('data-checkout')) { if (typeof openSnipcartCheckout === 'function') openSnipcartCheckout(); else window.location.href = 'panier.html'; return; }
    if (el.hasAttribute('data-sheet-toggle')) { state.sheet = !state.sheet; renderDynamic(); return; }
    if (el.hasAttribute('data-sheet-close')) { state.sheet = false; renderDynamic(); return; }
  }

  // ── Scroll-spy + saut de section ──
  function scrollContainer() { return null; } // desktop : window ; mobile : window aussi (page unique)
  function headOffset() {
    var hr = document.getElementById('header-root');
    var fb = document.querySelector('.c3-filterbar');
    var mob = window.matchMedia('(max-width:767px)').matches;
    if (mob) { var mh = document.querySelector('.c3-mhead'); return (mh ? mh.getBoundingClientRect().bottom : 120); }
    var base = (hr ? hr.offsetHeight : 0) + (fb ? fb.offsetHeight : 0);
    return base + 24;
  }
  function updateScrollSpy() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-sec]'));
    if (!nodes.length) { return; }
    var mob = window.matchMedia('(max-width:767px)').matches;
    var limit = mob ? headOffset() + 20 : 150 + (document.getElementById('header-root') ? document.getElementById('header-root').offsetHeight : 0);
    var cur = '';
    nodes.forEach(function (n) { if (n.getBoundingClientRect().top <= limit) cur = n.getAttribute('data-sec'); });
    if (!cur) cur = nodes[0].getAttribute('data-sec');
    if (cur !== state.active) {
      state.active = cur;
      // maj surbrillance sans tout re-rendre
      document.querySelectorAll('.c3-railsub').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-go') === cur); });
      var chips = document.getElementById('c3-chips');
      if (chips) {
        chips.querySelectorAll('.c3-chip').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-railkey') === cur); });
        var chip = chips.querySelector('.c3-chip[data-railkey="' + (window.CSS && CSS.escape ? CSS.escape(cur) : cur) + '"]');
        if (chip) { try { chips.scrollTo({ left: Math.max(0, chip.offsetLeft - 70), behavior: 'smooth' }); } catch (e) { chips.scrollLeft = Math.max(0, chip.offsetLeft - 70); } }
      }
    }
  }
  function goTo(key) {
    var el = document.querySelector('[data-sec="' + (window.CSS && CSS.escape ? CSS.escape(key) : key) + '"]');
    if (!el) return;
    var mob = window.matchMedia('(max-width:767px)').matches;
    var off = mob ? headOffset() + 12 : ((document.getElementById('header-root') ? document.getElementById('header-root').offsetHeight : 0) + (document.querySelector('.c3-filterbar') ? document.querySelector('.c3-filterbar').offsetHeight : 0) + 16);
    var y = el.getBoundingClientRect().top + window.pageYOffset - off;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Offsets sticky : hauteur du header du site (dynamique) → variables CSS
  function setOffsets() {
    var hr = document.getElementById('header-root');
    var h = hr ? Math.round(hr.getBoundingClientRect().height) : 0;
    var fb = document.querySelector('.c3-filterbar');
    var fbh = fb ? Math.round(fb.getBoundingClientRect().height) : 0;
    var r = document.documentElement.style;
    r.setProperty('--c3-top', h + 'px');
    r.setProperty('--c3-top2', (h + fbh) + 'px');
  }

  // ── i18n : re-rendu à chaque changement de langue (jamais setLang ici) ──
  window.onLangChange = function () { renderShell(); renderDynamic(); setOffsets(); };

  // ── Cycle de vie ──
  var _ready = false;
  function firstRender() { renderShell(); renderDynamic(); }

  function boot() {
    if (typeof initPage === 'function') initPage('shop');
    firstRender();
    setOffsets();
    // Le header du site est injecté de façon asynchrone → on remesure un peu après.
    setTimeout(setOffsets, 100); setTimeout(setOffsets, 500);
    window.addEventListener('scroll', function () { updateScrollSpy(); }, { passive: true });
    window.addEventListener('resize', function () { setOffsets(); updateScrollSpy(); });

    var fallback = setTimeout(function () { _ready = true; renderDynamic(); }, 4000);
    window.addEventListener('sdapi:ready', function () {
      clearTimeout(fallback); _ready = true; renderDynamic();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
