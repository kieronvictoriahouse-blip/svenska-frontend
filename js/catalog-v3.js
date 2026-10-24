/* ═══════════════════════════════════════════════════════════════════════
   CATALOGUE v3 — « une seule page, on défile »
   Branché sur le système commun (js/app.js) :
     · produits   → window.PRODUCTS (événement sdapi:ready, {fallback:true} si l'API échoue)
     · panier     → global `cart`, saveCart(), updateCartBadge(), renderCartDrawer()
     · langue     → global LANG + onLangChange()  (jamais setLang ici)
     · prix       → fmtPrice() (« 6,19 € », « €6.19 », couronnes) ; sd:currency
     · recherche  → sdMatches() (sans accents, tous les mots, trois langues)
     · fiches     → sdProductUrl() (/produit/<slug>), vrais liens <a>
     · vignettes  → sdThumb() / sdThumbSet() (/media-w/<largeur>/…)
     · livraison  → SD_SHIP.rules() / sdShipLine() (jamais de seuil en dur)
   Rayons = catégories de l'admin ; les box ont leur section en tête.
   Recherche, envies, tri et rayon vivent dans l'URL (?q=, ?f=, ?tri=, ?rayon=) ;
   la position de défilement est rendue au retour arrière (sessionStorage).
   Chargé APRÈS app.js et AVANT sd-api-client.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // « Petit prix » : sous ce montant en euros (filtre « Moins de … »)
  var CHEAP = 3;

  // « Envies » : filtres cumulatifs en OU
  var ENVIES = [
    ['sale', { fr: 'Salé', en: 'Salty', sv: 'Salt' }],
    ['sucre', { fr: 'Sucré', en: 'Sweet', sv: 'Sött' }],
    ['reglisse', { fr: 'Réglisse', en: 'Liquorice', sv: 'Lakrits' }],
    ['fika', { fr: 'Fika', en: 'Fika', sv: 'Fika' }],
    ['vegan', { fr: 'Vegan', en: 'Vegan', sv: 'Vegan' }],
    ['petit', { fr: 'Moins de {X}', en: 'Under {X}', sv: 'Under {X}' }]
  ];
  var ENVIE_KEYS = {}; ENVIES.forEach(function (e) { ENVIE_KEYS[e[0]] = 1; });

  // Tri (gardé dans l'URL : ?tri=)
  var SORTS = [
    ['', { fr: 'Pertinence', en: 'Relevance', sv: 'Relevans' }],
    ['prix-asc', { fr: 'Prix croissant', en: 'Price: low to high', sv: 'Pris stigande' }],
    ['prix-desc', { fr: 'Prix décroissant', en: 'Price: high to low', sv: 'Pris fallande' }],
    ['nouveautes', { fr: 'Nouveautés', en: 'Newest', sv: 'Nyheter' }]
  ];
  var SORT_KEYS = {}; SORTS.forEach(function (s) { SORT_KEYS[s[0]] = 1; });

  // Ordre marchand des rayons (slug de catégorie) ; inconnus à la fin, par nom.
  var ORDER = { 'confiseries': 1, 'chocolat': 2, 'dips': 3, 'snacks-chips': 4, 'fromages-tartinables': 5, 'epices': 6, 'sauces': 7, 'patisserie-basics': 8, 'boissons': 9 };

  // Termes proposés quand la recherche ne trouve rien (vérifiés sur le catalogue)
  var HINTS = ['bilar', 'OLW', 'salmiak', 'Marabou'];

  var FLAG = {
    // Épuisé : rangé en fin de liste, la fiche propose l'alerte de retour
    out: { fr: 'Bientôt de retour', en: 'Back soon', sv: 'Snart tillbaka' },
    pickup: { fr: 'Retrait uniquement', en: 'Pickup only', sv: 'Endast upphämtning' },
    new: { fr: 'Nouveau', en: 'New', sv: 'Nyhet' },
    low: { fr: 'Stock limité', en: 'Limited stock', sv: 'Begränsat lager' },
    best: { fr: 'Best-seller', en: 'Best-seller', sv: 'Bästsäljare' }
  };

  // Chaînes d'interface (FR / EN / SV)
  var T = {
    tableEyebrow: { fr: 'Pour la table', en: 'For the table', sv: 'Till bordet' },
    tableTitle: { fr: 'Serviettes <em>scandinaves</em>', en: 'Scandinavian <em>napkins</em>', sv: 'Skandinaviska <em>servetter</em>' },
    tableText: { fr: 'Serviettes en papier aux motifs nordiques ({B}), dès {P}. Pour le fika, l’apéro, ou à glisser avec une box cadeau.',
      en: 'Paper napkins with Nordic patterns ({B}), from {P}. For fika, drinks, or to slip in with a gift box.',
      sv: 'Pappersservetter med nordiska mönster ({B}), från {P}. Till fikat, fredagsmyset eller med en presentlåda.' },
    tableLink: { fr: 'Voir les serviettes', en: 'See the napkins', sv: 'Se servetterna' },
    searchLabel: { fr: 'Rechercher dans la boutique', en: 'Search the shop', sv: 'Sök i butiken' },
    searchPh: { fr: 'Rechercher un produit, une marque…', en: 'Search a product, a brand…', sv: 'Sök en produkt, ett märke…' },
    searchPhShort: { fr: 'Rechercher : bilar, OLW, salmiak…', en: 'Search: bilar, OLW, salmiak…', sv: 'Sök: bilar, OLW, salmiak…' },
    enviesLabel: { fr: 'Filtrer par envie', en: 'Filter by craving', sv: 'Filtrera efter sug' },
    railLabel: { fr: 'Rayons', en: 'Aisles', sv: 'Avdelningar' },
    sortLabel: { fr: 'Trier', en: 'Sort', sv: 'Sortera' },
    clear: { fr: 'Effacer', en: 'Clear', sv: 'Rensa' },
    clearLabel: { fr: 'Effacer la recherche et les filtres', en: 'Clear search and filters', sv: 'Rensa sökning och filter' },
    products: { fr: 'produits', en: 'products', sv: 'produkter' },
    product: { fr: 'produit', en: 'product', sv: 'produkt' },
    ref: { fr: 'réf.', en: 'items', sv: 'varor' },
    catalogTitle: { fr: 'Le catalogue', en: 'The catalogue', sv: 'Sortimentet' },
    boxTitle: { fr: 'Nos box', en: 'Our boxes', sv: 'Våra lådor' },
    boxNote: { fr: 'Composées par Victoria, prêtes à offrir', en: 'Put together by Victoria, ready to gift', sv: 'Utvalda av Victoria, redo att ge bort' },
    boxes: { fr: 'box', en: 'boxes', sv: 'lådor' },
    boxOne: { fr: 'box', en: 'box', sv: 'låda' },
    railFoot: {
      fr: 'Une envie précise&nbsp;? <a href="/contact">Demandez-nous un produit</a> : on l’ajoute au prochain conteneur.',
      en: 'Something specific in mind? <a href="/contact">Ask us for a product</a> and we’ll add it to the next container.',
      sv: 'Något särskilt i åtanke? <a href="/contact">Be oss om en produkt</a> så lägger vi till den i nästa container.'
    },
    promo: { fr: 'Promo', en: 'Sale', sv: 'Rea' },
    oldPrice: { fr: 'Prix habituel : ', en: 'Regular price: ', sv: 'Ordinarie pris: ' },
    newPrice: { fr: 'Prix promo : ', en: 'Sale price: ', sv: 'Reapris: ' },
    addTo: { fr: 'Ajouter au panier : ', en: 'Add to basket: ', sv: 'Lägg i korgen: ' },
    incOne: { fr: 'Ajouter un de plus : ', en: 'Add one more: ', sv: 'Lägg till en till: ' },
    decOne: { fr: 'Retirer un : ', en: 'Remove one: ', sv: 'Ta bort en: ' },
    qtyOf: { fr: 'Quantité dans le panier : ', en: 'Quantity in basket: ', sv: 'Antal i korgen: ' },
    choose: { fr: 'Choisir', en: 'Choose', sv: 'Välj' },
    chooseFor: { fr: 'Choisir une option : ', en: 'Choose an option: ', sv: 'Välj ett alternativ: ' },
    emptyTitle: { fr: 'Rien trouvé.', en: 'Nothing found.', sv: 'Inget hittat.' },
    emptyHintPre: { fr: 'Essayez ', en: 'Try ', sv: 'Prova ' },
    or: { fr: ' ou ', en: ' or ', sv: ' eller ' },
    seeAll: { fr: 'Voir les {N} produits', en: 'See all {N} products', sv: 'Visa alla {N} produkter' },
    loading: { fr: 'Chargement du catalogue…', en: 'Loading the catalogue…', sv: 'Laddar sortimentet…' },
    errTitle: { fr: 'Le catalogue n’a pas pu se charger.', en: 'The catalogue could not be loaded.', sv: 'Sortimentet kunde inte laddas.' },
    errHint: { fr: 'Vérifiez votre connexion, puis réessayez.', en: 'Check your connection, then try again.', sv: 'Kontrollera din anslutning och försök igen.' },
    retry: { fr: 'Réessayer', en: 'Try again', sv: 'Försök igen' },
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
    shipped48: { fr: 'Expédié sous 24 à 48 h ouvrées', en: 'Ships within 1–2 working days', sv: 'Skickas inom 1–2 arbetsdagar' },
    myBasket: { fr: 'Mon panier', en: 'My basket', sv: 'Min korg' },
    basketEmpty: { fr: 'Panier vide', en: 'Empty basket', sv: 'Tom korg' },
    openCart: { fr: 'Voir le panier', en: 'View basket', sv: 'Visa korgen' },
    closeCart: { fr: 'Fermer le panier', en: 'Close the basket', sv: 'Stäng korgen' },
    added: { fr: 'Ajouté : {N}', en: 'Added: {N}', sv: 'Tillagd: {N}' },
    addedSr: { fr: '{N} ajouté au panier. Panier : {C}.', en: '{N} added to basket. Basket: {C}.', sv: '{N} lades i korgen. Korg: {C}.' },
    removedSr: { fr: '{N} retiré du panier. Panier : {C}.', en: '{N} removed from basket. Basket: {C}.', sv: '{N} togs bort ur korgen. Korg: {C}.' },
    shipFrom: { fr: 'Livraison offerte dès {X} d’achat.', en: 'Free delivery from {X}.', sv: 'Fri frakt från {X}.' },
    shipLeft: { fr: 'Plus que {X} pour la livraison offerte.', en: 'Only {X} to go for free delivery.', sv: 'Bara {X} kvar till fri frakt.' },
    shipDone: { fr: 'Livraison offerte : colis expédié sous 24 à 48 h ouvrées.', en: 'Free delivery: parcel ships within 1–2 working days.', sv: 'Fri frakt: paketet skickas inom 1–2 arbetsdagar.' },
    shipAlways: { fr: 'Livraison offerte.', en: 'Free delivery.', sv: 'Fri frakt.' },
    shipLine: { fr: 'Livraison (France)', en: 'Shipping (France)', sv: 'Frakt (Frankrike)' },
    shipFree: { fr: 'Offerte', en: 'Free', sv: 'Gratis' },
    grandTotal: { fr: 'Total', en: 'Total', sv: 'Totalt' },
    shipEu: { fr: 'Europe : {C}, offerte dès {T}', en: 'Europe: {C}, free from {T}', sv: 'Europa: {C}, fri frakt från {T}' },
    staticNav: { fr: 'Tous nos produits', en: 'All our products', sv: 'Alla våra produkter' }
  };

  // ── État ──
  var state = { q: '', envies: {}, sort: '', active: '', sheet: false };
  var _ready = false, _failed = false, _shell = false, _lang = null;
  var _rayon = '', _rayonDone = false, _restored = false, _heroFilled = false;
  var _off1 = 0, _off2 = 0, _flash = null, _flashT = 0, _qT = 0, _spyRaf = 0, _saveT = 0;

  var L = function () { return (typeof LANG !== 'undefined' ? LANG : 'fr'); };
  var tr = function (o) { return o[L()] || o.fr; };
  var $ = function (id) { return document.getElementById(id); };

  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) {
    if (typeof _sdAttr === 'function') return _sdAttr(s);
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&'); }
  function price(n) { return fmtPrice(Number(n) || 0); }
  // Seuils ronds : « 29 € » plutôt que « 29,00 € » (sdPriceShort d'app.js si présent)
  function priceShort(n) { return typeof sdPriceShort === 'function' ? sdPriceShort(Number(n) || 0) : price(n); }
  function isMobile() { return window.matchMedia('(max-width:767px)').matches; }
  function isCompact() { return window.matchMedia('(max-width:1099px)').matches; }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function quote(s) { var l = L(); return l === 'fr' ? '« ' + s + ' »' : l === 'sv' ? '”' + s + '”' : '“' + s + '”'; }
  // Français : singulier pour 0 et 1 ; anglais et suédois : pluriel sauf pour 1
  function plural(n, one, many) { var pl = L() === 'fr' ? n > 1 : n !== 1; return n + ' ' + (pl ? tr(many) : tr(one)); }
  function envieLabel(e) { return tr(e[1]).replace('{X}', priceShort(CHEAP)); }
  function brandName() { return (window.SD_WL && SD_WL.brand_name) || 'Swedish Cravings'; }
  function productUrl(p) { return typeof sdProductUrl === 'function' ? sdProductUrl(p) : '/boutique'; }
  function thumb(u, w) { return typeof sdThumb === 'function' ? sdThumb(u, w) : u; }
  function thumbSet(u) { return typeof sdThumbSet === 'function' ? sdThumbSet(u) : ''; }

  // ── Produits ──
  var HOME_CATS = ['Art de la table', 'Maison & Déco'];
  function shopProducts() {
    // L'univers « Maison » (serviettes…) a sa vitrine à part : jamais en boutique.
    return (window.PRODUCTS || []).filter(function (p) {
      if (!p) return false;
      if (typeof sdIsHomeProduct === 'function' && sdIsHomeProduct(p)) return false;
      return HOME_CATS.indexOf(p.cat) === -1;
    });
  }
  function findProd(cid) {
    var list = window.PRODUCTS || [];
    for (var i = 0; i < list.length; i++) { if (String(list[i].uuid || list[i].id) === String(cid)) return list[i]; }
    return null;
  }

  // Modèle de carte (un objet par produit réel)
  function build(p) {
    var sale = !!(window.SDPrice && SDPrice.active(p));
    var eff = sale ? SDPrice.effective(p.price, p) : (p.price || 0);
    var c = p.category || null;
    var slug = c ? (c.slug || '') : '';
    var tracked = !!p.trackStock && p.stock != null;
    var out = typeof sdIsOut === 'function' ? sdIsOut(p) : (tracked && p.stock <= 0);
    var realTags = (p.tags || []).map(norm);
    var nn = norm((p.name && (p.name.fr || p.name[L()])) || '');
    var tags = {};
    if (slug === 'dips' || slug === 'snacks-chips' || slug === 'epices' || slug === 'sauces' || slug === 'fromages-tartinables') tags.sale = true;
    if (slug === 'confiseries' || slug === 'chocolat' || slug === 'patisserie-basics' || slug === 'boissons') tags.sucre = true;
    if (/lakrits|reglisse|salmiak|djungelvral|salta katten|tyrkisk|\bkick\b|skumgodis|sockerbitar|spattor/.test(nn)) tags.reglisse = true;
    if (slug === 'patisserie-basics' || /kanel|cannelle|kardemumma|cardamome|\bkex\b|ballerina|singoalla|parlsocker|kanelbullar/.test(nn)) tags.fika = true;
    if (realTags.indexOf('vegan') > -1 || realTags.indexOf('vegansk') > -1) tags.vegan = true;
    if (eff > 0 && eff < CHEAP) tags.petit = true;
    if (p.bestseller) tags.best = true;
    if (p.isNew) tags.new = true;
    // Box = produit composé, repéré par l'étiquette « box » posée en admin.
    var isBox = realTags.indexOf('box') > -1 || /^box\b/.test(nn);
    var multi = !!(p.variants && p.variants.length > 1);
    return {
      id: String(p.uuid || p.id), ref: p, url: productUrl(p),
      name: (p.name && (p.name[L()] || p.name.fr)) || '',
      subtitle: (p.subtitle && (p.subtitle[L()] || p.subtitle.fr)) || '',
      isBox: isBox,
      catKey: c ? (c.slug || c.fr) : 'autres',
      catLabel: c ? (c[L()] || c.fr) : ({ fr: 'Autres', en: 'Other', sv: 'Övrigt' })[L()],
      slug: slug,
      price: eff, sale: sale, oldPrice: p.price || 0,
      weight: p.weight || '',
      origin: (typeof p.origin === 'object' && p.origin) ? (p.origin[L()] || p.origin.fr || '') : (p.origin || ''),
      stock: out ? 'out' : (tracked && p.stock <= 2 ? 'low' : 'in'),
      tags: tags,
      photo: p.photo || '',
      // Variantes ou retrait seul : on choisit sur la fiche, jamais d'ajout « à l'aveugle ».
      choose: multi || !!p.pickup_only, pickup: !!p.pickup_only,
      created: Date.parse(p.createdAt || '') || 0
    };
  }

  // ── Filtrage, tri, sections ──
  function activeEnvies() { return ENVIES.map(function (e) { return e[0]; }).filter(function (k) { return state.envies[k]; }); }
  function isDirty() { return !!state.q.trim() || activeEnvies().length > 0; }

  function filtered() {
    var all = shopProducts().map(build);
    var on = activeEnvies();
    var q = state.q.trim();
    var list = all.filter(function (v) {
      if (on.length && !on.some(function (t) { return v.tags[t]; })) return false;
      if (q) {
        if (typeof sdMatches === 'function') { if (!sdMatches(v.ref, q)) return false; }
        else if (norm(v.name).indexOf(norm(q)) === -1) return false;
      }
      return true;
    });
    return { all: all, list: list };
  }

  function sortItems(items, isBox) {
    var s = state.sort;
    var arr = items.map(function (v, i) { return { v: v, i: i }; });
    arr.sort(function (a, b) {
      var oa = a.v.stock === 'out', ob = b.v.stock === 'out';
      if (oa !== ob) return oa ? 1 : -1;              // disponibles d'abord
      if (s === 'prix-asc' || (!s && isBox)) return (a.v.price - b.v.price) || (a.i - b.i);
      if (s === 'prix-desc') return (b.v.price - a.v.price) || (a.i - b.i);
      if (s === 'nouveautes') return (b.v.created - a.v.created) || (a.i - b.i);
      return a.i - b.i;
    });
    return arr.map(function (x) { return x.v; });
  }

  function sectionsOf(list) {
    var catsMap = {}, boxes = [];
    list.forEach(function (v) {
      if (v.isBox) { boxes.push(v); return; }   // les box ont leur section en tête
      if (!catsMap[v.catKey]) catsMap[v.catKey] = { key: v.catKey, label: v.catLabel, slug: v.slug, items: [] };
      catsMap[v.catKey].items.push(v);
    });
    var oi = function (c) { return ORDER[c.slug || c.key] || 99; };
    var cats = Object.keys(catsMap).map(function (k) { return catsMap[k]; })
      .sort(function (a, b) { return (oi(a) - oi(b)) || String(a.label).localeCompare(String(b.label)); });
    var sections = [];
    if (boxes.length) sections.push({ key: 'box', title: tr(T.boxTitle), note: tr(T.boxNote), items: sortItems(boxes, true), featured: true });
    cats.forEach(function (c) { sections.push({ key: c.key, title: c.label, items: sortItems(c.items, false) }); });
    return sections;
  }

  // ── Panier (état partagé avec app.js) ──
  function cartMap() { return (typeof cart !== 'undefined' && cart) ? cart : {}; }
  function baseOf(key) { var i = key.indexOf('_'); return i === -1 ? key : key.slice(0, i); }
  function variantOf(key) { var i = key.indexOf('_'); return i === -1 ? '' : key.slice(i + 1); }
  function qtyOf(cid) { return cartMap()[String(cid)] || 0; }
  function snapOf(cid) {
    try { var cp = (typeof _sdCartProducts === 'function') ? _sdCartProducts() : JSON.parse(localStorage.getItem('sd_cart_products') || '{}'); return cp[cid] || null; }
    catch (e) { return null; }
  }
  function snapshot(p) {
    try {
      var cp = JSON.parse(localStorage.getItem('sd_cart_products') || '{}');
      cp[String(p.uuid || p.id)] = {
        name: p.name, photo: p.photo, price: p.price, weight: p.weight,
        variants: p.variants || [], pickup_only: !!p.pickup_only,
        discountType: p.discountType || null, discountValue: p.discountValue != null ? p.discountValue : null,
        discountStart: p.discountStart || null, discountEnd: p.discountEnd || null
      };
      localStorage.setItem('sd_cart_products', JSON.stringify(cp));
    } catch (e) {}
  }

  function cartData() {
    var c = cartMap();
    var keys = Object.keys(c).filter(function (k) { return c[k] > 0; });
    var lines = keys.map(function (key) {
      var cid = baseOf(key), variant = variantOf(key);
      // Produit pas encore chargé : la copie gardée à l'ajout suffit pour l'afficher.
      var raw = findProd(cid) || snapOf(cid); if (!raw) return null;
      var vs = raw.variants || [];
      var vv = null;
      for (var i = 0; i < vs.length; i++) { if (variant ? vs[i].label === variant : i === 0) { vv = vs[i]; break; } }
      var base = vv ? vv.price : (raw.price || 0);
      var eff = window.SDPrice ? SDPrice.effective(base, raw) : base;
      var name = raw.name ? (typeof raw.name === 'object' ? (raw.name[L()] || raw.name.fr || '') : raw.name) : '';
      return {
        key: key, cid: cid, name: name, sub: variant || raw.weight || '', unit: eff, qty: c[key],
        total: eff * c[key], photo: raw.photo || '',
        url: productUrl({ name: raw.name, uuid: raw.uuid || cid })
      };
    }).filter(Boolean);
    var count = keys.reduce(function (n, k) { return n + c[k]; }, 0);
    var total = lines.reduce(function (n, l) { return n + l.total; }, 0);
    var fr = SD_SHIP.rules(false), eu = SD_SHIP.rules(true);
    var shipCost = total >= fr.threshold ? 0 : fr.cost;
    return { lines: lines, count: count, total: total, threshold: fr.threshold, shipCost: shipCost, grand: total + shipCost, eu: eu, empty: count === 0 };
  }
  function countLabel(n) { return plural(n, T.article, T.articles); }

  function bumpKey(key, d) {
    if (typeof cart === 'undefined' || !key) return;
    var cid = baseOf(key);
    var raw = findProd(cid);
    if (d > 0 && raw) {
      if (typeof sdIsOut === 'function' && sdIsOut(raw)) { notify(typeof _sdStockMsg === 'function' ? _sdStockMsg('out') : ''); return; }
      if (typeof _sdStock === 'function') {
        var max = _sdStock(raw);
        var already = (typeof _sdCartQtyForProduct === 'function') ? _sdCartQtyForProduct(cid) : (cart[key] || 0);
        if (isFinite(max) && already >= max) { notify(typeof _sdStockMsg === 'function' ? _sdStockMsg('max') : ''); return; }
      }
    }
    var n = (cart[key] || 0) + d;
    if (n <= 0) delete cart[key]; else cart[key] = n;
    if (typeof saveCart === 'function') saveCart();
    if (d > 0 && raw) snapshot(raw);
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof renderCartDrawer === 'function') renderCartDrawer();
    if (d > 0 && raw && typeof sdTrackAddToCart === 'function') { try { sdTrackAddToCart(raw, 1); } catch (e) {} }

    // Mise à jour ciblée : la carte concernée + le panier, jamais toute la grille.
    updateCard(cid);
    var name = raw ? ((raw.name && (raw.name[L()] || raw.name.fr)) || '') : ((snapOf(cid) || {}).name || {})[L()] || '';
    if (d > 0) { _flash = tr(T.added).replace('{N}', name); clearTimeout(_flashT); _flashT = setTimeout(function () { _flash = null; renderMobarBar(); }, 2200); }
    renderCart();
    var c = cartData();
    announce(tr(d > 0 ? T.addedSr : T.removedSr).replace('{N}', name).replace('{C}', countLabel(c.count)));
  }

  // Message court (stock) : barre panier sur tablette/mobile, toast sur ordinateur
  function notify(msg) {
    if (!msg) return;
    if (isCompact()) { _flash = msg; clearTimeout(_flashT); _flashT = setTimeout(function () { _flash = null; renderMobarBar(); }, 2600); renderMobarBar(); }
    else if (typeof showToast === 'function') showToast(msg);
    announce(msg);
  }
  function announce(msg) {
    var s = $('c3-status'); if (!s) return;
    s.textContent = '';
    setTimeout(function () { s.textContent = msg; }, 40);
  }

  // Remplace le contenu d'une zone en gardant le focus sur le contrôle équivalent
  function withFocus(zone, fn) {
    var a = document.activeElement, info = null;
    if (zone && a && zone.contains(a)) info = { role: a.getAttribute('data-role'), key: a.getAttribute('data-key') };
    fn();
    if (!info || !info.role) return;
    var k = info.key ? '[data-key="' + cssEsc(info.key) + '"]' : '';
    var el = zone.querySelector('[data-role="' + info.role + '"]' + k);
    if (!el && info.key) el = zone.querySelector('[data-role="inc"]' + k) || zone.querySelector('[data-role="add"]' + k);
    if (!el) el = zone.querySelector('[data-focus-fallback]');
    if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  }

  // ── Rendu : cartes ──
  var PLUS_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>';
  var CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>';

  function controlHTML(v) {
    if (v.stock === 'out') return '';
    if (v.choose) {
      return '<a class="c3-choose" href="' + esc(v.url) + '" data-role="choose" aria-label="' + esc(tr(T.chooseFor) + v.name) + '">' + esc(tr(T.choose)) + '</a>';
    }
    var qty = qtyOf(v.id);
    if (qty > 0) {
      return '<div class="c3-step" role="group" aria-label="' + esc(tr(T.qtyOf) + v.name) + '">' +
        '<button type="button" data-role="dec" data-key="' + esc(v.id) + '" aria-label="' + esc(tr(T.decOne) + v.name) + '">−</button>' +
        '<span class="c3-step-n">' + qty + '</span>' +
        '<button type="button" data-role="inc" data-key="' + esc(v.id) + '" aria-label="' + esc(tr(T.incOne) + v.name) + '">+</button></div>';
    }
    return '<button type="button" class="c3-add" data-role="add" data-key="' + esc(v.id) + '" aria-label="' + esc(tr(T.addTo) + v.name) + '">' + PLUS_SVG + '</button>';
  }

  function priceHTML(v) {
    if (v.sale) {
      return '<s class="c3-old"><span class="sr-only">' + esc(tr(T.oldPrice)) + '</span>' + esc(price(v.oldPrice)) + '</s>' +
        '<span class="c3-price c3-price--sale"><span class="sr-only">' + esc(tr(T.newPrice)) + '</span>' + esc(price(v.price)) + '</span>';
    }
    return '<span class="c3-price">' + esc(price(v.price)) + '</span>';
  }

  function cardHTML(v) {
    var flags = [];
    if (v.stock === 'out') flags.push(['out', tr(FLAG.out)]);
    else {
      if (v.pickup) flags.push(['pickup', tr(FLAG.pickup)]);
      if (v.tags.new) flags.push(['new', tr(FLAG.new)]);
      else if (v.stock === 'low') flags.push(['low', tr(FLAG.low)]);
      else if (v.tags.best) flags.push(['best', tr(FLAG.best)]);
    }
    var set = v.photo ? thumbSet(v.photo) : '';
    // Largeurs réellement affichées (box ~336 px, cartes ~232 px sur grand écran)
    var sizes = v.isBox ? '(max-width:767px) 46vw, 340px' : '(max-width:767px) 46vw, (max-width:1099px) 30vw, 240px';
    // La photo est décorative : le nom (lien) dit déjà ce que c'est.
    var img = v.photo
      ? '<img class="c3-img" src="' + esc(thumb(v.photo, 300)) + '"' + (set ? ' srcset="' + esc(set) + '" sizes="' + sizes + '"' : '') +
        ' data-full="' + esc(v.photo) + '" width="300" height="300" alt="" loading="lazy" decoding="async" onerror="window._c3ImgErr&&_c3ImgErr(this)">'
      : '';
    var promo = '';
    if (v.sale) {
      var dt = v.ref.discountType || v.ref.discount_type;
      var dv = parseFloat(v.ref.discountValue != null ? v.ref.discountValue : v.ref.discount_value);
      promo = '<span class="c3-promo" aria-hidden="true">' + esc(dt === 'percent' && dv > 0 ? '−' + Math.round(dv) + ' %' : tr(T.promo)) + '</span>';
    }
    var meta = (v.isBox && v.subtitle)
      ? '<p class="c3-meta">' + esc(v.subtitle) + '</p>'
      : '<p class="c3-meta"><span class="c3-meta-w">' + esc(v.weight) + '</span>' + (v.origin ? '<span class="c3-meta-o">' + (v.weight ? ' · ' : '') + esc(v.origin) + '</span>' : '') + '</p>';
    return '<article class="c3-card' + (v.stock === 'out' ? ' c3-card--out' : '') + '" data-id="' + esc(v.id) + '">' +
      '<div class="c3-imgwrap">' + img +
      (flags.length ? '<div class="c3-flags">' + flags.map(function (f) { return '<span class="c3-flag c3-flag--' + f[0] + '">' + esc(f[1]) + '</span>'; }).join('') + '</div>' : '') +
      promo +
      '<div class="c3-ctrl">' + controlHTML(v) + '</div>' +
      '</div>' +
      '<div class="c3-cbody">' +
      '<h3 class="c3-name"><a class="prod-link" href="' + esc(v.url) + '">' + esc(v.name) + '</a></h3>' +
      meta +
      '<div class="c3-prices">' + priceHTML(v) + '</div>' +
      '</div></article>';
  }

  // Vignette absente du redimensionneur : on retombe sur la photo d'origine.
  window._c3ImgErr = function (img) {
    var full = img.getAttribute('data-full');
    if (full && img.getAttribute('src') !== full) { img.removeAttribute('srcset'); img.removeAttribute('data-full'); img.src = full; }
    else img.style.visibility = 'hidden';
  };

  function sectionsHTML(sections) {
    return sections.map(function (s) {
      var n = s.items.length;
      var unit = s.featured ? (n > 1 ? tr(T.boxes) : tr(T.boxOne)) : (n > 1 ? tr(T.products) : tr(T.product));
      var hid = 'c3-h-' + String(s.key).replace(/[^a-zA-Z0-9_-]/g, '-');
      var head = '<div class="c3-sechead"><h2 id="' + hid + '" tabindex="-1">' + esc(s.title) + '</h2>' +
        '<span class="c3-seccount">' + n + ' ' + esc(unit) + '</span>' +
        (s.note ? '<span class="c3-secfam">' + esc(s.note) + '</span>' : '') + '</div>';
      var grid = '<div class="c3-grid' + (s.featured ? ' c3-grid--box' : '') + '">' + s.items.map(cardHTML).join('') + '</div>';
      return '<section class="c3-section' + (s.featured ? ' c3-section--box' : '') + '" data-sec="' + esc(s.key) + '" aria-labelledby="' + hid + '">' + head + grid + '</section>';
    }).join('');
  }

  /* « Pour la table » : les serviettes (univers Maison) ne sont pas dans les
     rayons, mais la boutique y mène — en fin de liste, ou dès qu'une
     recherche les vise (« serviette », « marimekko »…). Rien si tout est épuisé. */
  function tableHTML() {
    if (activeEnvies().length) return '';
    var home = (window.PRODUCTS || []).filter(function (p) {
      return p && typeof sdIsHomeProduct === 'function' && sdIsHomeProduct(p) && (p.price || 0) > 0 && !(typeof sdIsOut === 'function' && sdIsOut(p));
    });
    var q = state.q.trim();
    if (q) home = home.filter(function (p) { return typeof sdMatches === 'function' && sdMatches(p, q); });
    if (!home.length) return '';
    var min = Math.min.apply(null, home.map(function (p) { return p.price; }));
    var marques = ['Marimekko', 'IHR', 'P Design'].filter(function (b) {
      return home.some(function (p) { return ((p.name && p.name.fr) || '').toLowerCase().indexOf(b.toLowerCase()) > -1; });
    });
    var prix = typeof sdPriceShort === 'function' ? sdPriceShort(min) : fmtPrice(min);
    var txt = esc(tr(T.tableText)).replace('{B}', esc(marques.join(', ') + (marques.length ? '…' : ''))).replace('{P}', esc(prix)).replace(' ()', '');
    var imgs = home.slice(0, 3).map(function (p) {
      var nm = (p.name && (p.name[LANG] || p.name.fr)) || '';
      return '<a class="c3-table-img" href="' + esc(typeof sdProductUrl === 'function' ? sdProductUrl(p) : '/maison') + '" aria-label="' + esc(nm) + '">' +
        '<img src="' + esc(thumb(p.photo, 300)) + '" alt="" width="150" height="150" loading="lazy" decoding="async"></a>';
    }).join('');
    return '<aside class="c3-table" aria-labelledby="c3-table-h"><div class="c3-table-txt">' +
      '<p class="c3-table-eyebrow">' + esc(tr(T.tableEyebrow)) + '</p>' +
      '<h2 id="c3-table-h">' + tr(T.tableTitle) + '</h2>' +
      '<p>' + txt + '</p>' +
      '<a class="c3-table-link" href="/maison">' + esc(tr(T.tableLink)) + ' →</a></div>' +
      '<div class="c3-table-imgs">' + imgs + '</div></aside>';
  }

  function emptyHTML(total) {
    var hints = HINTS.map(function (h) { return '<button type="button" data-role="q" data-q="' + esc(h) + '">' + esc(quote(h)) + '</button>'; });
    var hintTxt = tr(T.emptyHintPre) + hints.slice(0, -1).join(', ') + tr(T.or) + hints[hints.length - 1] + '.';
    return '<div class="c3-empty">' +
      '<p class="c3-empty-t">' + esc(tr(T.emptyTitle)) + '</p>' +
      '<p class="c3-empty-h">' + hintTxt + '</p>' +
      '<button type="button" class="c3-empty-btn" data-role="clear">' + esc(tr(T.seeAll).replace('{N}', total)) + '</button></div>';
  }

  function errorHTML() {
    return '<div class="c3-empty" role="alert">' +
      '<p class="c3-empty-t">' + esc(tr(T.errTitle)) + '</p>' +
      '<p class="c3-empty-h">' + esc(tr(T.errHint)) + '</p>' +
      '<button type="button" class="c3-empty-btn" data-role="retry">' + esc(tr(T.retry)) + '</button></div>';
  }

  function skeletonHTML() {
    var card = '<div class="c3-card c3-card--skel"><div class="c3-imgwrap"></div><div class="c3-cbody">' +
      '<span class="c3-skel c3-skel-l1"></span><span class="c3-skel c3-skel-l2"></span><span class="c3-skel c3-skel-l3"></span></div></div>';
    var cards = ''; for (var i = 0; i < 8; i++) cards += card;
    return '<p class="sr-only">' + esc(tr(T.loading)) + '</p>' +
      '<div class="c3-section c3-loading" aria-hidden="true"><div class="c3-sechead"><span class="c3-skel c3-skel-h"></span></div>' +
      '<div class="c3-grid">' + cards + '</div></div>';
  }

  // ── Rendu : rail, puces, compteurs ──
  function railHTML(sections) {
    var rows = sections.map(function (s) {
      var on = state.active === s.key;
      return '<button type="button" class="c3-railsub' + (on ? ' on' : '') + '" data-role="go" data-go="' + esc(s.key) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span>' + esc(s.title) + '</span><span class="c3-railcnt">' + s.items.length + '</span></button>';
    }).join('');
    return '<p class="c3-railtitle">' + esc(tr(T.catalogTitle)) + '</p>' + rows +
      '<div class="c3-railfoot">' + tr(T.railFoot) + '</div>';
  }
  function chipsHTML(sections) {
    return sections.map(function (s) {
      var on = state.active === s.key;
      return '<button type="button" class="c3-chip' + (on ? ' on' : '') + '" data-role="go" data-go="' + esc(s.key) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        esc(s.featured ? tr(T.boxTitle) : s.title) + ' · ' + s.items.length + '</button>';
    }).join('');
  }
  function enviesHTML() {
    return ENVIES.map(function (e) {
      var on = !!state.envies[e[0]];
      return '<button type="button" class="c3-envie" data-role="envie" data-envie="' + e[0] + '" aria-pressed="' + on + '">' + esc(envieLabel(e)) + '</button>';
    }).join('');
  }
  function sortOptionsHTML() {
    return SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (state.sort === s[0] ? ' selected' : '') + '>' + esc(tr(s[1])) + '</option>'; }).join('');
  }

  var _sections = [];
  function renderGrid() {
    var main = $('c3-main'); if (!main) return;
    if (!_ready) {
      main.setAttribute('aria-busy', 'true');
      main.innerHTML = _failed ? errorHTML() : skeletonHTML();
      if (_failed) main.removeAttribute('aria-busy');
      _sections = [];
      renderChrome(null);
      var st = $('c3-static');
      if (st) st.hidden = !(_failed && st.querySelector('a'));
      return;
    }
    main.removeAttribute('aria-busy');
    var f = filtered();
    _sections = sectionsOf(f.list);
    main.innerHTML = (f.list.length ? sectionsHTML(_sections) : emptyHTML(f.all.length)) + tableHTML();
    renderChrome(f);
    // La grille JS est là : la liste statique (moteurs) ne doit pas être lue deux fois.
    var s = $('c3-static'); if (s) s.hidden = true;
    state.active = '';
    updateScrollSpy();
  }

  function renderChrome(f) {
    // Envies : état pressé, sans reconstruire les boutons (le focus reste)
    document.querySelectorAll('.c3-envie').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!!state.envies[b.getAttribute('data-envie')]));
    });
    var dirty = isDirty();
    document.querySelectorAll('.c3-result').forEach(function (el) {
      el.textContent = f ? plural(f.list.length, T.product, T.products) : '';
    });
    document.querySelectorAll('.c3-clear').forEach(function (el) { el.hidden = !dirty; });
    var railEl = $('c3-rail'); if (railEl) railEl.innerHTML = f ? railHTML(_sections) : '<p class="c3-railtitle">' + esc(tr(T.catalogTitle)) + '</p>';
    var chipsEl = $('c3-chips'); if (chipsEl) chipsEl.innerHTML = f ? chipsHTML(_sections) : '';
    // Compteurs : jamais « 0 » pendant le chargement
    var all = f ? f.all : null;
    var inStock = all ? all.filter(function (v) { return v.stock !== 'out'; }).length : 0;
    document.querySelectorAll('.c3-refcount').forEach(function (el) { el.textContent = all ? inStock : ''; });
    document.querySelectorAll('.c3-refwrap').forEach(function (el) { el.hidden = !all || !inStock; });
    var mref = document.querySelector('.c3-mref'); if (mref) mref.hidden = !all;
    var mtotal = document.querySelector('.c3-mtotal'); if (mtotal) mtotal.textContent = all ? all.length : '';
    var brand = document.querySelector('.c3-mbrand'); if (brand) brand.textContent = brandName();
    var ship = document.querySelector('.c3-hero-ship'); if (ship && typeof sdShipLine === 'function') ship.textContent = sdShipLine();
    var st = $('c3-static'); if (st) st.setAttribute('aria-label', tr(T.staticNav));
    if (all) fillHero(all);
  }

  // Les trois vignettes du hero : une confiserie, un produit fika, un snack (en stock)
  function fillHero(all) {
    if (_heroFilled) return;
    var blocks = [document.querySelector('.c3-hg1'), document.querySelector('.c3-hg2'), document.querySelector('.c3-hg3')];
    if (!blocks[0]) return;
    var pool = all.filter(function (v) { return v.photo && v.stock !== 'out' && !v.isBox; });
    if (!pool.length) return;
    var used = {};
    function pick(slugs) {
      var c = pool.filter(function (v) { return !used[v.id] && slugs.indexOf(v.slug) > -1; });
      var b = c.filter(function (v) { return v.tags.best; });
      var r = b[0] || c[0] || pool.filter(function (v) { return !used[v.id]; })[0] || null;
      if (r) used[r.id] = true;
      return r;
    }
    var picks = [pick(['confiseries', 'chocolat']), pick(['patisserie-basics', 'boissons']), pick(['snacks-chips', 'dips'])];
    blocks.forEach(function (el, i) {
      var v = picks[i]; if (!el || !v) return;
      var set = thumbSet(v.photo);
      el.innerHTML = '<img src="' + esc(thumb(v.photo, i === 0 ? 600 : 300)) + '"' + (set ? ' srcset="' + esc(set) + '" sizes="' + (i === 0 ? '220px' : '150px') + '"' : '') +
        ' data-full="' + esc(v.photo) + '" alt="" decoding="async" onerror="window._c3ImgErr&&_c3ImgErr(this)">';
    });
    _heroFilled = true;
  }

  // Une seule carte mise à jour (contrôle « + » / pas à pas), focus conservé
  function updateCard(cid) {
    var raw = findProd(cid); if (!raw) return;
    var v = build(raw);
    document.querySelectorAll('.c3-card[data-id="' + cssEsc(cid) + '"] .c3-ctrl').forEach(function (ctrl) {
      withFocus(ctrl, function () { ctrl.innerHTML = controlHTML(v); });
    });
  }
  function updateAllCards() {
    document.querySelectorAll('.c3-card[data-id]').forEach(function (card) {
      var raw = findProd(card.getAttribute('data-id')); if (!raw) return;
      var ctrl = card.querySelector('.c3-ctrl'); if (!ctrl) return;
      var v = build(raw);
      withFocus(ctrl, function () { ctrl.innerHTML = controlHTML(v); });
    });
  }

  // ── Rendu : panier (colonne sur ordinateur, barre + feuille ailleurs) ──
  function shipMsg(d) {
    if (!(d.threshold > 0)) return tr(T.shipAlways);
    if (d.empty) return tr(T.shipFrom).replace('{X}', priceShort(d.threshold));
    var left = d.threshold - d.total;
    if (left > 0) return tr(T.shipLeft).replace('{X}', price(left));
    return tr(T.shipDone);
  }
  function pctOf(d) { return d.threshold > 0 ? Math.min(100, (d.total / d.threshold) * 100).toFixed(1) : '100'; }

  function cartLinesHTML(lines) {
    return lines.map(function (l) {
      return '<div class="c3-line">' +
        (l.photo ? '<img class="c3-line-img" src="' + esc(thumb(l.photo, 300)) + '" data-full="' + esc(l.photo) + '" alt="" width="40" height="40" loading="lazy" decoding="async" onerror="window._c3ImgErr&&_c3ImgErr(this)">' : '<span class="c3-line-img" aria-hidden="true"></span>') +
        '<div class="c3-line-info"><a class="c3-line-name" href="' + esc(l.url) + '">' + esc(l.name) + '</a>' +
        '<span class="c3-line-unit">' + esc((l.sub ? l.sub + ' · ' : '') + price(l.unit)) + '</span></div>' +
        '<div class="c3-line-step" role="group" aria-label="' + esc(tr(T.qtyOf) + l.name) + '">' +
        '<button type="button" data-role="dec" data-key="' + esc(l.key) + '" aria-label="' + esc(tr(T.decOne) + l.name) + '">−</button>' +
        '<span>' + l.qty + '</span>' +
        '<button type="button" data-role="inc" data-key="' + esc(l.key) + '" aria-label="' + esc(tr(T.incOne) + l.name) + '">+</button></div>' +
        '<span class="c3-line-total">' + esc(price(l.total)) + '</span></div>';
    }).join('');
  }

  function totalsHTML(d) {
    var ship = d.shipCost === 0 ? '<span class="c3-free">' + esc(tr(T.shipFree)) + '</span>' : esc(price(d.shipCost));
    var euTxt = tr(T.shipEu).replace('{C}', price(d.eu.cost)).replace('{T}', priceShort(d.eu.threshold));
    return '<div class="c3-trow"><span class="c3-tl">' + esc(tr(T.subtotal)) + '</span><span class="c3-tv">' + esc(price(d.total)) + '</span></div>' +
      '<div class="c3-trow"><span class="c3-tl">' + esc(tr(T.shipLine)) + '</span><span class="c3-tv">' + ship + '</span></div>' +
      '<div class="c3-subtotal"><span>' + esc(tr(T.grandTotal)) + '</span><span class="c3-total">' + esc(price(d.grand)) + '</span></div>' +
      '<p class="c3-eu">' + esc(euTxt) + '</p>';
  }
  function orderHTML(d) {
    return d.empty
      ? '<span class="c3-order off" aria-disabled="true">' + esc(tr(T.order)) + '</span>'
      : '<a class="c3-order" href="/panier">' + esc(tr(T.order)) + '</a>';
  }

  function cartPanelHTML(d) {
    var head = '<div class="c3-cart-head"><h2 class="c3-cart-title" tabindex="-1" data-focus-fallback>' + esc(tr(T.cartTitle)) + '</h2>' +
      '<span class="c3-cart-count">' + esc(d.empty ? tr(T.cartEmptyWord) : countLabel(d.count)) + '</span></div>';
    var body = d.empty
      ? '<div class="c3-cart-empty"><p>' + esc(tr(T.cartEmptyExplain)) + '</p></div>'
      : '<div class="c3-cart-lines">' + cartLinesHTML(d.lines) + '</div>';
    var foot = '<div class="c3-cart-foot">' +
      '<div class="c3-bar" aria-hidden="true"><div class="c3-bar-fill" style="width:' + pctOf(d) + '%"></div></div>' +
      '<p class="c3-shipmsg">' + esc(shipMsg(d)) + '</p>' +
      (d.empty ? '' : totalsHTML(d)) +
      orderHTML(d) +
      '<div class="c3-trust"><span>' + esc(tr(T.securePay)) + '</span><span>' + esc(tr(T.shipped48)) + '</span></div>' +
      '</div>';
    return head + body + foot;
  }

  function sheetHTML(d) {
    var head = '<div class="c3-sheet-head"><h2 class="c3-sheet-title" id="c3-sheet-title" tabindex="-1" data-focus-fallback>' + esc(tr(T.cartTitle)) + '</h2>' +
      '<button type="button" class="c3-sheet-x" data-role="sheet-close" aria-label="' + esc(tr(T.closeCart)) + '">' + CLOSE_SVG + '</button></div>';
    if (d.empty) return head + '<div class="c3-sheet-empty"><p>' + esc(tr(T.cartEmptyShort)) + '</p></div>';
    return head + '<div class="c3-sheet-lines">' + cartLinesHTML(d.lines) + '</div>' +
      '<div class="c3-sheet-foot">' + totalsHTML(d) + orderHTML(d) + '</div>';
  }

  function mobarBarHTML(d) {
    var label = _flash || (d.empty ? tr(T.basketEmpty) : tr(T.myBasket) + ' · ' + countLabel(d.count));
    return '<div class="c3-mobar-bar" aria-hidden="true"><div class="c3-mobar-fill" style="width:' + pctOf(d) + '%"></div></div>' +
      '<div class="c3-mobar-pad">' +
      '<p class="c3-mobar-msg">' + esc(shipMsg(d)) + '</p>' +
      '<button type="button" class="c3-mobar-btn" data-role="sheet-toggle" aria-expanded="' + state.sheet + '" aria-controls="c3-sheet" aria-label="' + esc((state.sheet ? tr(T.closeCart) : tr(T.openCart)) + ' · ' + (d.empty ? tr(T.basketEmpty) : countLabel(d.count) + ' · ' + price(d.total))) + '">' +
      '<span class="c3-mobar-label">' + esc(label) + '</span>' +
      '<span class="c3-mobar-right"><span class="c3-mobar-total">' + esc(price(d.total)) + '</span><span class="c3-mobar-chev" aria-hidden="true">' + (state.sheet ? '▾' : '▴') + '</span></span>' +
      '</button></div>';
  }

  function renderMobarBar(d) {
    var inner = $('c3-mobar-inner'); if (!inner) return;
    d = d || cartData();
    withFocus(inner, function () { inner.innerHTML = mobarBarHTML(d); });
    inner.classList.toggle('c3-mobar--flash', !!_flash);
  }

  function renderCart() {
    var d = cartData();
    var cartEl = $('c3-cart');
    if (cartEl) withFocus(cartEl, function () { cartEl.innerHTML = cartPanelHTML(d); });
    var sh = $('c3-sheet');
    if (sh && state.sheet) withFocus(sh, function () { sh.innerHTML = sheetHTML(d); });
    renderMobarBar(d);
    setOffsets();
  }

  function openSheet(open, returnFocus) {
    state.sheet = !!open;
    var sh = $('c3-sheet'); if (!sh) return;
    if (state.sheet) {
      sh.innerHTML = sheetHTML(cartData());
      sh.hidden = false;
      renderMobarBar();
      var t = sh.querySelector('.c3-sheet-title'); if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
    } else {
      sh.hidden = true;
      renderMobarBar();
      if (returnFocus) { var b = document.querySelector('.c3-mobar-btn'); if (b) b.focus(); }
    }
  }

  // ── Coquille : barres de recherche, rail, grille, panier ──
  function shellHTML() {
    var sortSel = function (id) {
      return '<label class="c3-sort" for="' + id + '"><span class="c3-sort-l">' + esc(tr(T.sortLabel)) + '</span>' +
        '<select id="' + id + '" class="c3-sort-sel" data-role="sort">' + sortOptionsHTML() + '</select></label>';
    };
    var clearBtn = '<button type="button" class="c3-clear" data-role="clear" aria-label="' + esc(tr(T.clearLabel)) + '" hidden>' + esc(tr(T.clear)) + '</button>';
    return '' +
      // Ordinateur et tablette : barre collante (recherche + envies + tri + résultat)
      '<div class="c3-filterbar"><div class="c3-filterbar-in">' +
        '<div class="c3-searchwrap"><label class="sr-only" for="c3-search">' + esc(tr(T.searchLabel)) + '</label>' +
        '<input id="c3-search" class="c3-search" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false" placeholder="' + esc(tr(T.searchPh)) + '"></div>' +
        '<div class="c3-envies c3-envies-desk" role="group" aria-label="' + esc(tr(T.enviesLabel)) + '">' + enviesHTML() + '</div>' +
        '<div class="c3-tools">' + sortSel('c3-sort') + '<span class="c3-result" aria-live="polite"></span>' + clearBtn + '</div>' +
      '</div></div>' +
      // Mobile : en-tête compact (marque + nombre de réf. + recherche + rayons)
      '<div class="c3-mhead"><div class="c3-mhead-row"><span class="c3-mbrand">' + esc(brandName()) + '</span>' +
        '<span class="c3-mref" hidden><span class="c3-mtotal"></span> ' + esc(tr(T.ref)) + '</span></div>' +
        '<label class="sr-only" for="c3-search-m">' + esc(tr(T.searchLabel)) + '</label>' +
        '<input id="c3-search-m" class="c3-search-m" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false" placeholder="' + esc(tr(T.searchPhShort)) + '">' +
        '<nav id="c3-chips" class="c3-chips" aria-label="' + esc(tr(T.railLabel)) + '"></nav></div>' +
      // Mobile : envies + résultat + tri
      '<div class="c3-menvies"><div class="c3-envies c3-envies-mob" role="group" aria-label="' + esc(tr(T.enviesLabel)) + '">' + enviesHTML() + '</div>' +
        '<div class="c3-mtools"><span class="c3-result" aria-live="polite"></span>' + clearBtn + sortSel('c3-sort-m') + '</div></div>' +
      // Corps
      '<div class="c3-body"><div class="c3-body-in">' +
        '<nav id="c3-rail" class="c3-rail" aria-label="' + esc(tr(T.railLabel)) + '"></nav>' +
        '<main id="c3-main" class="c3-main"></main>' +
        '<aside id="c3-cart" class="c3-cart" aria-label="' + esc(tr(T.cartTitle)) + '"></aside>' +
      '</div></div>' +
      // Tablette et mobile : barre panier + feuille
      '<div id="c3-mobar" class="c3-mobar"><div id="c3-sheet" class="c3-sheet" role="region" aria-labelledby="c3-sheet-title" hidden></div>' +
        '<div id="c3-mobar-inner" class="c3-mobar-inner"></div></div>' +
      '<div id="c3-status" class="sr-only" role="status" aria-live="polite"></div>';
  }

  function renderShell() {
    var host = $('cat3-root'); if (!host) return;
    host.innerHTML = shellHTML();
    var s1 = $('c3-search'), s2 = $('c3-search-m');
    [s1, s2].forEach(function (inp) {
      if (!inp) return;
      inp.value = state.q;
      inp.addEventListener('input', function () {
        var other = inp === s1 ? s2 : s1; if (other && other.value !== inp.value) other.value = inp.value;
        var v = inp.value;
        clearTimeout(_qT);
        _qT = setTimeout(function () { if (v === state.q) return; state.q = v; renderGrid(); writeUrl(); toResults(); }, 150);
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          clearTimeout(_qT); if (state.q !== inp.value) { state.q = inp.value; renderGrid(); writeUrl(); } toResults();
          if (isMobile()) inp.blur();   // referme le clavier : les résultats sont visibles
        }
      });
    });
    host.querySelectorAll('.c3-sort-sel').forEach(function (sel) {
      sel.value = state.sort;
      sel.addEventListener('change', function () {
        state.sort = SORT_KEYS[sel.value] ? sel.value : '';
        host.querySelectorAll('.c3-sort-sel').forEach(function (o) { if (o !== sel) o.value = state.sort; });
        renderGrid(); writeUrl(); toResults();
      });
    });
    _shell = true;
    _lang = L();
  }

  function visibleSearch() { return isMobile() ? $('c3-search-m') : $('c3-search'); }
  function setQuery(q) {
    state.q = q || '';
    ['c3-search', 'c3-search-m'].forEach(function (id) { var i = $(id); if (i) i.value = state.q; });
    renderGrid(); writeUrl(); toResults();
    var s = visibleSearch(); if (s) s.focus({ preventScroll: true });
  }
  function clearAll() {
    state.q = ''; state.envies = {};
    ['c3-search', 'c3-search-m'].forEach(function (id) { var i = $(id); if (i) i.value = ''; });
    renderGrid(); writeUrl(); toResults();
    var s = visibleSearch(); if (s) s.focus();
  }
  function toggleEnvie(k) {
    if (!ENVIE_KEYS[k]) return;
    state.envies[k] = !state.envies[k];
    renderGrid(); writeUrl(); toResults();
  }

  // Après un filtrage, ramène le haut des résultats sous la barre collante
  function toResults() {
    var main = $('c3-main'); if (!main) return;
    var top = main.getBoundingClientRect().top;
    if (top < _off2) window.scrollTo({ top: Math.max(0, top + window.pageYOffset - _off2 - 8), behavior: 'auto' });
  }

  function onClick(e) {
    var host = $('cat3-root');
    var el = e.target.closest('[data-role]');
    if (e.target.closest('a[href]')) saveScroll();   // vers une fiche : on garde la position
    if (!el || !host || !host.contains(el)) return;
    var role = el.getAttribute('data-role'), key = el.getAttribute('data-key');
    if (role === 'add' || role === 'inc') bumpKey(key, 1);
    else if (role === 'dec') bumpKey(key, -1);
    else if (role === 'go') goTo(el.getAttribute('data-go'), true);
    else if (role === 'envie') toggleEnvie(el.getAttribute('data-envie'));
    else if (role === 'clear') clearAll();
    else if (role === 'q') setQuery(el.getAttribute('data-q'));
    else if (role === 'retry') location.reload();
    else if (role === 'sheet-toggle') openSheet(!state.sheet, false);
    else if (role === 'sheet-close') openSheet(false, true);
  }

  // ── URL : ?q= ?f= ?tri= ?rayon= ──
  function readUrl() {
    var sp; try { sp = new URLSearchParams(location.search); } catch (e) { return; }
    state.q = sp.get('q') || '';
    state.envies = {};
    (sp.get('f') || '').split(',').forEach(function (k) { if (ENVIE_KEYS[k]) state.envies[k] = true; });
    var s = sp.get('tri') || ''; state.sort = SORT_KEYS[s] ? s : '';
    _rayon = sp.get('rayon') || '';
  }
  function writeUrl() {
    try {
      var sp = new URLSearchParams(location.search);
      var set = function (k, v) { if (v) sp.set(k, v); else sp.delete(k); };
      set('q', state.q.trim());
      set('f', activeEnvies().join(','));
      set('tri', state.sort);
      set('rayon', _rayon);
      var qs = sp.toString();
      var url = location.pathname + (qs ? '?' + qs : '') + location.hash;
      if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
    } catch (e) {}
  }

  // ── Position de défilement (retour arrière depuis une fiche) ──
  function scrollKey() { return 'c3-scroll:' + location.pathname + location.search; }
  function saveScroll() { try { sessionStorage.setItem(scrollKey(), String(Math.round(window.pageYOffset))); } catch (e) {} }
  function navType() {
    try { var n = performance.getEntriesByType('navigation')[0]; if (n && n.type) return n.type; } catch (e) {}
    try { return performance.navigation.type === 2 ? 'back_forward' : performance.navigation.type === 1 ? 'reload' : 'navigate'; } catch (e) {}
    return 'navigate';
  }
  function jumpTo(y) {
    var h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    h.style.scrollBehavior = prev;
  }
  function restoreOrJump() {
    if (_restored) return;
    _restored = true;
    var t = navType(), y = null;
    if (t === 'back_forward' || t === 'reload') { try { y = sessionStorage.getItem(scrollKey()); } catch (e) {} }
    if (y !== null && y !== '' && !isNaN(+y)) { _rayonDone = true; setOffsets(); jumpTo(+y); updateScrollSpy(); return; }
    goToRayonFromUrl();
  }

  // Lien direct vers un rayon (accueil, pied de page) : /boutique?rayon=<slug de catégorie>
  function goToRayonFromUrl() {
    if (_rayonDone || !_rayon) return;
    if (!document.querySelector('[data-sec="' + cssEsc(_rayon) + '"]')) return;
    _rayonDone = true;
    var r = _rayon;
    setTimeout(function () { goTo(r, false); }, 80);
  }

  // ── Défilement : rayon actif + saut de section ──
  function updateScrollSpy() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-sec]'));
    if (!nodes.length) return;
    // Rayon actif : celui dont le titre a passé le premier tiers visible sous la barre
    var limit = _off2 + Math.min(200, Math.max(40, (window.innerHeight - _off2) * 0.3));
    var cur = '';
    nodes.forEach(function (n) { if (n.getBoundingClientRect().top <= limit) cur = n.getAttribute('data-sec'); });
    var first = nodes[0].getAttribute('data-sec');
    if (!cur) cur = first;
    if (cur === state.active) return;
    state.active = cur;
    document.querySelectorAll('.c3-railsub, .c3-chip').forEach(function (b) {
      var on = b.getAttribute('data-go') === cur;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    var chips = $('c3-chips');
    var chip = chips && chips.querySelector('.c3-chip[data-go="' + cssEsc(cur) + '"]');
    if (chip) { try { chips.scrollTo({ left: Math.max(0, chip.offsetLeft - 70), behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { chips.scrollLeft = Math.max(0, chip.offsetLeft - 70); } }
    // Le rayon courant suit dans l'URL (sauf tout en haut du catalogue)
    var r = cur === first ? '' : cur;
    if (_restored && r !== _rayon) { _rayon = r; writeUrl(); }
  }
  function onScroll() {
    if (_spyRaf) return;
    _spyRaf = requestAnimationFrame(function () { _spyRaf = 0; updateScrollSpy(); });
    clearTimeout(_saveT); _saveT = setTimeout(saveScroll, 250);
  }
  function goTo(key, focus) {
    var el = document.querySelector('[data-sec="' + cssEsc(key) + '"]');
    if (!el) return;
    setOffsets();
    var y = el.getBoundingClientRect().top + window.pageYOffset - _off2 - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (focus) { var h = el.querySelector('h2'); if (h) { try { h.focus({ preventScroll: true }); } catch (e) {} } }
  }

  // Décalages collants : en-tête du site (s'il reste collé) + barre de filtres
  function stickyHeadH() {
    var hr = $('header-root'); if (!hr) return 0;
    var h = hr.querySelector('header'); if (!h) return 0;
    var pos = getComputedStyle(h).position;
    // L'en-tête n'est collant sur toute la page que si #header-root est « display: contents »
    if (pos === 'fixed' || (pos === 'sticky' && getComputedStyle(hr).display === 'contents')) return Math.round(h.getBoundingClientRect().height);
    return 0;
  }
  function setOffsets() {
    var root = $('cat3-root'); if (!root) return;
    var top = stickyHeadH();
    var bar = isMobile() ? root.querySelector('.c3-mhead') : root.querySelector('.c3-filterbar');
    var bh = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
    _off1 = top; _off2 = top + bh;
    root.style.setProperty('--c3-top', top + 'px');
    root.style.setProperty('--c3-top2', _off2 + 'px');
    var mb = $('c3-mobar-inner');
    if (mb && isCompact()) document.body.style.setProperty('--c3-mobar-h', Math.round(mb.getBoundingClientRect().height) + 'px');
  }

  // ── Langue : app.js appelle onLangChange() (changement de langue ou marque appliquée) ──
  window.onLangChange = function () {
    if (!_shell) return;
    if (L() !== _lang) {
      var open = state.sheet;
      state.sheet = false;
      renderShell();
      renderGrid();
      renderCart();
      if (open) openSheet(true);
    } else {
      renderChrome(_ready ? filtered() : null);
    }
    setOffsets();
  };

  // ── Données ──
  function onData() {
    var has = shopProducts().length > 0;
    if (!has) { if (!_ready) { _failed = true; renderGrid(); } return; }
    _ready = true; _failed = false;
    renderGrid();
    renderCart();
    setOffsets();
    restoreOrJump();
  }

  function boot() {
    readUrl();
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    if (typeof initPage === 'function') initPage('shop');
    renderShell();
    var host = $('cat3-root');
    if (host) host.addEventListener('click', onClick);   // délégation, une seule fois

    if (shopProducts().length) _ready = true;
    renderGrid();
    renderCart();
    setOffsets();
    if (_ready) restoreOrJump();

    // Le header du site est injecté de façon asynchrone → on remesure.
    setTimeout(setOffsets, 100); setTimeout(setOffsets, 500);
    if (window.ResizeObserver && host) {
      var ro = new ResizeObserver(function () { setOffsets(); });
      ro.observe(host);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { setOffsets(); updateScrollSpy(); });
    window.addEventListener('pagehide', saveScroll);

    var timeout = setTimeout(function () { if (!_ready) { _failed = true; renderGrid(); } }, 12000);
    window.addEventListener('sdapi:ready', function (e) {
      var d = (e && e.detail) || {};
      if (shopProducts().length) { clearTimeout(timeout); onData(); return; }
      if (d.fromCache) return;            // cache vide (échec précédent) : on attend le réseau
      clearTimeout(timeout);              // {fallback:true} ou catalogue vide
      if (!_ready) { _failed = true; renderGrid(); }
    });
    // Couronnes : le taux arrive après coup pour les visiteurs suédois
    window.addEventListener('sd:currency', function () {
      document.querySelectorAll('.c3-envie').forEach(function (b) {
        var k = b.getAttribute('data-envie');
        ENVIES.forEach(function (en) { if (en[0] === k) b.textContent = envieLabel(en); });
      });
      if (_ready) renderGrid();
      renderCart();
    });
    // Panier modifié dans un autre onglet (app.js a déjà relu le panier)
    window.addEventListener('storage', function (e) {
      if (e.key !== 'sd_cart' && e.key !== null) return;
      updateAllCards(); renderCart();
    });
    // Retour arrière servi depuis le cache du navigateur : panier relu, recherche alignée
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      if (typeof cart !== 'undefined' && typeof _sdLSGet === 'function') {
        var fresh = _sdLSGet('sd_cart', {});
        Object.keys(cart).forEach(function (k) { delete cart[k]; });
        Object.keys(fresh).forEach(function (k) { cart[k] = fresh[k]; });
        if (typeof updateCartBadge === 'function') updateCartBadge();
      }
      var inp = visibleSearch();
      if (inp && inp.value !== state.q) { state.q = inp.value; renderGrid(); writeUrl(); }
      else updateAllCards();
      renderCart();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.sheet) openSheet(false, true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
