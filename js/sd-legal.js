/* Pages légales et de service (mentions, CGV, confidentialité, contact) :
   remplit les champs .dyn-* avec la configuration de la boutique (back-office
   → Configuration). Un champ vide garde son texte « [À COMPLÉTER : …] »,
   visible exprès : une mention obligatoire manquante doit se voir.
   Exception : .dyn-instagram, simple lien de contact, est masqué (avec son
   bloc [data-dyn-block] s'il en a un) tant qu'aucun compte n'est renseigné. */
(function () {
  var MAP = {
    'dyn-brand-name': 'site_name',
    'dyn-legal-name': 'legal_name',
    'dyn-address': 'address',
    'dyn-siret': 'siret',
    'dyn-tva': 'tva',
    'dyn-rcs': 'rcs_city',
    'dyn-shop-city': 'shop_city'
  };
  /* « 0625536443 » → « 06 25 53 64 43 » ; lien tel: au format international */
  function phoneText(p) {
    var d = String(p).replace(/[^\d+]/g, '');
    return /^0\d{9}$/.test(d) ? d.replace(/(\d{2})(?=\d)/g, '$1 ') : String(p);
  }
  function phoneHref(p) {
    var d = String(p).replace(/[^\d+]/g, '');
    if (/^0\d{9}$/.test(d)) d = '+33' + d.slice(1);
    return 'tel:' + d;
  }
  function apply(w) {
    try {
      if (!w) return;
      Object.keys(MAP).forEach(function (cls) {
        var v = w[MAP[cls]];
        if (v) document.querySelectorAll('.' + cls).forEach(function (el) { el.textContent = v; });
      });
      if (w.email) document.querySelectorAll('.dyn-email').forEach(function (el) { if (el.tagName === 'A') el.href = 'mailto:' + w.email; el.textContent = w.email; });
      if (w.phone) document.querySelectorAll('.dyn-phone').forEach(function (el) { if (el.tagName === 'A') el.href = phoneHref(w.phone); el.textContent = phoneText(w.phone); });
      if (w.front_url) document.querySelectorAll('.dyn-site-url').forEach(function (el) { el.href = w.front_url; });
      var ig = /^https?:\/\//i.test(w.instagram || '') ? w.instagram : '';
      document.querySelectorAll('.dyn-instagram').forEach(function (el) {
        var block = el.closest('[data-dyn-block]') || el;
        if (ig) { el.href = ig; el.target = '_blank'; el.rel = 'noopener'; block.hidden = false; }
        else block.hidden = true;
      });
    } catch (e) {}
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem('sd_wl_v1') || 'null'); } catch (e) {}
  apply(cached);
  window.addEventListener('sdapi:ready', function () { apply(window.SDApi && window.SDApi.whiteLabel); });
})();
