/**
 * Mesure d'audience & publicité — SOURCE UNIQUE (chargé dans le <head> de chaque page,
 * AVANT app.js, en script bloquant : il doit définir gtag() avant tout événement).
 *
 * - Consent Mode v2 : tout est refusé par défaut. Rien n'est déposé (cookies GA/Ads)
 *   tant que le visiteur n'a pas cliqué « Accepter ». Obligatoire en France (CNIL)
 *   et exigé par Google pour mesurer/recibler les visiteurs de l'EEE dans Google Ads.
 * - GA4 + Google Ads sont configurés ici et nulle part ailleurs.
 * - Bannière : « Accepter » et « Refuser » au même niveau (exigence CNIL), choix
 *   mémorisé 6 mois, réouvrable via sdCookieSettings() (lien « Cookies » du pied de page).
 *
 * Pour brancher Google Ads : renseigner ADS_ID (AW-…) et PURCHASE_LABEL (Google Ads →
 * Objectifs → Conversions → balise → « send_to: AW-XXX/LABEL »), bumper ?v= partout.
 */
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

  gtag('consent', 'default', Object.assign({}, choice === 'granted' ? GRANTED : DENIED, { wait_for_update: 500 }));
  // Sans consentement : pas de cookie, identifiants publicitaires masqués, gclid propagé dans l'URL.
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  gtag('js', new Date());
  gtag('config', GA4_ID);
  if (ADS_ID) gtag('config', ADS_ID, { allow_enhanced_conversions: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  document.head.appendChild(s);

  window.SD_ADS = { id: ADS_ID, purchaseLabel: PURCHASE_LABEL };

  function save(v) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: v, ts: Date.now() })); } catch (e) {}
    gtag('consent', 'update', v === 'granted' ? GRANTED : DENIED);
    var b = document.getElementById('sd-consent');
    if (b) b.remove();
  }

  var TXT = {
    fr: { t: 'Cookies', p: 'Nous utilisons des cookies de mesure d’audience (Google Analytics) et publicitaires (Google Ads) pour comprendre comment le site est utilisé et vous montrer nos produits ailleurs sur le web. Vous pouvez changer d’avis à tout moment via le lien « Cookies » en bas de page.', ok: 'Accepter', no: 'Refuser', more: 'En savoir plus' },
    en: { t: 'Cookies', p: 'We use analytics (Google Analytics) and advertising (Google Ads) cookies to understand how the site is used and to show you our products elsewhere on the web. You can change your mind at any time via the “Cookies” link at the bottom of the page.', ok: 'Accept', no: 'Decline', more: 'Learn more' },
    sv: { t: 'Cookies', p: 'Vi använder analys- (Google Analytics) och annonscookies (Google Ads) för att förstå hur sajten används och visa våra produkter på andra webbplatser. Du kan ändra dig när som helst via länken ”Cookies” längst ner på sidan.', ok: 'Acceptera', no: 'Avböj', more: 'Läs mer' }
  };

  function showBanner() {
    if (document.getElementById('sd-consent')) return;
    var lang = 'fr';
    try { lang = localStorage.getItem('sd_lang') || 'fr'; } catch (e) {}
    var T = TXT[lang] || TXT.fr;
    var el = document.createElement('div');
    el.id = 'sd-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', T.t);
    el.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:560px;margin:0 auto;background:#fff;color:#1f2a24;border:1px solid rgba(0,0,0,.12);border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:18px 18px 16px;font:14px/1.5 var(--font-body,system-ui,sans-serif);';
    var btn = 'flex:1;min-width:120px;padding:11px 14px;border-radius:3px;font:600 13px var(--font-ui,system-ui,sans-serif);letter-spacing:.3px;cursor:pointer;';
    el.innerHTML =
      '<div style="font-weight:700;margin-bottom:6px;">' + T.t + '</div>' +
      '<p style="margin:0 0 12px;">' + T.p + ' <a href="/mentions-legales#cookies" style="color:inherit;text-decoration:underline;">' + T.more + '</a></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" data-c="denied" style="' + btn + 'background:#fff;color:#1f2a24;border:1px solid #1f2a24;">' + T.no + '</button>' +
        '<button type="button" data-c="granted" style="' + btn + 'background:#1f2a24;color:#fff;border:1px solid #1f2a24;">' + T.ok + '</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-c');
      if (v) save(v);
    });
    document.body.appendChild(el);
  }

  window.sdCookieSettings = showBanner;

  if (!choice) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
    else showBanner();
  }
})();
