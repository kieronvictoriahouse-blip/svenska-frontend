/**
 * Haut de la page d'accueil : image fixe ou carrousel.
 * Réglé dans le back-office (Contenu → Bannière d'accueil), lu sur
 * GET {SD_API_URL}/api/hero → { mode, interval, image, slides }.
 *
 * - « image » : rien à faire, le hero statique (et son image CMS) reste.
 * - « carousel » : les diapositives se superposent dans .hero-media ; la
 *   nouvelle se fond par-dessus l'ancienne. Quatre types : « default »
 *   (le texte de l'accueil reste), « custom » (texte propre, centré),
 *   « split » (bannière promo : texte et deux vrais boutons à gauche sur
 *   un fond de la marque, photo à droite) et « image » (visuel seul,
 *   cliquable en entier).
 *
 * Le dernier état reçu est gardé en localStorage : au retour, le carrousel
 * est posé avant le premier rendu, sans flash de l'image fixe. Les noms de
 * classe des textes de diapositive (.hero-slide-*) ne reprennent pas ceux du
 * hero (.hero-sub, .hero-eyebrow) : d'autres scripts les ciblent par
 * querySelector et tomberaient sinon sur une diapositive.
 */
(function () {
  var hero = document.querySelector('.hero');
  var media = hero && hero.querySelector('.hero-media');
  if (!hero || !media) return;

  var KEY = 'sd_hero_v1';
  var BASE = typeof SD_API_URL !== 'undefined' ? SD_API_URL : '';
  var FADE_MS = 1200;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SUPA_MEDIA = /^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i;
  var THEMES = ['moss', 'ink', 'sand'];
  // Même requête que la mise en page empilée du CSS (index.html) : téléphone et
  // tablette en portrait reçoivent l'image prévue pour la hauteur.
  var STACKED = '(max-width: 767px), (orientation: portrait) and (max-width: 1024px)';

  var L10N = {
    fr: { region: 'À la une', carousel: 'carrousel', slide: 'diapositive', of: '{n} sur {t}', goTo: 'Afficher la diapositive {n}', pause: 'Mettre le défilement en pause', play: 'Relancer le défilement', cta: 'Découvrir' },
    en: { region: 'Featured', carousel: 'carousel', slide: 'slide', of: '{n} of {t}', goTo: 'Show slide {n}', pause: 'Pause the slideshow', play: 'Play the slideshow', cta: 'Discover' },
    sv: { region: 'Aktuellt', carousel: 'karusell', slide: 'bild', of: '{n} av {t}', goTo: 'Visa bild {n}', pause: 'Pausa bildspelet', play: 'Starta bildspelet', cta: 'Upptäck' },
  };

  var cfg = null;        // état affiché
  var slides = [];       // diapositives visibles aujourd'hui
  var els = [];          // { root, img, title, sub, eyebrow, cta, link }
  var dots = [];
  var controls = null, pauseBtn = null, track = null;
  var idx = 0, prevTimer = 0;
  var paused = false;    // pause demandée par le visiteur
  var holds = {};        // pauses temporaires : survol, focus, onglet caché

  function lang() {
    var l = (typeof LANG !== 'undefined' && LANG) || localStorage.getItem('sd_lang') || 'fr';
    return L10N[l] ? l : 'fr';
  }
  function tr(k, n, t) { return L10N[lang()][k].replace('{n}', n).replace('{t}', t); }
  function txt(s, field) { var l = lang(); return s[field + '_' + l] || s[field + '_fr'] || ''; }

  // Même règle que l'aperçu du back-office : seuls <em> et <br> sont interprétés.
  function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rich(v) { return esc(v || '').replace(/&lt;(\/?)em&gt;/gi, '<$1em>').replace(/&lt;br\s*\/?&gt;/gi, '<br>'); }
  function mediaUrl(u) { return typeof u === 'string' ? u.replace(SUPA_MEDIA, '/media/') : u; }
  // Page du site ou http(s) seulement — l'API filtre déjà, on ne s'y fie pas.
  function safeLink(u) {
    u = String(u || '').trim();
    return /^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:\/\//i.test(u) ? '' : u;
  }

  // Une promo « jusqu'au 31 » tient jusqu'à minuit heure de Paris, comme côté serveur.
  function todayParis() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function visible(s, today) {
    return s && s.image_url && (!s.starts_on || today >= String(s.starts_on).slice(0, 10)) && (!s.ends_on || today <= String(s.ends_on).slice(0, 10));
  }
  function seconds() { var n = parseInt(cfg && cfg.interval, 10); return Math.min(20, Math.max(3, n || 5)); }
  function autoplay() { return slides.length > 1 && !reduceMotion; }
  function held() { for (var k in holds) if (holds[k]) return true; return false; }

  /* ── Construction ──────────────────────────────────────────── */

  function teardown() {
    clearTimeout(prevTimer);
    if (track) track.remove();
    if (controls) controls.remove();
    track = controls = pauseBtn = null;
    els = []; dots = []; slides = [];
    hero.classList.remove('hero--carousel', 'hero--own', 'hero--light', 'hero--manual', 'is-paused', 'is-held');
    hero.removeAttribute('aria-roledescription');
    hero.removeAttribute('aria-label');
  }

  function buildSlide(s, i) {
    var link = safeLink(s.link_url), link2 = safeLink(s.link2_url);
    var split = s.kind === 'split';
    var root = document.createElement('div');
    root.className = 'hero-slide hero-slide--' + (s.kind || 'default');
    if (split) root.classList.add('hero-theme--' + (THEMES.indexOf(s.theme) >= 0 ? s.theme : 'moss'));
    root.setAttribute('role', 'group');
    root.setAttribute('aria-roledescription', L10N[lang()].slide);

    var pic = document.createElement('picture');
    if (s.image_mobile_url) {
      var src = document.createElement('source');
      src.media = STACKED;
      src.srcset = mediaUrl(s.image_mobile_url);
      pic.appendChild(src);
    }
    var img = document.createElement('img');
    img.src = mediaUrl(s.image_url);
    img.decoding = 'async';
    img.setAttribute('fetchpriority', i === 0 ? 'high' : 'low');
    pic.appendChild(img);
    root.appendChild(pic);

    var el = { root: root, img: img };
    if (s.kind !== 'image' && !split) {
      var veil = document.createElement('div');
      veil.className = 'hero-overlay';
      root.appendChild(veil);
    }
    // Bannière promo : le fond de la marque se fond dans la photo, à gauche (en bas sur téléphone).
    if (split) {
      var panel = document.createElement('div');
      panel.className = 'hero-split-panel';
      root.appendChild(panel);
    }
    if (s.kind === 'custom' || split) {
      var copy = document.createElement('div');
      copy.className = 'hero-slide-copy';
      var ctas = (link ? '<a class="' + (split ? 'hero-btn-solid' : 'btn-primary') + '" data-cta="1"></a>' : '')
        + (link2 ? '<a class="' + (split ? 'hero-btn-link' : 'btn-secondary') + '" data-cta="2"></a>' : '');
      copy.innerHTML = '<p class="hero-slide-eyebrow"></p><h2 class="hero-slide-title"></h2>'
        + (split ? '<p class="hero-split-tagline"></p><span class="hero-split-rule" aria-hidden="true"></span>' : '')
        + '<p class="hero-slide-sub"></p>'
        + (ctas ? '<div class="hero-ctas">' + ctas + '</div>' : '');
      el.eyebrow = copy.querySelector('.hero-slide-eyebrow');
      el.title = copy.querySelector('.hero-slide-title');
      el.tagline = copy.querySelector('.hero-split-tagline');
      el.sub = copy.querySelector('.hero-slide-sub');
      el.cta = copy.querySelector('[data-cta="1"]');
      el.cta2 = copy.querySelector('[data-cta="2"]');
      if (el.cta) el.cta.href = link;
      if (el.cta2) el.cta2.href = link2;
      root.appendChild(copy);
    }
    if (s.kind === 'image' && link) {
      var a = document.createElement('a');
      a.className = 'hero-slide-link';
      a.href = link;
      root.appendChild(a);
      el.link = a;
    }
    return el;
  }

  function fillTexts() {
    var l = L10N[lang()];
    slides.forEach(function (s, i) {
      var el = els[i];
      el.root.setAttribute('aria-roledescription', l.slide);
      el.root.setAttribute('aria-label', tr('of', i + 1, slides.length));
      el.img.alt = txt(s, 'alt');
      if (el.title) {
        var eb = txt(s, 'eyebrow'), sub = txt(s, 'subtitle');
        el.eyebrow.textContent = eb; el.eyebrow.hidden = !eb;
        el.title.innerHTML = rich(txt(s, 'title'));
        el.sub.textContent = sub; el.sub.hidden = !sub;
        if (el.tagline) { var tg = txt(s, 'tagline'); el.tagline.textContent = tg; el.tagline.hidden = !tg; }
        if (el.cta) el.cta.textContent = txt(s, 'cta_label') || l.cta;
        // Second bouton : sans texte, on ne l'affiche pas (pas de libellé inventé).
        if (el.cta2) { var c2 = txt(s, 'cta2_label'); el.cta2.textContent = c2; el.cta2.hidden = !c2; }
      }
      if (el.link) el.link.setAttribute('aria-label', txt(s, 'alt') || l.cta);
    });
    dots.forEach(function (d, i) { d.setAttribute('aria-label', tr('goTo', i + 1, slides.length)); });
    if (pauseBtn) pauseBtn.setAttribute('aria-label', paused ? l.play : l.pause);
    if (slides.length > 1) {
      hero.setAttribute('aria-roledescription', l.carousel);
      hero.setAttribute('aria-label', l.region);
    }
  }

  function buildControls() {
    controls = document.createElement('div');
    controls.className = 'hero-controls';
    var group = document.createElement('div');
    group.className = 'hero-dots';
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero-dot';
      b.innerHTML = '<span class="hero-dot-bar"><span class="hero-dot-fill"></span></span>';
      b.addEventListener('click', function () { go(i); });
      group.appendChild(b);
      dots.push(b);
    });
    // Flèches gauche/droite quand le focus est sur les traits.
    group.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      go(idx + (e.key === 'ArrowRight' ? 1 : -1));
      dots[idx].focus();
    });
    controls.appendChild(group);

    if (autoplay()) {
      pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'hero-pause';
      pauseBtn.innerHTML = '<svg class="i-pause" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="1.5" width="2" height="9"/><rect x="7.5" y="1.5" width="2" height="9"/></svg>'
        + '<svg class="i-play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z"/></svg>';
      pauseBtn.addEventListener('click', function () { setPaused(!paused); });
      controls.appendChild(pauseBtn);
    }
    // Survoler les commandes ou le texte suspend le défilement ; le reste
    // du hero non, sinon une souris posée sur la page l'arrêterait pour de bon.
    controls.addEventListener('mouseenter', function () { hold('hover', true); });
    controls.addEventListener('mouseleave', function () { hold('hover', false); });
    hero.appendChild(controls);
    placeControls();
  }

  // Le hero fait un écran de haut SOUS l'en-tête : son bas sort de l'écran.
  // Les commandes remontent d'autant pour rester visibles à l'arrivée.
  function placeControls() {
    if (!controls) return;
    var fold = hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    hero.style.setProperty('--hero-fold', Math.min(Math.max(0, fold), hero.offsetHeight / 2) + 'px');
  }
  window.addEventListener('resize', placeControls);
  window.addEventListener('load', placeControls);
  var headerRoot = document.getElementById('header-root');
  if (headerRoot && window.ResizeObserver) new ResizeObserver(placeControls).observe(headerRoot);

  function render(next) {
    var today = todayParis();
    var list = (next && next.mode === 'carousel' && Array.isArray(next.slides) ? next.slides : []).filter(function (s) { return visible(s, today); });
    var keep = cfg && slides.length ? slides[idx] && slides[idx].id : null;
    teardown();
    cfg = next;
    if (!list.length) return;           // rien de visible : l'image fixe reste

    slides = list;
    track = document.createElement('div');
    track.className = 'hero-slides';
    els = slides.map(buildSlide);
    els.forEach(function (el) { track.appendChild(el.root); });
    media.appendChild(track);

    hero.classList.add('hero--carousel');
    hero.style.setProperty('--hero-interval', seconds() + 's');
    hero.style.setProperty('--hero-zoom', (seconds() * 1000 + FADE_MS) + 'ms');
    if (slides.length > 1) {
      if (!autoplay()) hero.classList.add('hero--manual');
      buildControls();
    }
    fillTexts();

    var start = 0;
    if (keep) slides.forEach(function (s, i) { if (s.id === keep) start = i; });
    idx = -1;
    go(start, true);
    sync();
  }

  /* ── Défilement ───────────────────────────────────────────── */

  function go(n, instant) {
    if (!slides.length) return;
    n = (n + slides.length) % slides.length;
    var prev = idx;
    if (n === prev) return;
    idx = n;

    els.forEach(function (el, i) {
      var on = i === n;
      el.root.classList.toggle('is-active', on);
      el.root.classList.toggle('is-prev', i === prev && !instant);
      el.root.setAttribute('aria-hidden', on ? 'false' : 'true');
      el.root.inert = !on;
    });
    if (instant) els[n].root.classList.add('is-instant');
    clearTimeout(prevTimer);
    prevTimer = setTimeout(function () {
      els.forEach(function (el) { el.root.classList.remove('is-prev', 'is-instant'); });
    }, FADE_MS);

    hero.classList.toggle('hero--own', slides[n].kind !== 'default');
    // Fond sable : les traits de progression passent en foncé pour rester lisibles.
    hero.classList.toggle('hero--light', slides[n].kind === 'split' && slides[n].theme === 'sand');
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === n);
      if (i === n) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      var fill = d.querySelector('.hero-dot-fill');
      if (i === n && fill) {
        // Relance l'animation de progression ; sa fin fait avancer le carrousel.
        var clone = fill.cloneNode();
        fill.replaceWith(clone);
        clone.addEventListener('animationend', function () { if (idx === n && autoplay()) advance(); });
      }
    });
  }

  // Sur une connexion lente, on n'affiche pas la suivante avant son image :
  // seul le voile se fondrait par-dessus la diapositive en cours.
  function advance() {
    var from = idx, next = (idx + 1) % slides.length, img = els[next].img;
    if (img.complete) { go(next); return; }
    var done = function () {
      img.removeEventListener('load', done); img.removeEventListener('error', done);
      if (idx === from) go(next);
    };
    img.addEventListener('load', done); img.addEventListener('error', done);
  }

  function sync() {
    hero.classList.toggle('is-paused', paused);
    hero.classList.toggle('is-held', held());
    // Annonce les changements seulement quand rien ne défile tout seul.
    if (track) track.setAttribute('aria-live', autoplay() && !paused ? 'off' : 'polite');
    if (pauseBtn) pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    fillTexts();
  }
  function setPaused(v) { paused = v; sync(); }
  function hold(reason, v) { holds[reason] = v; sync(); }

  // Seul le focus clavier suspend : un clic sur un trait donne aussi le focus
  // (Chrome) et figerait le carrousel jusqu'au clic suivant ailleurs.
  hero.addEventListener('focusin', function (e) {
    var kb = true;
    try { kb = e.target.matches(':focus-visible'); } catch (err) {}
    if (slides.length > 1 && kb) hold('focus', true);
  });
  hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) hold('focus', false); });
  media.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest('.hero-slide-copy')) hold('hover', true); });
  media.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.hero-slide-copy') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.hero-slide-copy'))) hold('hover', false); });
  var defaultCopy = hero.querySelector('.hero-content');
  if (defaultCopy) {
    defaultCopy.addEventListener('mouseenter', function () { if (slides.length > 1) hold('hover', true); });
    defaultCopy.addEventListener('mouseleave', function () { hold('hover', false); });
  }
  document.addEventListener('visibilitychange', function () { hold('hidden', document.hidden); });

  // Balayage horizontal au doigt.
  var tx = null, ty = null;
  hero.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (tx === null || slides.length < 2) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ── Données ──────────────────────────────────────────────── */

  var cachedRaw = null;
  try { cachedRaw = localStorage.getItem(KEY); if (cachedRaw) render(JSON.parse(cachedRaw)); } catch (e) { cachedRaw = null; }

  fetch(BASE + '/api/hero')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.mode) return;      // route absente ou en erreur : on garde ce qui est affiché
      var next = { mode: d.mode, interval: d.interval, slides: d.slides || [] };
      var raw = JSON.stringify(next);
      if (raw === cachedRaw) return;
      try { localStorage.setItem(KEY, raw); } catch (e) {}
      render(next);
    })
    .catch(function () {});

  window.SDHero = { setLang: function () { if (slides.length) fillTexts(); } };
})();
