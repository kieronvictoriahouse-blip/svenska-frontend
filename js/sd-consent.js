/**
 * Mesure d'audience & publicité — SOURCE UNIQUE (chargé dans le <head> de chaque page,
 * AVANT app.js, en script bloquant : il doit définir gtag() avant tout événement).
 *
 * - Consent Mode v2, mode « basique » : tout est refusé par défaut et la balise Google
 *   (gtag.js) n'est même pas téléchargée tant que le visiteur n'a pas cliqué « Accepter ».
 *   Avant le consentement, aucune requête ne part vers Google (ni cookie, ni signal
 *   anonyme). Les événements (gtag('event', …)) restent en file dans dataLayer.
 *   Le pixel Meta suit la même règle (app.js écoute l'événement « sd:consent »).
 * - GA4 + Google Ads sont configurés ici et nulle part ailleurs.
 * - Bannière : « Accepter » et « Refuser » strictement identiques (exigence CNIL), choix
 *   mémorisé 6 mois, réouvrable via sdCookieSettings() (bouton « Cookies » du pied de page).
 *   Un refus après acceptation efface les cookies _ga / _gcl / _fbp déjà posés.
 * - window.sdConsent() renvoie 'granted', 'denied' ou null (pas encore choisi).
 *
 * Pour brancher Google Ads : renseigner ADS_ID (AW-…) et PURCHASE_LABEL (Google Ads →
 * Objectifs → Conversions → balise → « send_to: AW-XXX/LABEL »), bumper ?v= partout.
 * Si le pixel Meta est activé (app.js), citer Meta dans le texte ci-dessous.
 */

/* Polices de la marque. Ce script est le seul du <head> commun à toutes les pages :
   il lance le chargement des polices tout de suite, en parallèle de style.css (qui les
   importait auparavant, en cascade, après son propre téléchargement). */
(function () {
  try {
    if (document.getElementById('sd-fonts')) return;
    var h = document.head || document.getElementsByTagName('head')[0];
    var pc = document.createElement('link');
    pc.rel = 'preconnect'; pc.href = 'https://fonts.gstatic.com'; pc.crossOrigin = 'anonymous';
    h.appendChild(pc);
    var f = document.createElement('link');
    f.id = 'sd-fonts'; f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@300;400;500;600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap';
    h.appendChild(f);
  } catch (e) {}
})();

(function () {
  var GA4_ID = 'G-14P3X9NYVY';
  var ADS_ID = '';          // ex. 'AW-123456789' — vide = Google Ads non branché
  var PURCHASE_LABEL = '';  // ex. 'AbCdEfGhIjk' — libellé de la conversion « Achat »
  var STORE_KEY = 'sd_consent_v1';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182; // 6 mois (recommandation CNIL : ≤ 13 mois)

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  var DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  var GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };

  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.ts < MAX_AGE) return c.v;
    } catch (e) {}
    return null;
  }
  var choice = readChoice();
  window.sdConsent = function () { return choice; };

  gtag('consent', 'default', Object.assign({}, choice === 'granted' ? GRANTED : DENIED, { wait_for_update: 500 }));
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
  gtag('js', new Date());
  gtag('config', GA4_ID);
  if (ADS_ID) gtag('config', ADS_ID, { allow_enhanced_conversions: true });

  window.SD_ADS = { id: ADS_ID, purchaseLabel: PURCHASE_LABEL };

  /* La balise Google n'est téléchargée qu'après « Accepter » */
  var tagLoaded = false;
  function loadTag() {
    if (tagLoaded) return;
    tagLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    (document.head || document.documentElement).appendChild(s);
  }
  if (choice === 'granted') loadTag();

  /* Refus après acceptation : on retire les cookies de mesure déjà posés */
  function clearTrackingCookies() {
    try {
      var host = location.hostname, parts = host.split('.'), doms = ['', host];
      for (var i = 0; i < parts.length - 1; i++) doms.push('.' + parts.slice(i).join('.'));
      document.cookie.split(';').forEach(function (c) {
        var n = c.split('=')[0].trim();
        if (!/^(_ga|_gid|_gat|_gcl_|_fbp|_fbc)/.test(n)) return;
        doms.forEach(function (d) { document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); });
      });
    } catch (e) {}
  }

  var opener = null;
  function save(v) {
    choice = v;
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: v, ts: Date.now() })); } catch (e) {}
    gtag('consent', 'update', v === 'granted' ? GRANTED : DENIED);
    if (v === 'granted') loadTag(); else clearTrackingCookies();
    try { window.dispatchEvent(new CustomEvent('sd:consent', { detail: v })); } catch (e) {}
    var b = document.getElementById('sd-consent');
    if (b) b.remove();
    if (opener && opener.isConnected) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    opener = null;
  }

  var TXT = {
    fr: { t: 'Cookies', p: 'Nous utilisons des cookies de mesure d’audience (Google Analytics) et publicitaires (Google Ads) pour comprendre comment le site est utilisé et vous montrer nos produits ailleurs sur le web. Rien n’est déposé sans votre accord. Vous pouvez changer d’avis à tout moment via le lien « Cookies » en bas de page.', ok: 'Accepter', no: 'Refuser', more: 'En savoir plus', cur: { granted: 'Choix actuel : cookies acceptés.', denied: 'Choix actuel : cookies refusés.' } },
    en: { t: 'Cookies', p: 'We use analytics (Google Analytics) and advertising (Google Ads) cookies to understand how the site is used and to show you our products elsewhere on the web. Nothing is set without your consent. You can change your mind at any time via the “Cookies” link at the bottom of the page.', ok: 'Accept', no: 'Decline', more: 'Learn more', cur: { granted: 'Current choice: cookies accepted.', denied: 'Current choice: cookies declined.' } },
    sv: { t: 'Cookies', p: 'Vi använder analys- (Google Analytics) och annonscookies (Google Ads) för att förstå hur sajten används och visa våra produkter på andra webbplatser. Inget sparas utan ditt samtycke. Du kan ändra dig när som helst via länken ”Cookies” längst ner på sidan.', ok: 'Acceptera', no: 'Avböj', more: 'Läs mer', cur: { granted: 'Nuvarande val: cookies accepterade.', denied: 'Nuvarande val: cookies avböjda.' } }
  };
  function lang() {
    var l = 'fr';
    try { l = localStorage.getItem('sd_lang') || 'fr'; } catch (e) {}
    return TXT[l] ? l : 'fr';
  }

  /* Styles aux couleurs de la marque (variables de style.css, avec repli) */
  function injectStyle() {
    if (document.getElementById('sd-consent-style')) return;
    var st = document.createElement('style');
    st.id = 'sd-consent-style';
    st.textContent =
      '#sd-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:560px;margin:0 auto;background:var(--warm-white,#FEFCF7);color:var(--midnight,#1B2118);border:1px solid var(--linen,#DDD3BE);border-radius:2px;box-shadow:var(--shadow-lg,0 16px 56px rgba(27,33,24,.16));padding:20px 20px 18px;font-family:var(--font-body,Georgia,serif);font-size:15px;line-height:1.55;}'
      + '#sd-consent .sdc-title{font-family:var(--font-ui,sans-serif);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;}'
      + '#sd-consent .sdc-text{margin:0 0 14px;}'
      + '#sd-consent .sdc-cur{margin:-6px 0 12px;font-size:14px;color:var(--dust,#55614F);}'
      + '#sd-consent a{color:inherit;text-decoration:underline;text-underline-offset:2px;}'
      + '#sd-consent .sdc-actions{display:flex;gap:10px;flex-wrap:wrap;}'
      + '#sd-consent .sdc-btn{flex:1 1 140px;min-height:44px;padding:12px 16px;background:var(--midnight,#1B2118);color:var(--snow,#fff);border:1px solid var(--midnight,#1B2118);border-radius:1px;font-family:var(--font-ui,sans-serif);font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}'
      + '#sd-consent .sdc-btn:hover{background:var(--slate,#3A4636);}'
      + '#sd-consent :focus-visible{outline:2px solid var(--lingon,#4E6651);outline-offset:3px;}'
      + '@media(max-width:480px){#sd-consent{left:8px;right:8px;bottom:8px;padding:16px 16px 14px;font-size:14px;line-height:1.5;}}';
    (document.head || document.documentElement).appendChild(st);
  }

  /* Bannière non bloquante (région), placée en tête du <body> : premier arrêt clavier */
  function render(el, reopened) {
    var T = TXT[lang()];
    el.innerHTML =
      '<h2 class="sdc-title" id="sd-consent-t">' + T.t + '</h2>' +
      '<p class="sdc-text">' + T.p + ' <a href="/confidentialite#cookies">' + T.more + '</a></p>' +
      (reopened && choice ? '<p class="sdc-cur">' + T.cur[choice] + '</p>' : '') +
      '<div class="sdc-actions">' +
        '<button type="button" class="sdc-btn" data-c="denied">' + T.no + '</button>' +
        '<button type="button" class="sdc-btn" data-c="granted">' + T.ok + '</button>' +
      '</div>';
  }
  function showBanner(reopened) {
    var el = document.getElementById('sd-consent');
    if (!el) {
      injectStyle();
      el = document.createElement('section');
      el.id = 'sd-consent';
      el.setAttribute('aria-labelledby', 'sd-consent-t');
      el.addEventListener('click', function (e) {
        var b = e.target && e.target.closest && e.target.closest('[data-c]');
        if (b) save(b.getAttribute('data-c'));
      });
      document.body.insertBefore(el, document.body.firstChild);
    }
    render(el, reopened);
    if (reopened) { var f = el.querySelector('button'); if (f) f.focus(); }
  }

  /* Réouverture (bouton « Cookies » du pied de page, liens des pages légales) */
  window.sdCookieSettings = function () {
    opener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (document.body) showBanner(true);
  };
  /* Changement de langue sur le site : la bannière suit */
  window.addEventListener('sd:lang', function () {
    var el = document.getElementById('sd-consent');
    if (el) render(el, !!choice);
  });

  if (!choice) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { showBanner(false); });
    else showBanner(false);
  }
})();
