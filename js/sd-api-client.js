/**
 * Heather & Lingon — API Client Bridge v2
 * Connecte le front Netlify/Vercel au back-end Vercel
 */
(function () {
  if (window._sdApiInitialized) return;
  window._sdApiInitialized = true;

  const BASE = window.SD_API_URL || 'https://svenska-backend.vercel.app';

  // sessionStorage cache — produits + CMS + white-label, évite tout flash entre pages
  const CACHE_KEY = 'sd_full_v1';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function tryCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, products, cms, wl } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return { products, cms: cms || null, wl: wl || null };
    } catch { return null; }
  }

  function setCache(products, cms, wl) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), products, cms: cms || null, wl: wl || null })); } catch { }
  }

  function productFingerprint(arr) {
    return (arr || []).map(p => p.uuid || p.id).sort().join(',');
  }

  const CAT_EMOJI = {
    'Épices': '🌶️', 'Flocons & Céréales': '🌾', 'Baies séchées': '🫐',
    'Sucres & Sirops': '🍯', 'Thés & Tisanes': '🫖', 'Farines & Graines': '🌻',
    'Mélanges': '🎄', 'Chips & Snacks': '🍟', 'Basics suédois': '🇸🇪',
    'Confiseries': '🍬', 'Fika & Boulangerie': '🧁'
  };

  // Noms DB → clé attendue par le front (au cas où la DB utilise des noms légèrement différents)
  const CAT_NORMALIZE = {
    'epices': 'Épices', 'épices': 'Épices', 'epices & aromates': 'Épices', 'épices & aromates': 'Épices',
    'chips & snacks': 'Chips & Snacks', 'snacks-chips': 'Chips & Snacks', 'snacks & chips': 'Chips & Snacks',
    'confiseries': 'Confiseries', 'konfektyr': 'Confiseries',
    'basics suédois': 'Basics suédois', 'svenska baser': 'Basics suédois',
    'fika & boulangerie': 'Fika & Boulangerie', 'fika & bakning': 'Fika & Boulangerie',
    'mélanges': 'Mélanges', 'mélanges suédois': 'Mélanges', 'blandningar': 'Mélanges',
    'thés & tisanes': 'Thés & Tisanes', 'tés & tisanes': 'Thés & Tisanes',
    'baies séchées': 'Baies séchées',
    'flocons & céréales': 'Flocons & Céréales',
    'farines & graines': 'Farines & Graines',
    'sucres & sirops': 'Sucres & Sirops',
  };

  function normalizeCat(raw) {
    if (!raw) return '';
    return CAT_NORMALIZE[raw.toLowerCase()] || raw;
  }

  function guessCatFromName(nameFr) {
    const n = (nameFr || '').toLowerCase();
    if (n.includes('chips') || n.includes('olw') || n.includes('snack')) return 'Chips & Snacks';
    if (n.includes('daim') || n.includes('bilar') || n.includes('fish') || n.includes('lakrits') || n.includes('skipper')) return 'Confiseries';
    if (n.includes('kanelbulle') || n.includes('semla') || n.includes('chokladboll') || n.includes('vaniljsocker') || n.includes('kardemummabulle')) return 'Fika & Boulangerie';
    if (n.includes('kanel') || n.includes('kardemumma') || n.includes('glögg') || n.includes('dill') || n.includes('peppar') || n.includes('santa maria') || n.includes('allkrydda') || n.includes('kebab') || n.includes('anis')) return 'Épices';
    if (n.includes('lingon') || n.includes('fläder') || n.includes('nypon') || n.includes('sureau')) return 'Baies séchées';
    if (n.includes('te ') || n.includes('tisane') || n.includes('skogste') || n.includes('örtte')) return 'Thés & Tisanes';
    if (n.includes('pärlsocker') || n.includes('sirap') || n.includes('farin')) return 'Sucres & Sirops';
    if (n.includes('havregryn') || n.includes('müsli') || n.includes('musli') || n.includes('flingor')) return 'Flocons & Céréales';
    if (n.includes('mjöl') || n.includes('vallmo') || n.includes('lin') || n.includes('pumpa')) return 'Farines & Graines';
    if (n.includes('lussekatt') || n.includes('midsommar') || n.includes('blandning')) return 'Mélanges';
    if (n.includes('wasa') || n.includes('kaviar') || n.includes('kavring') || n.includes('lingonsylt')) return 'Basics suédois';
    return '';
  }

  function mapProduct(p) {
    // Catégorie : DB join → normalisation → devinette par nom
    const rawCat =
      p.categories?.name_fr ||
      p.category?.name_fr ||
      p.cat_name || p.cat || '';
    const cat = normalizeCat(rawCat) || guessCatFromName(p.name_fr) || 'Épices';

    // Variants : normalise le format DB → {label, price}
    const variants = (p.product_variants || p.variants || [])
      .filter(v => v && v.price != null)
      .map(v => ({ label: v.label || p.weight || '', price: parseFloat(v.price) }));

    return {
      id:          p.sort_order || p.id,
      uuid:        p.id,
      cat,
      emoji:       CAT_EMOJI[cat] || '🛒',
      badge:       p.badge || '',
      rating:      parseFloat(p.rating) || 4.5,
      reviews:     p.reviews_count || 0,
      photo:       p.image_url || p.photo || '',
      name:        p.name_sv ? { sv: p.name_sv, fr: p.name_fr, en: p.name_en } : (p.name || { sv: '', fr: '', en: '' }),
      subtitle:    p.subtitle_sv ? { sv: p.subtitle_sv, fr: p.subtitle_fr, en: p.subtitle_en } : (p.subtitle || { sv: '', fr: '', en: '' }),
      origin:      p.origin_sv ? { sv: p.origin_sv, fr: p.origin_fr, en: p.origin_en } : (p.origin || { sv: '', fr: '', en: '' }),
      desc:        p.desc_sv ? { sv: p.desc_sv, fr: p.desc_fr, en: p.desc_en } : (p.desc || { sv: '', fr: '', en: '' }),
      usage:       p.usage_sv ? { sv: p.usage_sv, fr: p.usage_fr, en: p.usage_en } : (p.usage || { sv: '', fr: '', en: '' }),
      ingredients: p.ingredients_sv ? { sv: p.ingredients_sv, fr: p.ingredients_fr, en: p.ingredients_en } : (p.ingredients || { sv: '', fr: '', en: '' }),
      storage:     p.storage_sv ? { sv: p.storage_sv, fr: p.storage_fr, en: p.storage_en } : (p.storage || { sv: '', fr: '', en: '' }),
      price:       parseFloat(p.price) || 0,
      weight:      p.weight || '',
      tags:        Array.isArray(p.tags) ? p.tags : [],
      variants,
      bestseller:  !!(p.is_bestseller ?? p.bestseller),
      isNew:       !!(p.is_new ?? p.isNew),
    };
  }

  const SDApi = {
    async getProducts(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE}/api/products${qs ? '?' + qs : ''}`);
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.products || data.data || []);
    },
    async getProduct(id) {
      const res = await fetch(`${BASE}/api/products/${id}`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },
    async getCategories() {
      const res = await fetch(`${BASE}/api/categories`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },
    async getHomepage() {
      const res = await fetch(`${BASE}/api/homepage`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },
    async getCms() {
      const res = await fetch(`${BASE}/api/cms`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },
    async getWhiteLabel() {
      const res = await fetch(`${BASE}/api/white-label`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },
    async login(email, password) {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
  };

  window.SDApi = SDApi;
  window.SDApi.isReady = false;
  window.SDApi.BASE = BASE;

  function applyWhiteLabel(cfg) {
    if (!cfg || !cfg.id) return; // config vide = pas de white-label configuré
    try { localStorage.setItem('sd_wl_v1', JSON.stringify(cfg)); } catch {}
    const root = document.documentElement;

    // Couleurs → variables CSS
    if (cfg.color_primary) {
      root.style.setProperty('--heather', cfg.color_primary);
      // Variantes dérivées (légèrement plus claires)
      root.style.setProperty('--heather-mid', cfg.color_primary + 'CC');
    }
    if (cfg.color_secondary) {
      root.style.setProperty('--lingon', cfg.color_secondary);
      root.style.setProperty('--lingon-mid', cfg.color_secondary + 'CC');
    }
    if (cfg.color_bg)   root.style.setProperty('--cream', cfg.color_bg);
    if (cfg.color_text) root.style.setProperty('--midnight', cfg.color_text);

    // Polices → injection d'un <style>
    if (cfg.font_display || cfg.font_body || cfg.font_ui) {
      const fonts = [cfg.font_display, cfg.font_body, cfg.font_ui].filter(Boolean);
      const googleUrl = 'https://fonts.googleapis.com/css2?family=' +
        fonts.map(f => f.replace(/ /g, '+') + ':wght@300;400;600').join('&family=') + '&display=swap';
      if (!document.querySelector(`link[href="${googleUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = googleUrl;
        document.head.appendChild(link);
      }
      if (cfg.font_display) root.style.setProperty('--font-display', `'${cfg.font_display}', Georgia, serif`);
      if (cfg.font_body)    root.style.setProperty('--font-body', `'${cfg.font_body}', Georgia, serif`);
      if (cfg.font_ui)      root.style.setProperty('--font-ui', `'${cfg.font_ui}', sans-serif`);
    }

    // Mise à jour SD_WL + re-rendu header/footer
    if (typeof window.SD_WL !== 'undefined') {
      var _n = cfg.site_name || window.SD_WL.brand_name;
      window.SD_WL = {
        brand_name: _n,
        brand_tagline: cfg.site_slogan || window.SD_WL.brand_tagline,
        contact_email: cfg.email || window.SD_WL.contact_email,
        instagram: cfg.instagram !== undefined ? cfg.instagram : window.SD_WL.instagram,
        facebook: cfg.facebook !== undefined ? cfg.facebook : window.SD_WL.facebook,
        pinterest: cfg.pinterest !== undefined ? cfg.pinterest : window.SD_WL.pinterest,
        free_shipping_threshold: cfg.free_shipping_threshold || window.SD_WL.free_shipping_threshold,
        announcement: {
          sv: cfg.announcement_sv || window.SD_WL.announcement.sv,
          fr: cfg.announcement_fr || window.SD_WL.announcement.fr,
          en: cfg.announcement_en || window.SD_WL.announcement.en,
        },
        footer_desc: {
          sv: cfg.footer_desc_sv || window.SD_WL.footer_desc.sv,
          fr: cfg.footer_desc_fr || window.SD_WL.footer_desc.fr,
          en: cfg.footer_desc_en || window.SD_WL.footer_desc.en,
        },
        footer_tagline: {
          sv: cfg.footer_tagline_sv || window.SD_WL.footer_tagline.sv,
          fr: cfg.footer_tagline_fr || window.SD_WL.footer_tagline.fr,
          en: cfg.footer_tagline_en || window.SD_WL.footer_tagline.en,
        },
        copyright: {
          sv: '© 2026 ' + _n + ' · Alla rättigheter förbehållna',
          fr: '© 2026 ' + _n + ' · Tous droits réservés',
          en: '© 2026 ' + _n + ' · All rights reserved',
        },
      };
      if (typeof renderHeader === 'function') {
        var _hr = document.getElementById('header-root');
        if (_hr) _hr.innerHTML = renderHeader(window._activePage || '');
        var _fr = document.getElementById('footer-root');
        if (_fr) _fr.innerHTML = renderFooter();
        if (typeof setLang === 'function') setLang(window.LANG || localStorage.getItem('sd_lang') || 'fr');
      }
    }

    if (cfg.email) window._contactEmail = cfg.email;
    window.SDApi.whiteLabel = cfg;
    console.log('[SDApi] White-label appliqué :', cfg.site_name || '—');
  }

  async function initFromApi() {
    // Cache hit : appliquer CMS + WL + produits AVANT sdapi:ready → zéro flash
    const cached = tryCache();
    if (cached) {
      if (cached.cms)  { window.SDApi.cms = cached.cms; applyCms(cached.cms); }
      if (cached.wl)   { applyWhiteLabel(cached.wl); }
      if (cached.products) {
        window.PRODUCTS = cached.products;
        window.SDApi.isReady = true;
        window.SDApi.products = cached.products;
      }
      window.dispatchEvent(new CustomEvent('sdapi:ready', { detail: { products: cached.products, fromCache: true } }));
    }

    try {
      const [productsData, cmsData, wlData] = await Promise.all([
        SDApi.getProducts().catch(() => null),
        SDApi.getCms().catch(() => null),
        SDApi.getWhiteLabel().catch(() => null),
      ]);

      // Construire CMS et WL
      const cms = cmsData?.cms ? Object.fromEntries(cmsData.cms.map(i => [i.key, i])) : null;
      const wl  = wlData?.config || null;

      // Appliquer CMS + WL seulement si le contenu a changé (évite le flash de re-application)
      const cmsChanged = JSON.stringify(cached?.cms) !== JSON.stringify(cms);
      const wlChanged  = JSON.stringify(cached?.wl)  !== JSON.stringify(wl);
      if (cms && cmsChanged) { window.SDApi.cms = cms; applyCms(cms); }
      else if (cms) { window.SDApi.cms = cms; }
      if (wl  && wlChanged)  { applyWhiteLabel(wl); }
      else if (wl) { window.SDApi.whiteLabel = wl; }

      // Produits
      const mapped = (productsData && productsData.length > 0) ? productsData.map(mapProduct) : null;
      if (mapped) {
        window.PRODUCTS = mapped;
        window.SDApi.isReady = true;
        window.SDApi.products = mapped;

        // Re-déclencher uniquement si produits OU config ont changé
        const productsChanged = !cached || productFingerprint(cached.products) !== productFingerprint(mapped);
        setCache(mapped, cms, wl);
        if (productsChanged || cmsChanged || wlChanged) {
          window.dispatchEvent(new CustomEvent('sdapi:ready', { detail: { products: mapped } }));
        }
      } else {
        setCache(cached?.products || [], cms, wl);
        if (!cached) {
          window.dispatchEvent(new CustomEvent('sdapi:ready', { detail: { fallback: true } }));
        }
      }

    } catch (e) {
      console.warn('[SDApi] Fallback sur données locales :', e.message);
      if (!cached) {
        window.dispatchEvent(new CustomEvent('sdapi:ready', { detail: { fallback: true } }));
      }
    }
  }

  function applyCms(cms) {
    try { localStorage.setItem('sd_cms_v1', JSON.stringify(cms)); } catch {}
    try {
      const LANG = localStorage.getItem('sd_lang') || 'fr';
      const l = LANG === 'sv' ? 'value_sv' : LANG === 'en' ? 'value_en' : 'value_fr';
      if (cms.hero_title) {
        const h1 = document.querySelector('.hero h1');
        if (h1) {
          if (cms.hero_title[l]) h1.innerHTML = cms.hero_title[l];
          // Update data attrs so setLang works for future language switches
          if (cms.hero_title.value_sv) h1.setAttribute('data-sv', cms.hero_title.value_sv);
          if (cms.hero_title.value_fr) h1.setAttribute('data-fr', cms.hero_title.value_fr);
          if (cms.hero_title.value_en) h1.setAttribute('data-en', cms.hero_title.value_en);
        }
      }
      if (cms.hero_subtitle) {
        const sub = document.querySelector('.hero-sub');
        if (sub) {
          if (cms.hero_subtitle[l]) sub.textContent = cms.hero_subtitle[l];
          if (cms.hero_subtitle.value_sv) sub.setAttribute('data-sv', cms.hero_subtitle.value_sv);
          if (cms.hero_subtitle.value_fr) sub.setAttribute('data-fr', cms.hero_subtitle.value_fr);
          if (cms.hero_subtitle.value_en) sub.setAttribute('data-en', cms.hero_subtitle.value_en);
        }
      }
      if (cms.hero_photo) {
        const img = document.querySelector('.hero-right img');
        if (img && cms.hero_photo[l]) img.src = cms.hero_photo[l];
      }
      if (cms.feat_photo) {
        const img = document.querySelector('.feat-band-visual img');
        if (img && cms.feat_photo[l]) img.src = cms.feat_photo[l];
      }
      if (cms.feat_title) {
        const el = document.querySelector('.feat-band-text .sect-title');
        if (el && cms.feat_title[l]) el.innerHTML = cms.feat_title[l];
      }
      if (cms.feat_subtitle) {
        const el = document.querySelector('.feat-band-text .sect-body');
        if (el && cms.feat_subtitle[l]) el.textContent = cms.feat_subtitle[l];
      }
    } catch (e) { /* CMS apply silently fails */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromApi);
  } else {
    initFromApi();
  }
})();
