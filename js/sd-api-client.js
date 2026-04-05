/**
 * Svenska Delikatessen — API Client Bridge
 * Connecte le front Netlify au back-end Vercel
 */

(function () {
  const BASE = window.SD_API_URL || 'https://svenska-backend.vercel.app';

  const SDApi = {
    // --- Produits ---
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

    async getProductsByCategory(slug) {
      return this.getProducts({ cat: slug });
    },

    async getBestsellers() {
      return this.getProducts({ bestseller: 'true' });
    },

    async getNewProducts() {
      return this.getProducts({ new: 'true' });
    },

    async searchProducts(query) {
      return this.getProducts({ search: query });
    },

    // --- Catégories ---
    async getCategories() {
      const res = await fetch(`${BASE}/api/categories`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },

    // --- Homepage ---
    async getHomepage() {
      const res = await fetch(`${BASE}/api/homepage`);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    },

    // --- Auth admin ---
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
  window.SDApi.products = null;

  // Emojis par catégorie
  const CAT_EMOJI = {
    'Épices': '🌶️', 'Flocons & Céréales': '🌾', 'Baies séchées': '🫐',
    'Sucres & Sirops': '🍯', 'Thés & Tisanes': '🫖', 'Farines & Graines': '🌻',
    'Mélanges': '🎄', 'Chips & Snacks': '🍟', 'Basics suédois': '🇸🇪',
    'Confiseries': '🍬', 'Fika & Boulangerie': '🧁'
  };

  // Mapper les champs Supabase → format attendu par app.js
  function mapProduct(p) {
    // Récupérer la catégorie — Supabase stocke dans categories_name ou on la déduit
    const cat = p.category?.name_fr || p.categories?.name_fr || p.cat_name || p.cat || p._cat || '';
    // Fallback : deviner la catégorie depuis les tags ou le nom si cat est vide
    const resolvedCat = cat || (() => {
      const n = (p.name_fr || p.name_sv || '').toLowerCase();
      if (n.includes('chips') || n.includes('olw') || n.includes('snack')) return 'Chips & Snacks';
      if (n.includes('daim') || n.includes('bilar') || n.includes('fish') || n.includes('lakrits') || n.includes('skipper')) return 'Confiseries';
      if (n.includes('kanelbulle') || n.includes('semla') || n.includes('chokladboll') || n.includes('fika') || n.includes('vaniljsocker')) return 'Fika & Boulangerie';
      if (n.includes('kanel') || n.includes('kardemumma') || n.includes('glögg') || n.includes('dill') || n.includes('peppar') || n.includes('santa maria') || n.includes('allkrydda') || n.includes('kebab')) return 'Épices';
      if (n.includes('lingon') || n.includes('fläder') || n.includes('nypon')) return 'Baies séchées';
      if (n.includes('te') || n.includes('tisane') || n.includes('skogste')) return 'Thés & Tisanes';
      if (n.includes('pärlsocker') || n.includes('sirap')) return 'Sucres & Sirops';
      if (n.includes('havregryn') || n.includes('müsli')) return 'Flocons & Céréales';
      if (n.includes('mjöl') || n.includes('vallmo')) return 'Farines & Graines';
      if (n.includes('lussekatt') || n.includes('midsommar')) return 'Mélanges';
      if (n.includes('wasa') || n.includes('kaviar') || n.includes('kavring') || n.includes('lingonsylt')) return 'Basics suédois';
      return '';
    })();
    return {
      id:         p.id,
      cat:        resolvedCat,
      emoji:      CAT_EMOJI[resolvedCat] || '🛒',
      badge:      p.badge || '',
      rating:     p.rating || 4.5,
      reviews:    p.reviews_count || 0,
      photo:      p.image_url || p.photo || '',
      name:       p.name_sv ? { sv: p.name_sv, fr: p.name_fr, en: p.name_en } : p.name,
      subtitle:   p.subtitle_sv ? { sv: p.subtitle_sv, fr: p.subtitle_fr, en: p.subtitle_en } : p.subtitle,
      origin:     p.origin_sv ? { sv: p.origin_sv, fr: p.origin_fr, en: p.origin_en } : p.origin,
      desc:       p.desc_sv ? { sv: p.desc_sv, fr: p.desc_fr, en: p.desc_en } : p.desc,
      usage:      p.usage_sv ? { sv: p.usage_sv, fr: p.usage_fr, en: p.usage_en } : p.usage,
      ingredients: p.ingredients_sv ? { sv: p.ingredients_sv, fr: p.ingredients_fr, en: p.ingredients_en } : p.ingredients,
      storage:    p.storage_sv ? { sv: p.storage_sv, fr: p.storage_fr, en: p.storage_en } : p.storage,
      price:      p.price,
      weight:     p.weight,
      tags:       p.tags || [],
      variants:   p.product_variants || p.variants || [],
      bestseller: p.is_bestseller ?? p.bestseller ?? false,
      isNew:      p.is_new ?? p.isNew ?? false,
    };
  }

  // Auto-init
  async function initFromApi() {
    try {
      const data = await SDApi.getProducts();
      if (data && data.length > 0) {
        window.PRODUCTS = data.map(mapProduct);
        window.SDApi.isReady = true;
        window.SDApi.products = window.PRODUCTS;
        console.log('[SDApi] Produits chargés depuis Supabase :', window.PRODUCTS.length);
        // Re-render selon la page
        if (typeof window.render === 'function') window.render();        // boutique
        if (typeof window.renderHome === 'function') window.renderHome(); // home
        if (typeof window.renderProducts === 'function') window.renderProducts();
        if (typeof window.initApp === 'function') window.initApp();
        window.dispatchEvent(new Event('sdapi:ready'));
      }
    } catch (e) {
      console.warn('[SDApi] Fallback sur données locales :', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromApi);
  } else {
    initFromApi();
  }
})();
