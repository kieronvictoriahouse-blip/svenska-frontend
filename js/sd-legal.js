/* Pages légales (mentions, CGV, confidentialité, contact) : remplit les
   champs .dyn-* avec la configuration de la boutique (back-office →
   Configuration). Un champ vide garde son texte « [À COMPLÉTER : …] »,
   visible exprès : une mention obligatoire manquante doit se voir. */
(function () {
  var MAP = {
    'dyn-brand-name': 'site_name',
    'dyn-legal-name': 'legal_name',
    'dyn-address': 'address',
    'dyn-siret': 'siret',
    'dyn-tva': 'tva',
    'dyn-rcs': 'rcs_city'
  };
  function apply(w) {
    try {
      if (!w) return;
      Object.keys(MAP).forEach(function (cls) {
        var v = w[MAP[cls]];
        if (v) document.querySelectorAll('.' + cls).forEach(function (el) { el.textContent = v; });
      });
      if (w.email) document.querySelectorAll('.dyn-email').forEach(function (el) { el.href = 'mailto:' + w.email; el.textContent = w.email; });
      if (w.phone) document.querySelectorAll('.dyn-phone').forEach(function (el) { el.href = 'tel:' + String(w.phone).replace(/[^\d+]/g, ''); el.textContent = w.phone; });
      if (w.front_url) document.querySelectorAll('.dyn-site-url').forEach(function (el) { el.href = w.front_url; });
    } catch (e) {}
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem('sd_wl_v1') || 'null'); } catch (e) {}
  apply(cached);
  window.addEventListener('sdapi:ready', function () { apply(window.SDApi && window.SDApi.whiteLabel); });
})();
