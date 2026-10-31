/* LANG vient d'app.js (let global, chargé juste au-dessus). Le redéclarer
   ici jetait « Identifier 'LANG' has already been declared » : tout ce bloc
   mourait — récapitulatif jamais affiché, conversion `purchase` jamais
   envoyée à GA4. 17 commandes payées, zéro conversion mesurée (constat du
   09/09/2026). Ne JAMAIS redéclarer LANG au niveau global d'une page. */
const T_SUCCESS = {
  title:    { fr: 'Commande <em>confirmée</em>', en: 'Order <em>confirmed</em>', sv: 'Beställningen är <em>bekräftad</em>' },
  titlePending: { fr: 'Paiement en cours de <em>confirmation</em>', en: 'Payment being <em>confirmed</em>', sv: 'Betalningen <em>bekräftas</em>' },
  sub:      { fr: 'Merci pour votre commande ! Un e-mail de confirmation arrive dans quelques minutes.', en: 'Thank you for your order! A confirmation email is on its way.', sv: 'Tack för din beställning! Ett bekräftelsemejl kommer inom några minuter.' },
  /* Rien ne prévient le client quand la commande est prête : on ne promet
     donc pas qu'elle l'est déjà, on dit comment le retrait se fixe (CGV). */
  subPickup:{ fr: 'Merci pour votre commande ! Nous la préparons et vous contactons pour convenir d’un créneau de retrait à notre atelier d’Étoile-sur-Rhône. Un e-mail de confirmation arrive dans quelques minutes.', en: 'Thank you! We are preparing your order and will contact you to arrange a pickup time at our workshop in Étoile-sur-Rhône. A confirmation email is on its way.', sv: 'Tack! Vi förbereder din beställning och kontaktar dig för att boka en upphämtningstid i vår ateljé i Étoile-sur-Rhône. Ett bekräftelsemejl är på väg.' },
  subPending:{ fr: 'Votre paiement est en cours de vérification. Vous recevrez l’e-mail de confirmation dès qu’il est validé. Si rien n’arrive d’ici une heure, écrivez-nous.', en: 'Your payment is being checked. You will receive the confirmation email as soon as it is approved. If nothing arrives within an hour, please write to us.', sv: 'Din betalning kontrolleras. Du får bekräftelsemejlet så snart den har godkänts. Om inget kommer inom en timme, skriv till oss.' },
  pickup:   { fr: 'Retrait à l’atelier (sur rendez-vous)', en: 'Workshop pickup (by appointment)', sv: 'Upphämtning i ateljén (efter överenskommelse)' },
  items:    { fr: 'Articles', en: 'Items', sv: 'Artiklar' },
  subtotal: { fr: 'Sous-total', en: 'Subtotal', sv: 'Delsumma' },
  discount: { fr: 'Réduction', en: 'Discount', sv: 'Rabatt' },
  shipping: { fr: 'Livraison en point relais', en: 'Pickup-point delivery', sv: 'Leverans till utlämningsställe' },
  free:     { fr: 'Offerte', en: 'Free', sv: 'Gratis' },
  freePickup:{ fr: 'Gratuit', en: 'Free', sv: 'Gratis' },
  total:    { fr: 'Total', en: 'Total', sv: 'Totalt' },
  order:    { fr: 'Commande', en: 'Order', sv: 'Beställning' },
  shop:     { fr: 'Continuer mes achats', en: 'Continue shopping', sv: 'Fortsätt handla' },
  track:    { fr: 'Suivre ma commande', en: 'Track my order', sv: 'Följ min beställning' },
  next:     { fr: 'Et maintenant ?', en: 'What happens next?', sv: 'Vad händer nu?' },
  loading:  { fr: 'Chargement de votre commande…', en: 'Loading your order…', sv: 'Laddar din beställning…' },
  noRecap:  { fr: 'Le récapitulatif ne peut pas s’afficher ici pour le moment : vous le retrouverez dans l’e-mail de confirmation.', en: 'The summary cannot be shown here right now: you will find it in your confirmation email.', sv: 'Sammanfattningen kan inte visas här just nu: du hittar den i bekräftelsemejlet.' },
  stepsRelay: {
    fr: ['Un e-mail de confirmation récapitule votre commande et son numéro.', 'Nous préparons et expédions votre colis sous 24 à 48 h ouvrées.', 'Dès l’expédition, vous recevez le numéro de suivi par e-mail. Le transporteur vous prévient quand le colis arrive au point relais.'],
    en: ['A confirmation email sums up your order and its number.', 'We pack and ship your parcel within 24 to 48 working hours.', 'As soon as it ships, you receive the tracking number by email. The carrier lets you know when the parcel reaches the pickup point.'],
    sv: ['Ett bekräftelsemejl sammanfattar din beställning och dess nummer.', 'Vi packar och skickar ditt paket inom 24–48 timmar (vardagar).', 'När paketet skickas får du spårningsnumret via e-post. Transportören meddelar dig när paketet har kommit till utlämningsstället.']
  },
  stepsPickup: {
    fr: ['Un e-mail de confirmation récapitule votre commande et son numéro.', 'Nous préparons votre commande avec soin.', 'Nous vous contactons pour convenir d’un créneau de retrait à notre atelier d’Étoile-sur-Rhône (Drôme).'],
    en: ['A confirmation email sums up your order and its number.', 'We prepare your order with care.', 'We contact you to arrange a pickup time at our workshop in Étoile-sur-Rhône (Drôme).'],
    sv: ['Ett bekräftelsemejl sammanfattar din beställning och dess nummer.', 'Vi förbereder din beställning omsorgsfullt.', 'Vi kontaktar dig för att boka en tid för upphämtning i vår ateljé i Étoile-sur-Rhône (Drôme).']
  },
  stepsAny: {
    fr: ['Un e-mail de confirmation récapitule votre commande et son numéro.', 'Point relais : colis expédié sous 24 à 48 h ouvrées, numéro de suivi envoyé par e-mail.', 'Retrait à l’atelier : nous vous contactons pour convenir du créneau.'],
    en: ['A confirmation email sums up your order and its number.', 'Pickup point: parcel shipped within 24 to 48 working hours, tracking number sent by email.', 'Workshop pickup: we contact you to arrange a time.'],
    sv: ['Ett bekräftelsemejl sammanfattar din beställning och dess nummer.', 'Utlämningsställe: paketet skickas inom 24–48 timmar (vardagar), spårningsnumret skickas via e-post.', 'Upphämtning i ateljén: vi kontaktar dig för att boka en tid.']
  }
};
const PAID = ['paid', 'confirmed', 'preparing', 'partial', 'shipped', 'delivered'];
var _scOrder = null, _scState = 'none';   // none | loading | ok | pending | error
function _t(o) { return o[LANG] || o.fr; }
/* Montants de la commande : affichés dans la devise où elle a été réglée, quelle que soit la langue.
   Euro : format historique inchangé. Autre devise (autre vitrine) : Intl. */
function _eur(n) {
  var c = String((_scOrder && _scOrder.currency) || (window.SD_SITE && SD_SITE.currency) || 'EUR').toUpperCase();
  if (c !== 'EUR') { try { return new Intl.NumberFormat((window.SD_SITE && SD_SITE.locale) || 'fr-FR', { style: 'currency', currency: c }).format(+n || 0); } catch (e) { return (+n || 0).toFixed(2) + ' ' + c; } }
  n = (+n || 0).toFixed(2); return LANG === 'en' ? '€' + n : n.replace('.', ',') + ' €';
}
function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function _scRender() {
  var o = _scOrder, pickup = !!(o && o.delivery_mode === 'pickup');
  document.getElementById('sc-title').innerHTML = _t(_scState === 'pending' ? T_SUCCESS.titlePending : T_SUCCESS.title);
  document.getElementById('sc-sub').textContent = _t(_scState === 'pending' ? T_SUCCESS.subPending : (pickup ? T_SUCCESS.subPickup : T_SUCCESS.sub));
  document.getElementById('sc-next-t').textContent = _t(T_SUCCESS.next);
  document.getElementById('sc-shop').textContent = _t(T_SUCCESS.shop);
  var track = document.getElementById('sc-track');
  track.textContent = _t(T_SUCCESS.track);
  if (o && o.order_number) track.href = '/compte?commande=' + encodeURIComponent(o.order_number);
  var steps = o ? (pickup ? T_SUCCESS.stepsPickup : T_SUCCESS.stepsRelay) : T_SUCCESS.stepsAny;
  document.getElementById('sc-steps').innerHTML = _t(steps).map(function (s) { return '<li>' + _esc(s) + '</li>'; }).join('');

  var recap = document.getElementById('sc-recap');
  if (_scState === 'loading') {
    recap.innerHTML = '<div class="sc-card" aria-busy="true"><div class="sc-sec"><span class="sc-vh">' + _t(T_SUCCESS.loading) + '</span><div class="sc-skel" style="width:60%"></div><div class="sc-skel" style="width:80%"></div><div class="sc-skel" style="width:40%"></div></div></div>';
    return;
  }
  if (_scState === 'error') { recap.innerHTML = '<p class="sc-note">' + _esc(_t(T_SUCCESS.noRecap)) + '</p>'; return; }
  if (!o) { recap.innerHTML = ''; return; }

  var lines = [];
  try { lines = typeof o.lines === 'string' ? JSON.parse(o.lines) : (o.lines || []); } catch (e) {}
  /* Une éventuelle ligne de frais de port n'est pas un article */
  lines = lines.filter(function (l) { return l && (l.product_id || !/frais de (livraison|port)|^livraison|shipping|frakt/i.test(String(l.name || l.desc || ''))); });
  var shipping = parseFloat(o.shipping) || 0, discount = parseFloat(o.discount) || 0, total = parseFloat(o.total) || 0;
  var subtotal = parseFloat(o.subtotal);
  if (!(subtotal > 0)) subtotal = lines.reduce(function (s, l) { return s + (parseFloat(l.price) || 0) * (parseInt(l.qty, 10) || 1); }, 0);
  var locale = LANG === 'sv' ? 'sv-SE' : LANG === 'en' ? 'en-GB' : 'fr-FR';
  var dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  recap.innerHTML = '<div class="sc-card">'
    + '<div class="sc-card-head"><span class="sc-num">' + _t(T_SUCCESS.order) + ' ' + _esc(o.order_number || '') + '</span><span class="sc-date">' + _esc(dateStr) + '</span></div>'
    + '<div class="sc-sec"><p class="sc-sec-t">' + _t(T_SUCCESS.items) + '</p>'
    + lines.map(function (l) {
        var q = parseInt(l.qty, 10) || 1, p = (parseFloat(l.price) || 0) * q || parseFloat(l.total) || 0;
        return '<div class="sc-line"><span class="sc-line-name">' + _esc(l.name || '') + '</span><span class="sc-line-qty">× ' + q + '</span><span class="sc-line-price">' + _eur(p) + '</span></div>';
      }).join('')
    + '<div class="sc-totals">'
    + '<div class="sc-row"><span>' + _t(T_SUCCESS.subtotal) + '</span><span>' + _eur(subtotal) + '</span></div>'
    + (discount > 0 ? '<div class="sc-row disc"><span>' + _t(T_SUCCESS.discount) + '</span><span>−' + _eur(discount) + '</span></div>' : '')
    + '<div class="sc-row"><span>' + _t(pickup ? T_SUCCESS.pickup : T_SUCCESS.shipping) + '</span><span>' + (shipping > 0 ? _eur(shipping) : _t(pickup ? T_SUCCESS.freePickup : T_SUCCESS.free)) + '</span></div>'
    + '<div class="sc-row grand"><span>' + _t(T_SUCCESS.total) + '</span><span>' + _eur(total) + '</span></div>'
    + '</div></div></div>';
}
function onLangChange() { _scRender(); }

initPage('');
if (typeof clearCart === 'function') clearCart();

(async function () {
  var orderId = new URLSearchParams(location.search).get('order_id');
  if (!orderId) { _scRender(); return; }
  _scState = 'loading'; _scRender();

  // Jusqu'à 8 essais : le webhook Stripe peut mettre quelques secondes à passer la commande en « payée »
  var order = null;
  for (var attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await new Promise(function (r) { setTimeout(r, 1500); });
    try {
      /* Repli sur fetch si un ancien app.js est encore en cache : sinon l'erreur,
         avalée par le catch, tuerait le récapitulatif et la conversion « achat ». */
      var res = await (window.sdFetch || fetch)(((window.SD_SITE && SD_SITE.api) || SD_API_URL) + '/api/orders/' + encodeURIComponent(orderId) + '/public');
      if (res.ok) {
        var d = await res.json();
        if (d.order) { order = d.order; if (PAID.indexOf(d.order.status) !== -1) break; }
      } else if (res.status === 404) break;
    } catch (e) {}
  }
  if (!order) { _scState = 'error'; _scRender(); return; }
  _scOrder = order;
  _scState = PAID.indexOf(order.status) !== -1 ? 'ok' : 'pending';
  _scRender();

  // Conversion « achat » (GA4 + Google Ads + Meta) : une seule fois par commande payée, même si la page est rechargée
  var _tk = 'sd_purch_' + orderId, _seen = false;
  try { _seen = !!localStorage.getItem(_tk); } catch (e) {}
  if (order.status === 'paid' && !_seen && !window._sdPurchSent) {
    window._sdPurchSent = true;
    try { localStorage.setItem(_tk, '1'); } catch (e) {}
    if (typeof sdTrackPurchase === 'function') sdTrackPurchase(order);
  }
}());
