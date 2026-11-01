/* Réglages de la vitrine (SD_SITE, posé par app.js). Swedish Cravings :
   France, retrait à l'atelier possible, paiement en euros, comme avant. */
const _SD_PAYS = SD_SITE.defaultCountry || 'FR';
const _SD_RETRAIT = SD_SITE.pickup !== false;
/* Mode de livraison par defaut : POINT RELAIS, pas le retrait.
   Le retrait etait presolectionne, si bien qu'un visiteur de Lille lisait
   « Retrait en magasin — Gratuit » pour un atelier situe dans la Drome :
   pour lui, la boutique ne livrait pas. Constat du 14/09/2026 : 48 des 69
   commandes payees etaient des retraits, et juillet n'a fait aucune
   expedition. Le Point Relais coute 4,79 EUR reels et reste propose au
   meme prix — c'est le mode qui doit s'afficher en premier.
   Le Click & Collect reste disponible d'un clic, et redevient
   automatiquement obligatoire si le panier contient un produit frais. */
/* Choix du client gardés le temps de la visite (sessionStorage) : un retour
   depuis Stripe, un rechargement ou un aller-retour en boutique ne lui fait
   plus rechoisir son point relais, ni ressaisir son code ou sa note. */
const _CK_KEY = 'sd_checkout_state_v1';
const _ckSaved = (function () { try { return JSON.parse(sessionStorage.getItem(_CK_KEY) || 'null') || {}; } catch (e) { return {}; } })();
function _saveCheckoutState() {
  try {
    sessionStorage.setItem(_CK_KEY, JSON.stringify({
      mode: window._deliveryMode, relay: window._selectedRelay, country: window._relayCountry,
      cp: window._relaySearchCp, carrier: window._relayCarrierName,
      promo: (window._appliedPromo && window._appliedPromo.code) || window._promoInput || '',
      note: window._orderNote || '',
    }));
  } catch (e) {}
}
window._deliveryMode = window._deliveryMode || _ckSaved.mode || 'mondial_relay';
/* Vitrine sans retrait : un ancien choix « retrait » retombe sur le relais */
if (!_SD_RETRAIT && window._deliveryMode === 'pickup') window._deliveryMode = 'mondial_relay';
window._selectedRelay = window._selectedRelay || _ckSaved.relay || null;
window._relayPoints = window._relayPoints || null;
window._relaySearchCp = window._relaySearchCp || _ckSaved.cp || '';
window._relayCountry = window._relayCountry || _ckSaved.country || _SD_PAYS;
window._relayCarrierName = window._relayCarrierName || _ckSaved.carrier || '';
window._relayPriceTE = window._relayPriceTE ?? null;
window._orderNote = window._orderNote || _ckSaved.note || '';
if (!window._promoInput && _ckSaved.promo) window._promoInput = _ckSaved.promo;
function setDeliveryMode(mode) {
  window._deliveryMode = mode;
  if (mode !== 'mondial_relay') { window._selectedRelay = null; window._relayPoints = null; window._relaySearchCp = ''; window._relayCountry = _SD_PAYS; window._relayCarrierName = ''; window._relayPriceTE = null; }
  window._relayErr = false;
  _saveCheckoutState();
  if (mode === 'pickup' && typeof sdTrackShippingInfo === 'function') sdTrackShippingInfo('pickup');
}

/* Horaires d'un point relais ({jour:'lun', plages:['09:00-12:00',…]}),
   regroupés : « Lun–ven 09:00-12:00, 14:00-19:00 · Sam 09:00-12:00 ». */
function _relayHoursText(p) {
  const h = p && Array.isArray(p.horaires) ? p.horaires : [];
  if (!h.length) return '';
  const ORDRE = ['lun','mar','mer','jeu','ven','sam','dim'];
  const NOMS = { fr: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'], en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], sv: ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'] };
  const noms = NOMS[LANG] || NOMS.fr;
  const jours = ORDRE.map(j => { const e = h.find(x => String(x.jour || '').toLowerCase().slice(0, 3) === j); return e && e.plages && e.plages.length ? [].concat(e.plages).join(', ') : ''; });
  const groupes = [];
  jours.forEach((pl, i) => {
    const g = groupes[groupes.length - 1];
    if (pl && g && g.pl === pl && g.fin === i - 1) g.fin = i;
    else if (pl) groupes.push({ deb: i, fin: i, pl });
  });
  return groupes.map(g => noms[g.deb] + (g.fin > g.deb ? '–' + noms[g.fin] : '') + ' ' + g.pl).join(' · ');
}

/* Code postal : en France, la recherche part seule au 5e chiffre */
function _relayCpInput(v) {
  window._relaySearchCp = v;
  const cp = (v || '').trim();
  if ((window._relayCountry || 'FR') === 'FR' && /^\d{5}$/.test(cp) && cp !== window._relayLastSearch) searchRelayPoints(cp);
}

const _TRUST_CHK = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 4.5 6.5 11.5 3 8"/></svg>';

// Produit le moins cher qui, ajouté, fait franchir le seuil de livraison gratuite
function _upsellPick(remaining, cartIds) {
  const avail = (window.PRODUCTS || []).filter(function(p) {
    const id = String(p.uuid || p.id);
    if (cartIds.has(id)) return false;
    if (p.pickup_only) return false;
    if (p.trackStock && p.stock !== null && p.stock <= 0) return false;
    return (p.price || 0) > 0;
  });
  /* On ne propose qu'un ajout raisonnable : dépenser 30 € de plus pour
     économiser 4,90 € de port ne convainc personne. */
  const crossers = avail.filter(function(p) { return p.price >= remaining && p.price <= remaining + 6; })
                        .sort(function(a, b) { return a.price - b.price; });
  return crossers.length ? crossers[0] : null;
}

// Ajout depuis le panier sans ouvrir le tiroir latéral (on est déjà sur la page)
function cartAddQuick(id) {
  addToCart(id);
  if (typeof closeCart === 'function') closeCart();
  renderCartPageFull();
}

/* Carrousel "Complétez votre commande" — de petits plus, pas une deuxième
   box : jamais de box ni de produit à plusieurs formats, les articles à
   5 € ou moins d'abord, et en tête ce qui va avec le panier (des dips
   pour des chips, du chocolat avec des bonbons…). */
const _XSELL_AVEC = {
  'snacks-chips': ['dips'], 'dips': ['snacks-chips'],
  'confiseries': ['chocolat'], 'chocolat': ['confiseries', 'patisserie-basics'],
  'patisserie-basics': ['chocolat', 'boissons'], 'boissons': ['patisserie-basics'],
  'epices': ['sauces'], 'sauces': ['epices'],
};
function _xsellIsBox(p) { return (p.tags || []).some(function(t) { return String(t).toLowerCase() === 'box'; }); }
function _xsellPrice(p) { return window.SDPrice ? SDPrice.effective(p.price, p) : p.price; }
function _crossSellHtml(cartIds) {
  const voulus = new Set();
  (window.PRODUCTS || []).forEach(function(p) {
    if (!cartIds.has(String(p.uuid || p.id))) return;
    (_XSELL_AVEC[p.category && p.category.slug] || []).forEach(function(s) { voulus.add(s); });
  });
  const picks = (window.PRODUCTS || []).filter(function(p) {
    const id = String(p.uuid || p.id);
    if (cartIds.has(id)) return false;
    if (p.pickup_only || sdIsHomeProduct(p) || _xsellIsBox(p)) return false;
    if ((p.variants || []).length > 1) return false;
    if (p.trackStock && p.stock !== null && p.stock <= 0) return false;
    return (p.price || 0) > 0;
  });
  if (picks.length < 2) return '';
  const badge = function(x) { return x.badge === 'badge-pop' ? 0 : x.badge === 'badge-must' ? 1 : x.badge ? 2 : 3; };
  const rank = function(x) { return (_xsellPrice(x) <= 5 ? 0 : 2) + (voulus.has(x.category && x.category.slug) ? 0 : 1); };
  picks.sort(function(a, b) { return rank(a) - rank(b) || badge(a) - badge(b) || _xsellPrice(a) - _xsellPrice(b); });
  /* Sept produits d'épicerie, puis une serviette « pour la table » : petit
     prix, et l'univers Maison n'était visible nulle part dans le parcours. */
  const table = (window.PRODUCTS || []).filter(function(p) {
    return sdIsHomeProduct(p) && !cartIds.has(String(p.uuid || p.id)) && !sdIsOut(p) && (p.price || 0) > 0;
  });
  const list = picks.slice(0, table.length ? 7 : 8).concat(table.slice(0, 1));
  const addTxt = LANG === 'sv' ? 'Lägg till' : LANG === 'en' ? 'Add' : 'Ajouter';
  const title = LANG === 'sv' ? 'Komplettera din beställning' : LANG === 'en' ? 'Complete your order' : 'Complétez votre commande';
  const sub = LANG === 'sv' ? 'Populära tillägg till din korg' : LANG === 'en' ? 'Popular add-ons for your cart' : "Les petits plus qu'on ajoute souvent";
  return '<div class="xsell"><div class="xsell-h">' + title + '</div><div class="xsell-sub">' + sub + '</div><div class="xsell-track">'
    + list.map(function(p) {
        const id = p.uuid || p.id;
        const nm = (p.name && (p.name[LANG] || p.name.fr)) || '';
        return '<div class="xsell-card">'
          + '<img src="' + _sdAttr(sdThumb(p.photo || '', 300)) + '" width="148" height="148" onerror="this.style.display=\'none\'" alt="' + nm.replace(/"/g, '') + '" loading="lazy">'
          + '<div class="xsell-name">' + _sdAttr(nm) + '</div>'
          + '<div class="xsell-foot"><span class="xsell-price">' + fmtPrice(_xsellPrice(p)) + '</span>'
          + '<button class="xsell-add" title="' + addTxt + '" aria-label="' + addTxt + '" onclick="cartAddQuick(\'' + id + '\')">+</button></div>'
          + '</div>';
      }).join('')
    + '</div></div>';
}

/* Le panier est construit entièrement en JS : au changement de langue on le
   redessine, sinon le bloc de paiement (point relais, pays, « Payer »…)
   restait en français jusqu'au rechargement. */
function onLangChange() { if (window._cartPageReady) renderCartPageFull(); }

initPage('');
document.body.classList.add('page-panier');

/* Email du panier : pré-rempli avec la dernière saisie, sinon le compte. */
window._custEmail = window._custEmail || (function () {
  try { return localStorage.getItem('sd_checkout_email') || _sessionEmail() || ''; } catch (e) { return ''; }
})();

/* ── Reprise d'un panier depuis un email de relance ─────────────
   Lien : panier.html?reprise=<commande>.<jeton>[&code=XXX]. Le panier
   abandonné est fusionné avec le panier en cours (on ne retire jamais
   ce que le client a ajouté depuis), le code de la semaine est appliqué,
   et la reprise est gardée pour que le serveur ajoute un éventuel
   cadeau de relance au paiement. */
window._reprise = (function () { try { return sessionStorage.getItem('sd_reprise') || null; } catch (e) { return null; } })();
(function () {
  var q = new URLSearchParams(location.search);
  var rep = q.get('reprise');
  if (!rep) return;
  var code = (q.get('code') || '').trim().toUpperCase();
  window._reprise = rep;
  try { sessionStorage.setItem('sd_reprise', rep); } catch (e) {}
  history.replaceState(null, '', location.pathname);
  var BASE = SD_SITE.api || window.SD_API_URL || 'https://admin.swedishcravings.fr';
  sdFetch(BASE + '/api/relance/panier?reprise=' + encodeURIComponent(rep))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      if (d.email && !window._custEmail) window._custEmail = d.email;
      if (!d.deja_payee && Array.isArray(d.items)) {
        d.items.forEach(function (it) { var k = String(it.id); cart[k] = Math.max(cart[k] || 0, it.qty); });
        saveCart(); updateCartBadge();
      }
      if ((d.delivery_mode === 'pickup' && _SD_RETRAIT) || d.delivery_mode === 'mondial_relay') setDeliveryMode(d.delivery_mode);
      /* Le point relais de la commande abandonnée revient avec le panier :
         le client n'a plus qu'à payer. */
      if (d.delivery_mode === 'mondial_relay' && d.relay_point && d.relay_point.id) {
        window._selectedRelay = d.relay_point;
        window._relayCountry = d.relay_point.pays || window._relayCountry || _SD_PAYS;
        _saveCheckoutState();
      }
      renderCartPageFull();
      if (code) {
        window._promoInput = code;
        var appliquer = function () { applyPromoCode(); };
        if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) appliquer();
        else window.addEventListener('sdapi:ready', appliquer, { once: true });
      }
    })
    .catch(function () {});
})();

/* Arrivée par un lien de parrainage (js/app.js) : le code ami est proposé
   tant qu'aucun autre code n'est saisi. Une reprise de panier, plus
   récente, garde la main. */
(function () {
  if (window._promoInput || window._appliedPromo) return;
  var p = null;
  try { p = JSON.parse(localStorage.getItem('sd_parrain') || 'null'); } catch (e) {}
  if (!p || !p.code || Date.now() - (p.t || 0) > 30 * 86400000) return;
  window._promoInput = p.code;
  var appliquer = function () { if (!window._appliedPromo) applyPromoCode(); };
  if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) appliquer();
  else window.addEventListener('sdapi:ready', appliquer, { once: true });
})();

renderCartPageFull();
/* Un code gardé de la visite (retour de Stripe) est revalidé, jamais supposé valable */
if (window._promoInput && !window._appliedPromo && _ckSaved.promo) {
  if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) applyPromoCode();
  else window.addEventListener('sdapi:ready', function () { if (!window._appliedPromo) applyPromoCode(); }, { once: true });
}

// ── Offre "cadeau offert" : chargée une fois, re-render au retour ──
/* Plusieurs offres cadeau peuvent cohabiter (« un Center offert » ET
   « 2 dipmix achetés, le 3e offert ») : un choix par offre, rangé sous
   l'identifiant de l'offre. L'ancien choix unique est repris par la
   première offre qui propose ce produit, pour ne rien perdre. */
window._giftOffers = [];
window._giftChoicesBy = (function(){
  try {
    var m = JSON.parse(localStorage.getItem('sd_gift_choices_v2') || 'null');
    if (m && typeof m === 'object' && !Array.isArray(m)) return m;
  } catch(e){}
  return {};
})();
window._giftLegacy = (function(){
  try {
    var m = JSON.parse(localStorage.getItem('sd_gift_choices') || 'null');
    if (Array.isArray(m)) return m;
    var seul = localStorage.getItem('sd_gift_choice');
    return seul ? [seul] : [];
  } catch(e){ return []; }
})();
window._giftEarnedBy = {};
window._giftTouchedBy = {};
function _saveGiftChoices(){
  try { localStorage.setItem('sd_gift_choices_v2', JSON.stringify(window._giftChoicesBy)); } catch(e){}
}
/* Une offre « 2 achetés, 1 offert » peut en accorder plusieurs : le
   choix est donc une liste, plafonnée par ce que le panier a mérité.
   Recliquer sur un cadeau déjà pris le retire. */
function selectGift(offerId, id){
  var l = (window._giftChoicesBy[offerId] || []).slice();
  var i = l.indexOf(id);
  if (i >= 0) l.splice(i, 1);
  else {
    var max = window._giftEarnedBy[offerId] || 0;
    if (l.length >= max) l.shift();      // le plus ancien cède la place
    l.push(id);
  }
  window._giftChoicesBy[offerId] = l;
  window._giftTouchedBy[offerId] = true;
  _saveGiftChoices();
  renderCartPageFull();
}

/* Combien de cadeaux le panier mérite. Copie fidèle de la règle du
   serveur (src/lib/cadeau.ts) : les deux DOIVENT dire la même chose,
   sinon le client choisit un cadeau qu'on lui retire au paiement. */
function giftEarned(offer, cart, subtotal){
  if (!offer) return 0;
  var trigIds = (offer.trigger_products || []).map(function(p){ return p.id; });
  var pas = Number(offer.trigger_qty) || 0;

  /* Réglage incomplet — des produits déclencheurs sans quantité, ou
     l'inverse : aucun cadeau. Échouer fermé, jamais ouvert. */
  if ((trigIds.length && !pas) || (pas && !trigIds.length)) return 0;

  var n = 0;
  if (offer.mode === 'quantite' && trigIds.length && pas) {
    var comptees = 0;
    Object.entries(cart || {}).forEach(function(e){
      var key = e[0], qty = e[1];
      if (!(qty > 0)) return;
      var ri = key.indexOf('_');
      var idStr = ri === -1 ? key : key.slice(0, ri);
      if (trigIds.indexOf(idStr) !== -1) comptees += qty;
    });
    n = Math.floor(comptees / pas);
  } else {
    n = subtotal >= (Number(offer.threshold) || 0) ? 1 : 0;
  }
  if (offer.max > 0) n = Math.min(n, offer.max);
  return Math.max(0, n);
}
(async function(){
  try {
    const r = await sdFetch((SD_SITE.api || window.SD_API_URL || 'https://admin.swedishcravings.fr') + '/api/gift-offer');
    const j = await r.json();
    window._giftOffers = (j && Array.isArray(j.offers)) ? j.offers : ((j && j.offer) ? [j.offer] : []);
    // Reprise de l'ancien choix unique (voir plus haut).
    (window._giftLegacy || []).forEach(function(gid){
      var o = window._giftOffers.find(function(of){ return (of.products || []).some(function(p){ return p.id === gid; }); });
      if (o && !(window._giftChoicesBy[o.id] || []).length) window._giftChoicesBy[o.id] = [gid];
    });
    window._giftLegacy = [];
  } catch(e) { window._giftOffers = []; }
  renderCartPageFull();
})();

/* La page est redessinée d'un bloc (chargement des produits, cadeau, code…).
   On garde le champ actif et la position du curseur : sans cela, chaque
   redessin fermait le clavier mobile au milieu de la saisie. */
function renderCartPageFull() {
  const a = document.activeElement;
  const keep = a && a.id && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)
    ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null;
  _renderCartPage();
  window._cartPageReady = true;
  if (keep) {
    const n = document.getElementById(keep.id);
    if (n && n !== document.activeElement) {
      n.focus({ preventScroll: true });
      try { if (keep.s != null) n.setSelectionRange(keep.s, keep.e); } catch (e) {}
    }
  }
  _updatePayBar();
}

function _payLabel() { return LANG === 'sv' ? 'Betala säkert →' : LANG === 'en' ? 'Pay securely →' : 'Payer en toute sécurité →'; }
function _payBarLabel() { return LANG === 'sv' ? 'Betala →' : LANG === 'en' ? 'Pay →' : 'Payer →'; }

/* Barre collante : total à jour, cachée quand le vrai bouton est visible */
function _updatePayBar() {
  const bar = document.getElementById('pay-bar');
  if (!bar) return;
  const hasItems = Object.values(cart).some(q => q > 0);
  const amt = document.getElementById('pay-bar-amount');
  if (amt) amt.textContent = window._lastTotal != null ? fmtPrice(window._lastTotal) : '';
  const btn = document.getElementById('pay-bar-btn');
  if (btn) { btn.textContent = window._payInFlight ? '…' : _payBarLabel(); btn.disabled = !!window._payInFlight; }
  const realBtn = document.querySelector('.cart-page-summary .btn-pay');
  if (window._payObs) window._payObs.disconnect();
  window._payBtnVisible = false;
  if (realBtn && 'IntersectionObserver' in window) {
    window._payObs = new IntersectionObserver(function (es) {
      window._payBtnVisible = es[0].isIntersecting;
      bar.classList.toggle('is-hidden', !hasItems || window._payBtnVisible);
    }, { threshold: 0.4 });
    window._payObs.observe(realBtn);
  }
  bar.classList.toggle('is-hidden', !hasItems || window._payBtnVisible);
}

function _renderCartPage() {
  const root = document.getElementById('cart-page-root');
  if (!root) return;

  /* Le panier se recale sur le stock avant d'etre dessine : ce que le
     client lit doit etre ce qu'il pourra payer. Le changement s'affiche
     dans la page (bandeau au-dessus du panier, pas d'alerte bloquante),
     en precisant que les commandes deja passees ne sont pas touchees. */
  if (typeof sdRevaliderPanier === 'function') {
    const _chg = sdRevaliderPanier();
    if (_chg.length && typeof sdAfficherRecalage === 'function') sdAfficherRecalage(_chg);
  }

  const entries = Object.entries(cart).filter(([,q]) => q > 0);

  if (entries.length === 0) {
    window._lastTotal = null;
    if (typeof sdAfficherPrecommande === 'function') sdAfficherPrecommande(null);
    root.innerHTML = `
      <div class="cart-page-empty">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 6h8l6 32h28l6-24H18"/><circle cx="26" cy="52" r="3"/><circle cx="42" cy="52" r="3"/>
          </svg>
        </div>
        <h2 data-sv="Din korg är tom" data-fr="Votre panier est vide" data-en="Your cart is empty">${UI[LANG].emptyCart}</h2>
        <p data-sv="Godis, chips, fika: fyll din korg med svenska favoriter." data-fr="Bonbons, chips, fika : composez votre colis suédois." data-en="Sweets, crisps, fika: build your Swedish parcel.">${LANG==='sv'?'Godis, chips, fika: fyll din korg med svenska favoriter.':LANG==='en'?'Sweets, crisps, fika: build your Swedish parcel.':'Bonbons, chips, fika : composez votre colis suédois.'}</p>
        <a href="/boutique" class="btn-primary">${LANG==='sv'?'Utforska butiken':LANG==='en'?'Explore the shop':'Explorer la boutique'}</a>
      </div>`;
    return;
  }

  const cartIdSet = new Set(entries.map(([key]) => { const i = key.indexOf('_'); return i === -1 ? key : key.slice(0, i); }));

  let subtotal = 0;
  // Hors articles déjà en promotion : l'assiette des codes fidélité et ami.
  let _remisable = 0;
  // Pré-commande : produit à la date d'expédition la plus tardive du panier
  let _preLast = null;
  const itemRows = entries.map(([key, qty]) => {
    const _ri = key.indexOf('_');
    const idStr = _ri === -1 ? key : key.slice(0, _ri);
    const variant = _ri === -1 ? undefined : key.slice(_ri + 1);
    const _cpd = _sdCartProducts();
    const p = PRODUCTS.find(x => String(x.uuid || x.id) === idStr || (/^\d+$/.test(idStr) && x.id === parseInt(idStr))) || _cpd[idStr] || (window._SD_STATIC||[]).find(x => String(x.id) === idStr);
    if (!p) return '';
    const _pre = typeof sdPreorder === 'function' && sdPreorder(p);
    if (_pre && (!_preLast || String(p.preorderShip || '') > String(_preLast.preorderShip || ''))) _preLast = p;
    const v = variant ? p.variants?.find(x => x.label === variant) : p.variants?.[0];
    const _base = v ? v.price : p.price;
    const _onSale = !!(window.SDPrice && SDPrice.active(p));
    const price = window.SDPrice ? SDPrice.effective(_base, p) : _base;
    const line = price * qty;
    subtotal += line;
    if (!_onSale) _remisable += line;
    const _priceCell = _onSale
      ? `<span class="cart-row-price-old">${fmtPrice(_base * qty)}</span><span class="cpr-price cart-row-price--sale">${fmtPrice(line)}</span>`
      : `<span class="cpr-price">${fmtPrice(line)}</span>`;
    return `
      <div class="cart-page-row">
        <img class="cpr-img" src="${p.photo || ''}" alt="${p.name?.[LANG] || p.name?.fr || ''}" onerror="this.style.display='none'">
        <div class="cpr-info">
          <div class="cpr-name">${p.name?.[LANG] || p.name?.fr || ''}</div>
          <div class="cpr-sub">${variant || p.weight || ''}</div>
          ${_pre ? `<div class="cpr-pre">${sdPreorderLabel()}${sdPreorderShipText(p) ? ' · ' + sdPreorderShipText(p) : ''}</div>` : ''}
          <div style="margin-top:10px;">
            <button class="cpr-del" onclick="removeItem('${key}');renderCartPageFull();" data-sv="Ta bort" data-fr="Supprimer" data-en="Remove">${LANG==='sv'?'Ta bort':LANG==='en'?'Remove':'Supprimer'}</button>
          </div>
        </div>
        <div class="cpr-qty">
          <button onclick="changeQty('${key}',-1);renderCartPageFull();">−</button>
          <span>${qty}</span>
          <button onclick="changeQty('${key}',1);renderCartPageFull();">+</button>
        </div>
        <div class="cpr-price-wrap" style="text-align:right;">${_priceCell}</div>
      </div>`;
  }).join('');
  if (typeof sdAfficherPrecommande === 'function') sdAfficherPrecommande(_preLast);

  // Produit "retrait uniquement" (frais, fragile…) dans le panier → toute la commande passe en click & collect
  const cartHasPickupOnly = entries.some(([key]) => {
    const _pi = key.indexOf('_');
    const idStr = _pi === -1 ? key : key.slice(0, _pi);
    const _cpp = _sdCartProducts();
    const pp = PRODUCTS.find(x => String(x.uuid || x.id) === idStr || (/^\d+$/.test(idStr) && x.id === parseInt(idStr))) || _cpp[idStr] || (window._SD_STATIC||[]).find(x => String(x.id) === idStr);
    return !!(pp && pp.pickup_only);
  });
  if (cartHasPickupOnly && window._deliveryMode !== 'pickup') setDeliveryMode('pickup');

  /* Miroir de INTERNATIONAL_COUNTRIES (back). La Suede y entre : elle
     etait proposee au client mais facturee au tarif France. La Suisse
     en sort — hors UE et 40 EUR TTC de port reel.
     La liste vient de SD_SITE ; celle-ci reste en secours. */
  const INTL_COUNTRIES = SD_SITE.intlCountries || ['ES','PT','IT','DE','NL','BE','LU','SE'];
  const isIntl = INTL_COUNTRIES.includes(window._relayCountry || _SD_PAYS);
  // Seuil et coût pilotés par la boutique (opération « livraison offerte » comprise).
  // Estimation uniquement — /api/checkout recalcule et fait foi.
  const _shipRules = window.SD_SHIP ? SD_SHIP.rules(isIntl) : { threshold: isIntl ? 50 : 29, cost: isIntl ? 9.90 : 4.90, promoActive: false, baseThreshold: isIntl ? 50 : 29 };
  const freeThreshold = _shipRules.threshold;
  const baseShipping  = _shipRules.cost;
  const _shipPromoLabel = window.SD_SHIP ? SD_SHIP.label(LANG) : '';

  const remaining = freeThreshold - subtotal;
  const pct = Math.min(100, (subtotal / freeThreshold) * 100);
  const _upProd = remaining > 0 ? _upsellPick(remaining, cartIdSet) : null;
  const _upHtml = _upProd ? (function(){
    const uid = _upProd.uuid || _upProd.id;
    const _unmRaw = _upProd.name?.[LANG] || _upProd.name?.fr || '';
    const unm = _unmRaw.length > 30 ? _unmRaw.slice(0, 30).trim() + '…' : _unmRaw;
    const addTxt = LANG==='sv'?'Lägg till':LANG==='en'?'Add':'Ajouter';
    const lead = LANG==='sv'?'Lägg till':LANG==='en'?'Add':'Ajoutez';
    const tail = LANG==='sv'?'→ fri frakt':LANG==='en'?'→ free delivery':'→ livraison offerte';
    return `<div class="ship-upsell">
        <img src="${_upProd.photo||''}" onerror="this.style.display='none'" alt="">
        <div class="ship-upsell-txt">${lead} <strong>${unm}</strong> (${fmtPrice(_upProd.price)}) ${tail}</div>
        <button class="ship-upsell-btn" onclick="cartAddQuick('${uid}')">+ ${addTxt}</button>
      </div>`;
  })() : '';
  const _freeShipInner = `<div class="summary-ship-text">${LANG==='sv'?`${fmtPrice(remaining)} kvar till fri frakt`:LANG==='en'?`${fmtPrice(remaining)} away from free delivery`:`Plus que ${fmtPrice(remaining)} pour la livraison offerte`}</div>
        <div class="summary-bar"><div class="summary-bar-fill" style="width:${pct}%"></div></div>
        ${_upHtml}`;
  const _freeShipTxt = _shipPromoLabel || (LANG === 'sv' ? 'Fri frakt' : LANG === 'en' ? 'Free delivery' : 'Livraison offerte');
  const _freeDoneInner = `<div class="summary-ship-text" style="color:var(--moss);">${_freeShipTxt} ✓</div>`;
  // Bandeau d'opération : rappelle l'offre tant que le seuil n'est pas atteint
  const _promoBanner = (_shipRules.promoActive && _shipPromoLabel && remaining > 0)
    ? `<div class="summary-ship-text" style="color:var(--lingon);font-weight:600;margin-bottom:6px;">${_shipPromoLabel}</div>`
    : '';
  const shipHtml = `<div class="summary-ship-bar">${_promoBanner}${remaining > 0 ? _freeShipInner : _freeDoneInner}</div>`;

  const shipping = subtotal >= freeThreshold ? 0 : baseShipping;
  const _promoValid = !!(window._appliedPromo && subtotal >= (window._appliedPromo.min_order || 0));
  const _discountAmt = _promoValid ? _calcPromoDiscount(window._appliedPromo, subtotal, _remisable) : 0;
  const _isFreeShip = _promoValid && window._appliedPromo.type === 'free_shipping';
  // Nudge "livraison gratuite" (barre + upsell), affiché en point relais où des frais s'appliquent
  const freeShipNudge = _isFreeShip ? '' : shipHtml;
  const _effectiveShipping = (_isFreeShip || window._deliveryMode === 'pickup') ? 0 : shipping;
  const _totalToPay = Math.max(0, subtotal - _discountAmt) + _effectiveShipping;
  const _promoLabel = LANG==='sv'?'Kampanjkod':LANG==='en'?'Promo code':'Code promo';
  const _promoApplyLabel = LANG==='sv'?'Tillämpa':LANG==='en'?'Apply':'Appliquer';
  const _promoInputVal = window._appliedPromo?.code || window._promoInput || '';
  const _promoMinFail = !!(window._appliedPromo && !_promoValid);
  const _promoMsgToShow = _promoMinFail ? { ok: false, text: `${LANG==='en'?'Minimum order':LANG==='sv'?'Minsta order':'Commande minimum'} ${fmtPrice(window._appliedPromo.min_order)} ${LANG==='en'?'required':LANG==='sv'?'krävs':'requise'}` } : window._promoMsg;
  const _promoMsgHtml = _promoMsgToShow ? `<div class="promo-msg ${_promoMsgToShow.ok?'ok':(_promoMsgToShow.info?'info':'err')}" role="status">${_promoMsgToShow.text}</div>` : '';
  const _promoDiscHtml = (_promoValid && _discountAmt > 0) ? `<div class="summary-line" style="color:var(--moss)"><span>${LANG==='sv'?'Rabatt':LANG==='en'?'Discount':'Réduction'} (${window._appliedPromo.code})</span><span>−${fmtPrice(_discountAmt)}</span></div>` : ((_promoValid && _isFreeShip) ? `<div class="summary-line" style="color:var(--moss)"><span>Code ${window._appliedPromo.code}</span><span>${LANG==='sv'?'Fri frakt':LANG==='en'?'Free shipping':'Livraison offerte'}</span></div>` : '');

  const relayPickerHtml = window._deliveryMode === 'mondial_relay' ? (function() {
    const L = LANG || 'fr';
    const esc = (s) => _sdAttr(s == null ? '' : s);
    const sel = window._selectedRelay;
    /* Point déjà choisi (dans la visite, ou repris d'un email de relance) :
       on l'affiche seul, avec ses horaires, et « Changer » rouvre la liste. */
    if (sel && !window._relayChanging) {
      const hrs = _relayHoursText(sel);
      return '<div class="relay-picker"><div class="relay-selected-info" role="status">'
        + '<strong>' + esc(sel.name) + '</strong><br>' + esc(sel.adresse) + ', ' + esc(sel.cp) + ' ' + esc(sel.ville)
        + (hrs ? '<span class="relay-hours">' + esc(hrs) + '</span>' : '')
        + '</div><button type="button" class="relay-change" onclick="window._relayChanging=true;renderCartPageFull();document.getElementById(\'relay-cp-input\')?.focus()">'
        + (L==='en'?'Change pickup point':L==='sv'?'Byt utlämningsställe':'Changer de point relais') + '</button></div>';
    }
    let listHtml = '';
    if (window._relayPoints === 'loading') {
      listHtml = '<div class="relay-status" role="status">'+(L==='en'?'Searching for pickup points…':L==='sv'?'Söker utlämningsställen…':'Recherche des points relais…')+'</div>';
    } else if (window._relayErrMsg) {
      listHtml = '<div class="relay-status err" role="alert">'+esc(window._relayErrMsg)+' <button type="button" class="relay-retry" onclick="searchRelayPoints(window._relaySearchCp)">'+(L==='en'?'Try again':L==='sv'?'Försök igen':'Réessayer')+'</button></div>';
    } else if (Array.isArray(window._relayPoints)) {
      if (window._relayPoints.length === 0) {
        listHtml = '<div class="relay-status">'+(L==='en'?'No pickup point found for this postal code. Check it, or choose Click & Collect.':L==='sv'?'Inget utlämningsställe hittades för detta postnummer. Kontrollera det eller välj Click & Collect.':'Aucun point relais trouvé pour ce code postal. Vérifiez-le, ou choisissez le Click & Collect.')+'</div>';
      } else {
        listHtml = '<ul class="relay-list">' + window._relayPoints.map(function(p,i){
          return '<li><button type="button" class="relay-item'+(sel&&sel.id===p.id?' selected':'')+'" onclick="selectRelay('+i+')">'
            +'<span class="relay-item-name" style="display:block">'+esc(p.name)+'</span>'
            +'<span class="relay-item-addr" style="display:block">'+esc(p.adresse)+', '+esc(p.cp)+' '+esc(p.ville)+(p.distance?' — '+esc(L==='en'?p.distance:String(p.distance).replace('.',','))+' km':'')+'</span>'
            +'</button></li>';
        }).join('') + '</ul>';
      }
    }
    const cpPlaceholder = L==='sv'?'Postnummer':L==='en'?'Postal code':'Code postal';
    const searchTxt = L==='sv'?'Sök':L==='en'?'Search':'Chercher';
    /* Suède et non Suisse : la Suisse était encore proposée et facturée au
       tarif France pour ~40 € de port réel. Miroir de INTERNATIONAL_COUNTRIES
       (lib/shipping.ts). Libellés dans la langue du visiteur. */
    const PAYS = { FR:['France','France','Frankrike'], ES:['Espagne','Spain','Spanien'], PT:['Portugal','Portugal','Portugal'], BE:['Belgique','Belgium','Belgien'], LU:['Luxembourg','Luxembourg','Luxemburg'], NL:['Pays-Bas','Netherlands','Nederländerna'], DE:['Allemagne','Germany','Tyskland'], IT:['Italie','Italy','Italien'], SE:['Suède','Sweden','Sverige'] };
    const li = L==='en' ? 1 : L==='sv' ? 2 : 0;
    const countrySelect = '<select id="relay-country-select" class="ck-input relay-country" aria-label="'+(L==='en'?'Country':L==='sv'?'Land':'Pays')+'" onchange="window._relayCountry=this.value;window._relayPoints=null;window._selectedRelay=null;window._relaySearchCp=\'\';window._relayErrMsg=\'\';window._relayLastSearch=\'\';_saveCheckoutState();renderCartPageFull();">'
      + Object.keys(PAYS).map(c => '<option value="'+c+'"'+(window._relayCountry===c?' selected':'')+'>'+PAYS[c][li]+'</option>').join('')
      + '</select>';
    const relayErrHtml = (window._relayErr && !sel)
      ? '<div class="relay-status err" role="alert">'+(L==='en'?'Choose a pickup point to continue: enter your postal code.':L==='sv'?'Välj ett utlämningsställe för att fortsätta: ange ditt postnummer.':'Choisissez un point relais pour continuer : indiquez votre code postal.')+'</div>'
      : '';
    return '<div class="relay-picker">'
      + relayErrHtml
      +'<div class="relay-search-row">'
      + countrySelect
      +'<input id="relay-cp-input" class="ck-input relay-cp-input" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="10" aria-label="'+cpPlaceholder+'" placeholder="'+cpPlaceholder+'" value="'+esc(window._relaySearchCp||'')+'" oninput="_relayCpInput(this.value)" onkeydown="if(event.key===\'Enter\')searchRelayPoints(this.value)">'
      +'<button type="button" class="relay-search-btn" onclick="searchRelayPoints(document.getElementById(\'relay-cp-input\')?.value||\'\')">'+ searchTxt+'</button>'
      +'</div>'
      +listHtml
      +'</div>';
  })() : '';

  // ── Cadeau offert (au-dessus d'un seuil) ──
  let _giftBlockHtml = '';
  /* Une offre après l'autre : chacune a son bloc, son compte et ses choix. */
  (window._giftOffers || []).forEach(function(offer){
    if (!offer || !offer.products || !offer.products.length) return;
    const oid = offer.id;

    /* Ce que le panier a RÉELLEMENT mérité. Le seuil seul ne suffit
       plus : une offre « 2 Piffi achetés » ne se déclenche pas parce
       que le sous-total dépasse zéro. */
    const earned = giftEarned(offer, cart, subtotal);
    window._giftEarnedBy[oid] = earned;

    if (earned < 1) {
      window._giftChoicesBy[oid] = [];
      let msg;
      if (offer.mode === 'quantite') {
        /* Au-delà de 3 produits (« tous nos dipmix »), la liste complète
           devient un pavé : on en cite deux et on dit qu'il y en a d'autres. */
        const _tous = (offer.trigger_products || [])
          .map(p => p['name_' + LANG] || p.name_fr || '').filter(Boolean);
        const noms = _tous.length > 3
          ? _tous.slice(0, 2).join(' / ') + (LANG==='sv' ? ' eller en annan vara i erbjudandet' : LANG==='en' ? ' or another product in the offer' : ' ou un autre produit de l’offre')
          : _tous.join(' / ');
        const pas = Number(offer.trigger_qty) || 0;
        let dedans = 0;
        Object.entries(cart || {}).forEach(function(e){
          const key = e[0], qty = e[1];
          if (!(qty > 0)) return;
          const ri = key.indexOf('_');
          const idStr = ri === -1 ? key : key.slice(0, ri);
          if ((offer.trigger_products || []).some(p => p.id === idStr)) dedans += qty;
        });
        const manque = pas - (dedans % pas);
        msg = LANG==='sv' ? `Lägg till ${manque} × ${noms} för din gratis gåva`
            : LANG==='en' ? `Add ${manque} × ${noms} for your free gift`
            : `Encore ${manque} × ${noms} pour votre cadeau offert`;
      } else {
        const left = (offer.threshold || 0) - subtotal;
        if (left <= 0) return;               // rien à annoncer
        msg = LANG==='sv' ? `Bara ${fmtPrice(left)} kvar till din gratis gåva`
            : LANG==='en' ? `Only ${fmtPrice(left)} away from your free gift`
            : `Plus que ${fmtPrice(left)} pour votre cadeau offert`;
      }
      _giftBlockHtml += `<div class="gift-nudge">${msg}</div>`;
      return;
    }

    const ids = offer.products.map(p => p.id);
    /* On purge les choix devenus invalides, et on plafonne à ce qui est
       mérité : retirer un Piffi du panier doit retirer le cadeau. */
    window._giftChoicesBy[oid] = (window._giftChoicesBy[oid] || []).filter(id => ids.includes(id)).slice(0, earned);
    /* Un seul cadeau possible et un seul produit proposé : on le pose,
       il n'y a rien à choisir. */
    if (earned === 1 && offer.products.length === 1) window._giftChoicesBy[oid] = [offer.products[0].id];
    /* Cadeau mérité mais pas encore choisi : on en pose un d'office, que le
       client peut changer. Sans cela, qui ne voyait pas le bloc payait sans
       son cadeau. Un client qui en retire un exprès n'est pas contredit. */
    else if (!window._giftChoicesBy[oid].length && !window._giftTouchedBy[oid]) window._giftChoicesBy[oid] = ids.slice(0, earned);

    const choisis = window._giftChoicesBy[oid];
    const choices = offer.products.map(p => {
      const nm = p['name_' + LANG] || p.name_fr || '';
      const sel = choisis.includes(p.id);
      return `<button type="button" class="gift-choice${sel?' sel':''}" onclick="selectGift('${oid}','${p.id}')"><img src="${p.image_url||''}" onerror="this.style.display='none'" alt=""><span class="gift-choice-nm">${nm}</span>${sel?'<span class="gift-check">✓</span>':''}</button>`;
    }).join('');

    const reste = earned - choisis.length;
    const titleBase = offer.products.length > 1
      ? (LANG==='sv'?'Välj din gåva':LANG==='en'?'Choose your free gift':'Choisissez votre cadeau')
      : (LANG==='sv'?'Din gratis gåva':LANG==='en'?'Your free gift':'Votre cadeau offert');
    /* Quand plusieurs cadeaux sont acquis, on dit combien il en reste à
       choisir — sinon le client en prend un et laisse l'autre. */
    const title = earned > 1
      ? `${titleBase} — ${choisis.length}/${earned}`
      : titleBase;
    _giftBlockHtml += `<div class="gift-block"><div class="gift-title"><span>${title}</span><span class="gift-free">${LANG==='en'?'Free':LANG==='sv'?'Gratis':'Offert'} · 0 €</span></div><div class="gift-choices">${choices}</div></div>`;
  });
  _saveGiftChoices();

  /* Produits « retrait uniquement » : le client peut les retirer pour
     retrouver la livraison, au lieu de buter sur un bouton grisé. */
  const _pickupOnlyKeys = entries.filter(([key]) => {
    const _pi = key.indexOf('_');
    const idStr = _pi === -1 ? key : key.slice(0, _pi);
    const _cpp = _sdCartProducts();
    const pp = PRODUCTS.find(x => String(x.uuid || x.id) === idStr || (/^\d+$/.test(idStr) && x.id === parseInt(idStr))) || _cpp[idStr] || (window._SD_STATIC||[]).find(x => String(x.id) === idStr);
    return !!(pp && pp.pickup_only);
  }).map(([key]) => key);
  const _pickupOnlyHtml = cartHasPickupOnly ? `<div class="pickup-only-note">${LANG==='sv'?'Din korg innehåller en färskvara som bara kan hämtas på plats: hela beställningen blir Click &amp; Collect.':LANG==='en'?'Your cart contains a fresh item available for pickup only, so the whole order is Click &amp; Collect.':'Votre panier contient un produit frais à retirer sur place : toute la commande passe en Click &amp; Collect.'}<button type="button" onclick="_retirerProduitsRetrait()">${LANG==='sv'?(_pickupOnlyKeys.length>1?'Ta bort dessa varor för leverans':'Ta bort varan för leverans'):LANG==='en'?(_pickupOnlyKeys.length>1?'Remove these items to get delivery':'Remove this item to get delivery'):(_pickupOnlyKeys.length>1?'Retirer ces produits pour être livré':'Retirer ce produit pour être livré')}</button></div>` : '';
  window._pickupOnlyKeys = _pickupOnlyKeys;

  /* Click & Collect : où et comment, dès le choix (CGV art. livraison) */
  const _pickupInfoHtml = window._deliveryMode === 'pickup' ? `<div class="pickup-info">${LANG==='sv'?'Gratis upphämtning i vår ateljé i Étoile-sur-Rhône (Drôme). Vi kontaktar dig efter beställningen för att boka en tid.':LANG==='en'?'Free pickup at our workshop in Étoile-sur-Rhône (Drôme). We contact you after your order to book a time.':'Retrait gratuit à notre atelier d’Étoile-sur-Rhône (Drôme), sur rendez-vous : nous vous contactons après la commande pour fixer le créneau.'}</div>` : '';

  const _relayShipLabel = (_isFreeShip || subtotal >= freeThreshold) ? (LANG==='sv'?'Gratis':LANG==='en'?'Free':'Offerte') : fmtPrice(baseShipping);
  const _payBtnLabel = window._payInFlight ? '…' : _payLabel();
  window._lastTotal = _totalToPay;
  const _noteOpen = !!(window._noteOpen || (window._orderNote || '').trim());
  const _promoOpen = !!(window._promoOpen || _promoInputVal || _promoMsgToShow);
  const _shipLineVal = window._deliveryMode === 'pickup'
    ? `<span style="color:var(--moss)">${LANG==='sv'?'Gratis':LANG==='en'?'Free':'Gratuit'}</span>`
    : _effectiveShipping === 0 ? `<span style="color:var(--moss)">${LANG==='sv'?'Gratis':LANG==='en'?'Free':'Offerte'}</span>` : fmtPrice(_effectiveShipping);
  const _shipLineLbl = (LANG==='sv'?'Leverans':LANG==='en'?'Shipping':'Livraison')
    + (window._deliveryMode === 'mondial_relay' && window._relayCarrierName ? ` <small style="color:var(--dust)">(${_sdAttr(window._relayCarrierName)})</small>` : '');

  root.innerHTML = `
    <div class="cart-page-layout">
      <div class="cart-page-items">
        <div class="cart-page-heading">
          <span data-sv="Produkt" data-fr="Produit" data-en="Product">${LANG==='sv'?'Produkt':LANG==='en'?'Product':'Produit'}</span>
          <span data-sv="Antal" data-fr="Quantité" data-en="Qty">${LANG==='sv'?'Antal':LANG==='en'?'Qty':'Quantité'}</span>
          <span data-sv="Pris" data-fr="Prix" data-en="Price">${LANG==='sv'?'Pris':LANG==='en'?'Price':'Prix'}</span>
        </div>
        ${itemRows}
        ${_giftBlockHtml}
      </div>

      <div class="cart-page-summary">
        <h2 class="summary-title" data-sv="Orderöversikt" data-fr="Récapitulatif" data-en="Order summary">${LANG==='sv'?'Orderöversikt':LANG==='en'?'Order summary':'Récapitulatif'}</h2>
        <div class="delivery-toggle" role="group" aria-label="${LANG==='sv'?'Leveranssätt':LANG==='en'?'Delivery method':'Mode de livraison'}">
          <button type="button" class="dt-btn${window._deliveryMode==='mondial_relay'?' active':''}" aria-pressed="${window._deliveryMode==='mondial_relay'}"${cartHasPickupOnly?' disabled':''} onclick="setDeliveryMode('mondial_relay');renderCartPageFull()">
            ${LANG==='sv'?'Utlämningsställe':LANG==='en'?'Pickup point':'Point relais'}<small>${_relayShipLabel}</small>
          </button>
          ${(window._relayCountry || _SD_PAYS) !== _SD_PAYS || !_SD_RETRAIT ? '' : `<button type="button" class="dt-btn${window._deliveryMode==='pickup'?' active':''}" aria-pressed="${window._deliveryMode==='pickup'}" onclick="setDeliveryMode('pickup');renderCartPageFull()">
            Click &amp; Collect<small>${LANG==='sv'?'Gratis · Drôme':LANG==='en'?'Free · Drôme':'Gratuit · Drôme'}</small>
          </button>`}
        </div>
        ${_pickupOnlyHtml}
        ${_pickupInfoHtml}
        ${relayPickerHtml}
        <div class="summary-line">
          <span data-sv="Delsumma" data-fr="Sous-total" data-en="Subtotal">${UI[LANG].subtotal}</span>
          <span>${fmtPrice(subtotal)}</span>
        </div>
        ${_promoDiscHtml}
        <div class="summary-line">
          <span>${_shipLineLbl}</span>
          <span>${_shipLineVal}</span>
        </div>
        ${window._deliveryMode==='mondial_relay' ? freeShipNudge : ''}
        <div class="promo-section">
          ${_promoOpen ? `
          <label class="ck-label" for="promo-input">${_promoLabel}</label>
          <div class="promo-row">
            <input id="promo-input" class="ck-input promo-input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${_sdAttr(_promoInputVal)}" oninput="window._promoInput=this.value.toUpperCase();this.value=this.value.toUpperCase();" onkeydown="if(event.key==='Enter')applyPromoCode();">
            <button type="button" class="promo-btn" onclick="applyPromoCode();">${_promoApplyLabel}</button>
          </div>
          ${_promoMsgHtml}` : `<button type="button" class="promo-toggle" onclick="window._promoOpen=true;renderCartPageFull();document.getElementById('promo-input')?.focus()">${LANG==='sv'?'Har du en kampanjkod?':LANG==='en'?'Have a promo code?':'Vous avez un code ?'}</button>`}
        </div>
        <div class="summary-line total">
          <span>Total</span>
          <span>${fmtPrice(_totalToPay)}${sdSekSpan(_totalToPay)}</span>
        </div>
        ${LANG==='sv' && SD_SITE.currency==='EUR' ? '<p class="eur-note">Du betalar i euro (EUR). Beloppet i kronor är ungefärligt: din bank räknar om det.</p>' : ''}
        <div class="checkout-email">
          <label class="ck-label" for="checkout-email-input">${LANG==='sv'?'Din e-postadress':LANG==='en'?'Your email':'Votre email'}</label>
          <input id="checkout-email-input" class="ck-input" type="email" autocomplete="email" inputmode="email" required aria-describedby="checkout-email-help checkout-email-err" value="${_sdAttr(window._custEmail||'')}" oninput="window._custEmail=this.value.trim();try{localStorage.setItem('sd_checkout_email',window._custEmail)}catch(e){};this.style.borderColor='';this.removeAttribute('aria-invalid');var er=document.getElementById('checkout-email-err');if(er)er.textContent='';" onchange="_revaliderCodePromo()" placeholder="${LANG==='sv'?'namn@exempel.se':LANG==='en'?'name@example.com':'prenom@exemple.fr'}">
          <div id="checkout-email-err" role="alert" style="font-family:var(--font-body);font-size:14px;color:#8E2A20;margin-top:6px;"></div>
          <p id="checkout-email-help" style="font-family:var(--font-body);font-size:13px;line-height:1.5;color:var(--dust);margin:6px 0 16px;">${LANG==='sv'?'För din orderbekräftelse.':LANG==='en'?'For your order confirmation.':'Pour votre confirmation de commande.'}</p>
        </div>
        <details class="order-note"${_noteOpen?' open':''} ontoggle="window._noteOpen=this.open">
          <summary>${LANG==='sv'?'Lägg till en kommentar':LANG==='en'?'Add a note to your order':'Ajouter une note à la commande'}</summary>
          <label class="ck-label" for="order-note-input" style="margin-top:10px;">${LANG==='sv'?'Kommentar (valfritt)':LANG==='en'?'Note (optional)':'Note (facultatif)'}</label>
          <textarea id="order-note-input" class="ck-input" rows="3" maxlength="500" oninput="window._orderNote=this.value;_saveCheckoutState()" placeholder="${LANG==='sv'?'T.ex. present, särskilda instruktioner…':LANG==='en'?'E.g. gift, special instructions…':'Ex : cadeau, instruction particulière…'}">${_sdAttr(window._orderNote||'')}</textarea>
        </details>
        <div class="pay-error${window._payErr?' show':''}" id="pay-error" role="alert">${_sdAttr(window._payErr||'')}</div>
        <button type="button" class="btn-pay" onclick="doCheckout()"${window._payInFlight?' disabled':''}>${_payBtnLabel}</button>
        <p class="pay-cgv">${LANG==='sv'?'Genom att bekräfta godkänner du våra <a href="/cgv" target="_blank" rel="noopener">villkor</a>.':LANG==='en'?'By confirming, you accept our <a href="/cgv" target="_blank" rel="noopener">terms of sale</a>.':'En validant, vous acceptez les <a href="/cgv" target="_blank" rel="noopener">CGV</a>.'}</p>
        <div class="btn-pay-sec">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="5" width="8" height="6" rx="1"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5"/></svg>
          <span>${LANG==='sv'?'Säker betalning via Stripe':LANG==='en'?'Secure payment via Stripe':'Paiement sécurisé via Stripe'}</span>
        </div>
        <div class="pay-methods" aria-label="${LANG==='sv'?'Godkända betalsätt':LANG==='en'?'Accepted payment methods':'Moyens de paiement acceptés'}">${sdPayLogos('pay-m')}</div>
        <div style="text-align:center;font-family:var(--font-body);font-size:13px;color:var(--dust);margin-top:10px;">${LANG==='sv'?'Betala i 3 eller 4 delar med Klarna eller Scalapay (enligt villkor) vid betalningen.':LANG==='en'?'Pay in 3 or 4 instalments with Klarna or Scalapay (subject to eligibility) at checkout.':'Paiement en 3 ou 4 fois avec Klarna ou Scalapay (selon éligibilité), proposé à l’étape du paiement.'}</div>
        <ul class="trust-list">
          <li>${_TRUST_CHK}${window._deliveryMode==='pickup'?(LANG==='sv'?'Upphämtning efter överenskommelse':LANG==='en'?'Pickup by appointment':'Retrait sur rendez-vous'):(LANG==='sv'?'Skickas inom 1–2 arbetsdagar':LANG==='en'?'Ships within 1–2 working days':'Expédié sous 24 à 48 h ouvrées')}</li>
          <li>${_TRUST_CHK}${LANG==='sv'?'Äkta svenska produkter':LANG==='en'?'Authentic Swedish products':'Produits suédois authentiques'}</li>
          <li>${_TRUST_CHK}${LANG==='sv'?'Kundservice som hjälper dig':LANG==='en'?'Responsive customer service':'Service client à votre écoute'}</li>
        </ul>
      </div>

      <div class="cart-page-more">
        ${_crossSellHtml(cartIdSet)}
        <div style="margin-top:24px;">
          <a href="/boutique" class="cart-continue">← ${LANG==='sv'?'Fortsätt handla':LANG==='en'?'Continue shopping':'Continuer mes achats'}</a>
        </div>
      </div>
    </div>`;
}

/* Retire les produits « retrait uniquement » et rend la livraison possible */
function _retirerProduitsRetrait() {
  (window._pickupOnlyKeys || []).forEach(k => removeItem(k));
  setDeliveryMode('mondial_relay');
  renderCartPageFull();
}

function _calcPromoDiscount(promo, sub, remisable) {
  if (!promo) return 0;
  // Code fidélité, code ami : pas sur les articles déjà en promotion.
  if (promo.hors_promo && remisable != null) sub = remisable;
  if (promo.type === 'percent') return Math.round(Math.min(sub, (sub * promo.value) / 100) * 100) / 100;
  if (promo.type === 'fixed') return Math.min(sub, promo.value);
  return 0;
}

/* Motif d'un code refusé — par /api/promo/validate ou par le checkout. */
function _promoRefus(reason, minOrder) {
  const L = LANG || 'fr';
  const MSG = {
    not_yet:      L==='en'?'Code not yet valid':L==='sv'?'Koden är inte giltig ännu':'Code pas encore valide',
    expired:      L==='en'?'Code expired':L==='sv'?'Koden har gått ut':'Code expiré',
    exhausted:    L==='en'?'Code no longer available':L==='sv'?'Koden är inte längre tillgänglig':'Code plus disponible',
    already_used: L==='en'?'Code already used':L==='sv'?'Koden är redan använd':'Code déjà utilisé',
    min_order:    `${L==='en'?'Minimum order':L==='sv'?'Minsta order':'Commande minimum'} ${fmtPrice(minOrder || 0)} ${L==='en'?'required':L==='sv'?'krävs':'requise'}`,
    invalid:      L==='en'?'Invalid or inactive code':L==='sv'?'Ogiltig kod':'Code invalide ou inactif',
    email_required:   L==='en'?'Enter your email below to use this code':L==='sv'?'Ange din e-postadress nedan för att använda koden':'Indiquez votre email ci-dessous pour utiliser ce code',
    not_owner:        L==='en'?'This loyalty code belongs to another email address':L==='sv'?'Stamkundskoden hör till en annan e-postadress':'Ce code fidélité est lié à une autre adresse email',
    own_code:         L==='en'?'That’s your friend code — share it with your friends!':L==='sv'?'Det är din vänkod – dela den med dina vänner!':'C’est votre code ami : partagez-le à vos proches !',
    not_new_customer: L==='en'?'This friend code is for a first order only':L==='sv'?'Vänkoden gäller bara en första beställning':'Ce code ami est réservé à une première commande',
    only_promo_items: L==='en'?'This code does not apply to items already on sale':L==='sv'?'Koden gäller inte varor som redan är rabatterade':'Ce code ne s’applique pas aux articles déjà en promotion',
  };
  return MSG[reason] || MSG.invalid;
}

/* Code fidélité ou code ami : sa validité dépend de l'email du panier.
   On le revérifie quand l'email change, et on retente un code refusé. */
function _revaliderCodePromo() {
  const p = window._appliedPromo;
  const refuse = !p && window._promoInput && window._promoMsg && !window._promoMsg.ok;
  if (p || refuse) applyPromoCode();
}

/* Email du client connecté, pour le contrôle « 1 usage par client » */
function _sessionEmail() {
  try { return (JSON.parse(localStorage.getItem('sd_customer_v1') || 'null') || {}).customer_email || ''; }
  catch (e) { return ''; }
}

async function applyPromoCode() {
  const code = ((document.getElementById('promo-input')?.value || '') || window._promoInput || '').trim().toUpperCase();
  if (!code) return;
  const BASE = SD_SITE.api || window.SD_API_URL || 'https://admin.swedishcravings.fr';
  const L = LANG || 'fr';

  // Sous-total courant : sert au contrôle du minimum de commande côté serveur
  const entries = Object.entries(cart).filter(([,q]) => q > 0);
  let st = 0;
  let base = 0; // hors articles déjà en promotion (codes fidélité et ami)
  entries.forEach(([key, qty]) => {
    const ri = key.indexOf('_'); const idStr = ri===-1?key:key.slice(0,ri);
    const _cpd = _sdCartProducts();
    const p = PRODUCTS.find(x => String(x.uuid||x.id)===idStr||(/^\d+$/.test(idStr)&&x.id===parseInt(idStr)))||_cpd[idStr]||(window._SD_STATIC||[]).find(x=>String(x.id)===idStr);
    if (!p) return;
    const variant = ri===-1?undefined:key.slice(ri+1);
    const v = variant?p.variants?.find(x=>x.label===variant):p.variants?.[0];
    const _base = v?v.price:p.price;
    const ligne = (window.SDPrice?SDPrice.effective(_base,p):_base) * qty;
    st += ligne;
    if (!(window.SDPrice && SDPrice.active(p))) base += ligne;
  });
  // L'email du panier : un code fidélité ou un code ami ne vaut que pour un email.
  const email = ((document.getElementById('checkout-email-input')?.value) || window._custEmail || _sessionEmail() || '').trim();

  const fail = (text, info) => {
    window._appliedPromo = null; window._promoInput = code;
    window._promoMsg = { ok: false, info: !!info, text };
    _saveCheckoutState();
    renderCartPageFull();
  };

  try {
    // Validation serveur : la liste des codes n'est plus exposée publiquement
    const res = await sdFetch(BASE + '/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: st, base, email }),
    });
    if (!res.ok) throw new Error('validate failed');
    const r = await res.json();

    if (!r.valid) {
      /* Code ami d'un lien de parrainage qui ne servira plus : on cesse
         de le proposer à chaque visite. */
      if (['invalid', 'own_code', 'not_new_customer'].includes(r.reason)) {
        try {
          const p = JSON.parse(localStorage.getItem('sd_parrain') || 'null');
          if (p && p.code === code) localStorage.removeItem('sd_parrain');
        } catch (e) {}
      }
      /* Email pas encore saisi : ce n'est pas un refus, juste l'étape suivante */
      fail(_promoRefus(r.reason, r.min_order), r.reason === 'email_required');
      return;
    }

    window._appliedPromo = { code: r.code, type: r.type, value: r.value, min_order: r.min_order, kind: r.kind || null, hors_promo: !!r.hors_promo };
    window._promoInput = code;
    const discAmt = r.discount || 0;
    // Une partie du panier est déjà en promotion : on dit pourquoi la remise est plus petite.
    const horsPromo = r.hors_promo && base < st
      ? (L==='en'?' (items on sale excluded)':L==='sv'?' (rabatterade varor undantagna)':' (hors articles en promotion)')
      : '';
    const discLabel = r.type==='free_shipping'
      ? (L==='en'?'Free shipping applied!':L==='sv'?'Fri frakt aktiverad!':'Livraison offerte appliquée !')
      : `${L==='en'?'Discount':L==='sv'?'Rabatt':'Réduction'} −${fmtPrice(discAmt)} ${L==='en'?'applied!':L==='sv'?'tillämpas!':'appliquée !'}${horsPromo}`;
    window._promoMsg = { ok: true, text: discLabel };
    _saveCheckoutState();
    renderCartPageFull();
  } catch(e) {
    fail(L==='en'?'Error. Try again.':L==='sv'?'Fel. Försök igen.':'Erreur. Réessayez.');
  }
}

async function searchRelayPoints(cp) {
  if (!cp || cp.trim().length < 4) return;
  window._relaySearchCp = cp.trim();
  window._relayLastSearch = cp.trim();
  window._relayPoints = 'loading';
  window._relayErrMsg = '';
  window._relayChanging = true;   // l'ancien point reste valable tant qu'aucun autre n'est choisi
  _saveCheckoutState();
  renderCartPageFull();
  const L = LANG || 'fr';
  const BASE = SD_SITE.api || window.SD_API_URL || 'https://admin.swedishcravings.fr';
  const pays = window._relayCountry || _SD_PAYS;
  try {
    /* Le panier n'interrogeait que Mondial Relay : il ne pouvait donc
       proposer que ses points, meme la ou un autre transporteur est
       moins cher — Shop2Shop est a 6,59 EUR vers l'Italie contre 7,88,
       et il est le seul a desservir la Suede. La route ci-dessous
       demande a UGO le transporteur le moins cher du pays, puis ne
       renvoie que SES points : un point relais appartient a un
       transporteur, le choix du point est donc celui du transporteur. */
    var res = await sdFetch(BASE + '/api/logspher/relay-points?cp=' + encodeURIComponent(cp.trim()) + '&country=' + encodeURIComponent(pays) + '&lang=' + encodeURIComponent(L));
    var data = res.ok ? await res.json() : null;
    if (!data) throw new Error('HTTP ' + res.status);
    var pts = Array.isArray(data) ? data : (data.points || []);
    window._relayPoints = pts;
    /* Service du transporteur indisponible : on le dit, avec « Réessayer »,
       au lieu de laisser croire qu'il n'y a aucun point près de chez lui. */
    window._relayErrMsg = (!pts.length && data.erreur) ? String(data.erreur) : '';
    window._relayCarrierName = data.carrier_name || '';
    window._relayPriceTE = data.price_te != null ? data.price_te : null;
  } catch(e) {
    window._relayPoints = [];
    window._relayErrMsg = L==='en' ? 'Pickup points could not be loaded.' : L==='sv' ? 'Utlämningsställena kunde inte laddas.' : 'Les points relais n’ont pas pu être chargés.';
  }
  _saveCheckoutState();
  renderCartPageFull();
}

function selectRelay(i) {
  const p = (window._relayPoints || [])[i];
  if (!p) return;
  window._selectedRelay = p;
  window._relayChanging = false;
  window._relayErr = false;
  _saveCheckoutState();
  if (typeof sdTrackShippingInfo === 'function') sdTrackShippingInfo('mondial_relay');
  renderCartPageFull();
  document.querySelector('.relay-change')?.focus({ preventScroll: true });
}

async function doCheckout() {
  // Checkout direct : plus de gate email/profil. Stripe Checkout collecte
  // lui-même l'email, le nom, le téléphone (et l'adresse si besoin) de façon
  // fiable + Apple/Google Pay. On passe juste le token si le client est déjà
  // connecté (pour rattacher la commande à son compte) — jamais obligatoire.
  if (window._payInFlight) return;
  window._payErr = '';
  const _pe = document.getElementById('pay-error');
  if (_pe) { _pe.textContent = ''; _pe.classList.remove('show'); }
  let session = null;
  try { session = JSON.parse(localStorage.getItem('sd_customer_v1') || 'null'); } catch(e) {}

  // Build item list
  const items = Object.entries(cart)
    .filter(([,q]) => q > 0)
    .map(([key, qty]) => {
      const ri = key.indexOf('_');
      const idStr = ri === -1 ? key : key.slice(0, ri);
      const variant = ri === -1 ? undefined : key.slice(ri + 1);
      const idInt = parseInt(idStr);
      let id = idStr;
      if (!isNaN(idInt) && /^\d+$/.test(idStr)) {
        const p = PRODUCTS.find(x => x.id === idInt || String(x.id) === idStr);
        if (p && p.uuid) id = p.uuid;
      }
      return Object.assign({ id, quantity: qty }, variant ? { variant } : {});
    });

  // Cadeau offert : envoyé si un choix est fait et le seuil atteint (revalidé côté serveur)
  try {
    if ((window._giftOffers || []).length) {
      let _sub = 0;
      Object.entries(cart).filter(([, q]) => q > 0).forEach(([key, qty]) => {
        const ri = key.indexOf('_'); const idStr = ri === -1 ? key : key.slice(0, ri);
        const _cpd = _sdCartProducts();
        const p = PRODUCTS.find(x => String(x.uuid || x.id) === idStr || (/^\d+$/.test(idStr) && x.id === parseInt(idStr))) || _cpd[idStr] || (window._SD_STATIC || []).find(x => String(x.id) === idStr);
        if (!p) return;
        const variant = ri === -1 ? undefined : key.slice(ri + 1);
        const v = variant ? (p.variants || []).find(x => x.label === variant) : (p.variants || [])[0];
        _sub += ((v ? v.price : p.price) || 0) * qty;
      });
      /* Le serveur revalide et tranche : on n'envoie que ce qui est
         mérité selon la même règle, un article par cadeau. */
      /* Chaque cadeau part avec son offre : le serveur ne le sert
         qu'au titre de celle-ci. */
      window._giftOffers.forEach(function(offer){
        const _earned = giftEarned(offer, cart, _sub);
        (window._giftChoicesBy[offer.id] || []).slice(0, _earned).forEach(function(gid){
          if ((offer.products || []).some(p => p.id === gid)) {
            items.push({ id: gid, quantity: 1, gift: true, offer_id: offer.id });
          }
        });
      });
    }
  } catch(e) {}

  if (items.length === 0) return;

  /* Email obligatoire avant Stripe : il sert à la confirmation ET à la
     relance si le paiement n'aboutit pas. Pré-rempli ensuite chez Stripe,
     le client ne le tape qu'une fois. */
  const _emailEl = document.getElementById('checkout-email-input');
  const _email = ((_emailEl && _emailEl.value) || window._custEmail || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(_email)) {
    const _err = document.getElementById('checkout-email-err');
    if (_err) _err.textContent = LANG === 'en' ? 'Please enter a valid email address.' : LANG === 'sv' ? 'Ange en giltig e-postadress.' : 'Merci d’indiquer une adresse email valide.';
    if (_emailEl) { _emailEl.style.borderColor = '#8E2A20'; _emailEl.setAttribute('aria-invalid', 'true'); _emailEl.focus(); _emailEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return;
  }
  window._custEmail = _email;
  try { localStorage.setItem('sd_checkout_email', _email); } catch (e) {}

  const isPickup = window._deliveryMode === 'pickup';
  const isMR = window._deliveryMode === 'mondial_relay';
  const BASE = SD_SITE.api || window.SD_API_URL || 'https://admin.swedishcravings.fr';

  /* Pas d'alert() : sur mobile, la fenêtre système cassait le parcours
     et laissait le client chercher le sélecteur. On l'y amène. */
  if (isMR && !window._selectedRelay) {
    window._relayErr = true;
    renderCartPageFull();
    const picker = document.querySelector('.relay-picker');
    if (picker) picker.scrollIntoView({ block: 'center' });
    document.getElementById('relay-cp-input')?.focus({ preventScroll: true });
    return;
  }

  if (typeof sdTrackBeginCheckout === 'function') sdTrackBeginCheckout();

  // Proceed to Stripe checkout — Stripe collecte email/nom/téléphone/adresse
  _setPayBusy(true);
  try {
    const res = await sdFetch(BASE + '/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        delivery_mode: window._deliveryMode || 'delivery',
        ...(session?.token ? { customer_token: session.token } : {}),
        customer_email: _email,
        lang: LANG,
        // Arrivée par un email de relance : le serveur y retrouve le cadeau éventuel.
        ...(window._reprise ? { reprise: window._reprise } : {}),
        promo_code: window._appliedPromo?.code || null,
        customer_note: (window._orderNote || '').trim() || null,
        ...(window._deliveryMode === 'mondial_relay' && window._selectedRelay ? {
          relay_point_id: window._selectedRelay.id,
          relay_point_name: window._selectedRelay.name,
          relay_point_address: window._selectedRelay.adresse + ', ' + window._selectedRelay.cp + ' ' + window._selectedRelay.ville,
          relay_point_pays: window._selectedRelay.pays || window._relayCountry || _SD_PAYS,
          relay_carrier_uuid: window._selectedRelay.carrier_uuid || null,
        } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      // Repère : on part vers Stripe. Si le client revient ici sans avoir
      // payé (cancel_url = panier), app.js proposera l'aide WhatsApp Victoria.
      try { sessionStorage.setItem('sd_from_stripe', '1'); } catch (e) {}
      window.location.href = data.url;
      return;                              // le bouton reste « … » jusqu'au départ
    }
    _setPayBusy(false);
    if (data.code === 'OUT_OF_STOCK') {
      // Stock insuffisant refusé par le serveur : la liste s'affiche au-dessus du bouton.
      const lines = (data.items || []).map(function(it){
        const s = it.available > 0
          ? (LANG === 'en' ? ('only ' + it.available + ' left') : LANG === 'sv' ? ('endast ' + it.available + ' kvar') : ('plus que ' + it.available + ' en stock'))
          : (LANG === 'en' ? 'out of stock' : LANG === 'sv' ? 'slut i lager' : 'épuisé');
        return '• ' + it.name + ' — ' + s;
      }).join('\n');
      const head = LANG === 'en' ? 'Some items are no longer available in the requested quantity:' : LANG === 'sv' ? 'Vissa varor finns inte i önskat antal:' : 'Certains articles ne sont plus disponibles dans la quantité demandée :';
      const foot = LANG === 'en' ? 'Please adjust your cart.' : LANG === 'sv' ? 'Justera din varukorg.' : 'Ajustez votre panier.';
      _showPayError(head + '\n' + lines + '\n' + foot);
    } else if (data.code === 'PROMO_REFUSED') {
      /* Code refusé au dernier moment (email changé, ami déjà client, code
         épuisé…) : on le dit sous le champ du code plutôt que de faire
         payer plein tarif sans prévenir. */
      window._appliedPromo = null;
      window._promoOpen = true;
      window._promoMsg = { ok: false, text: _promoRefus(data.reason, data.min_order) };
      _saveCheckoutState();
      renderCartPageFull();
      document.getElementById('promo-input')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (data.code === 'RELAY_POINT_REQUIRED') {
      window._relayErr = true;
      window._selectedRelay = null;
      renderCartPageFull();
      document.querySelector('.relay-picker')?.scrollIntoView({ block: 'center' });
    } else if (data.error && /^(BAD_EMAIL|PICKUP_ONLY|COUNTRY_NOT_SERVED|BAD_QUANTITY)$/.test(data.code || '')) {
      // Refus métier : le serveur envoie déjà le message dans la langue du client.
      _showPayError(String(data.error));
    } else {
      // ORDER_CREATE_FAILED, SERVER_ERROR ou réponse inattendue : rien n'a été débité.
      _showPayError(LANG === 'en' ? 'Payment could not start. Nothing was charged; please try again in a moment.' : LANG === 'sv' ? 'Betalningen kunde inte starta. Inget har debiterats, försök igen om en stund.' : 'Le paiement n’a pas pu démarrer. Rien n’a été débité : réessayez dans un instant.');
    }
  } catch(e) {
    console.error('[checkout]', e);
    _setPayBusy(false);
    _showPayError(LANG === 'en' ? 'Connection problem. Check your network and try again.' : LANG === 'sv' ? 'Anslutningsproblem. Kontrollera nätverket och försök igen.' : 'Problème de connexion. Vérifiez votre réseau et réessayez.');
  }
}

/* Un seul envoi à la fois : les doubles clics créaient des commandes
   brouillon en double, puis autant de relances. */
function _setPayBusy(on) {
  window._payInFlight = !!on;
  document.querySelectorAll('.btn-pay').forEach(function (b) {
    b.disabled = !!on;
    b.textContent = on ? '…' : (b.id === 'pay-bar-btn' ? _payBarLabel() : _payLabel());
  });
}

/* Erreur de paiement affichée au-dessus du bouton (plus d'alert()) */
function _showPayError(msg) {
  window._payErr = msg || '';
  renderCartPageFull();
  const el = document.getElementById('pay-error');
  if (el && msg) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* Retour depuis Stripe par « Précédent » : la page sort du cache avec le
   bouton bloqué sur « … ». On la remet en état. */
window.addEventListener('pageshow', function (e) {
  if (!e.persisted) return;
  window._payInFlight = false;
  renderCartPageFull();
});

// Re-render when API products load (handles timing with PRODUCTS array)
window.addEventListener('sdapi:ready', () => { renderCartPageFull(); if (typeof sdTrackViewCart === 'function') sdTrackViewCart(); });
if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length && typeof sdTrackViewCart === 'function') sdTrackViewCart();
