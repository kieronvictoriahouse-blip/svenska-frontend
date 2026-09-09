/**
 * Build-time product prerenderer (SEO + GEO).
 * Pour chaque produit actif, génère une page statique /produit/<slug>.html
 * (servie en /produit/<slug> grâce à cleanUrls).
 *
 * Principe : TOUT ce qui compte doit être dans le HTML servi, car les
 * crawlers des moteurs IA (ChatGPT Search, Perplexity, Claude) n'exécutent
 * PAS le JavaScript — avant cette version, une fiche ne leur montrait que
 * 296 caractères de chrome d'interface. Le JS du site ré-hydrate ensuite
 * par-dessus les mêmes conteneurs : aucun changement visuel.
 *
 * Dans le HTML statique :
 *   - <title> ≤ 60 car., meta description coupée au mot, canonical, OG complet
 *   - corps ENTIER : nom, catégorie, sous-titre, prix, poids, description
 *     complète, image avec alt, fil d'Ariane rempli, 4 produits similaires
 *     en liens réels (maillage interne)
 *   - JSON-LD Product enrichi (vraie marque, description complète, poids,
 *     catégorie) + JSON-LD BreadcrumbList
 *   - window.__PRODUCT_ID pour l'hydratation JS existante
 * Régénère aussi sitemap.xml (lastmod réel = updated_at du produit).
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SD_API_URL || 'https://admin.swedishcravings.fr';
const SITE = 'https://www.swedishcravings.fr';

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

// DOIT rester identique à _sdProductSlug() dans produit.html
function slugify(nameFr, id) {
  const base = (nameFr || 'produit').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base + '-' + String(id || '').slice(0, 8);
}

const escAttr = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Identique à generate-shopping-feed.js — la marque réelle, pas un fourre-tout.
const BRANDS = ['Marimekko', 'IHR', 'Ihr', 'OLW', 'Ahlgrens', 'Läkerol', 'Lakerol', 'Kavli', 'Fazer',
  'Odense', 'Törsleff', 'Torsleff', "Dave & Jon's", 'Santa Maria', 'Polly', 'Ballerina', 'Wasa',
  'Piffi', 'Marabou', 'P Design'];
function brandOf(nameFr) {
  const n = (nameFr || '');
  for (const b of BRANDS) if (n.toLowerCase().includes(b.toLowerCase()))
    return b === 'Lakerol' ? 'Läkerol' : (b === 'Torsleff' ? 'Törsleff' : (b === 'Ihr' ? 'IHR' : b));
  return 'Swedish Cravings';
}

/** Coupe au dernier mot entier ≤ max, ajoute « … » si tronqué. */
function auMot(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max - 1);
  return coupe.slice(0, Math.max(coupe.lastIndexOf(' '), 40)) + '…';
}

function descComplete(p) {
  const d = (p.desc_fr || '').trim().replace(/\s+/g, ' ');
  if (d) return d;
  const cat = p.categories && p.categories.name_fr ? p.categories.name_fr.toLowerCase() : 'produit suédois';
  return `${p.name_fr} — ${cat} suédois authentique, importé de Suède et livré partout en France par Swedish Cravings.`;
}

function titreSeo(p) {
  const plein = `${p.name_fr} | Swedish Cravings`;
  if (plein.length <= 60) return plein;
  if (p.name_fr.length <= 60) return p.name_fr;
  return auMot(p.name_fr, 60);
}

const prixFr = n => (parseFloat(n) || 0).toFixed(2).replace('.', ',') + ' €';

async function main() {
  const data = await get(`${BASE}/api/products`);
  const products = (data && data.products || []).filter(p => p.is_active);
  if (!products.length) { console.log('Aucun produit — prerender ignoré'); return; }

  let template = fs.readFileSync('produit.html', 'utf8');
  // Pages servies sous /produit/<slug> (sous-dossier) : sans <base>, les chemins relatifs
  // (css/, js/, img/, liens de nav) se résoudraient vers /produit/... → 404 (page cassée).
  template = template.replace(/<meta charset="UTF-8">/i, '<meta charset="UTF-8">\n<base href="https://www.swedishcravings.fr/">');
  const outDir = path.join(process.cwd(), 'produit');
  fs.mkdirSync(outDir, { recursive: true });
  /* Purge des fiches obsolètes : un produit renommé change de slug, et
     l'ancien fichier resterait servi à côté du nouveau — contenu quasi
     dupliqué avec un canonical divergent, exactement ce que Google punit. */
  const slugsActuels = new Set(products.map(p => slugify(p.name_fr, p.id) + '.html'));
  for (const f of fs.readdirSync(outDir).filter(x => x.endsWith('.html'))) {
    if (!slugsActuels.has(f)) { fs.unlinkSync(path.join(outDir, f)); console.log('  purgé (slug obsolète) :', f); }
  }

  const productUrls = [];
  let count = 0;

  for (const p of products) {
    const slug = slugify(p.name_fr, p.id);
    const url = `${SITE}/produit/${slug}`;
    const title = titreSeo(p);
    const descFull = descComplete(p);
    const descMeta = auMot(descFull, 158);
    const marque = brandOf(p.name_fr);
    const catNom = (p.categories && p.categories.name_fr) || 'Épicerie suédoise';
    const catSlug = (p.categories && p.categories.slug) || '';
    const img = (p.image_url || '')
      .replace(/^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i, `${SITE}/media/`)
      || `${SITE}/css/og-default.jpg`;
    const price = (parseFloat(p.price) || 0).toFixed(2);
    const enStock = !(p.track_stock === true && (p.stock || 0) <= 0);
    const avail = enStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const alt = `${p.name_fr} — ${marque}, ${catNom.toLowerCase()} suédois`;

    // ── JSON-LD Product enrichi ─────────────────────────────────────
    const ld = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name_fr,
      description: auMot(descFull, 800),
      image: img, sku: p.id,
      brand: { '@type': 'Brand', name: marque },
      category: catNom,
      countryOfOrigin: 'SE',
      offers: {
        '@type': 'Offer', price, priceCurrency: 'EUR', availability: avail, url,
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'Swedish Cravings' },
      },
    };
    if (p.weight) ld.weight = { '@type': 'QuantitativeValue', name: String(p.weight) };
    if ((p.reviews_count || 0) > 0 && p.rating) {
      ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews_count };
    }
    const ldBreadcrumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${SITE}/boutique` },
        { '@type': 'ListItem', position: 3, name: p.name_fr, item: url },
      ],
    };

    // ── Produits similaires : 4 liens statiques (maillage interne) ──
    const similaires = products
      .filter(x => x.id !== p.id && (x.categories && x.categories.slug) === catSlug)
      .slice(0, 4);
    const complement = products.filter(x => x.id !== p.id && !similaires.includes(x)).slice(0, 4 - similaires.length);
    const relHtml = [...similaires, ...complement].map(x => {
      const xImg = (x.image_url || '').replace(/^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i, `${SITE}/media/`);
      return `<a href="/produit/${slugify(x.name_fr, x.id)}" style="display:block;text-decoration:none;color:inherit;">` +
        (xImg ? `<img src="${escAttr(xImg)}" alt="${escAttr(x.name_fr)}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:contain;background:var(--parchment);">` : '') +
        `<div style="font-family:var(--font-ui);font-size:13px;margin-top:8px;">${escHtml(x.name_fr)}</div>` +
        `<div style="font-family:var(--font-ui);font-size:13px;color:var(--dust);">${prixFr(x.price)}</div></a>`;
    }).join('\n');

    let html = template;
    // ── Head ──
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(descMeta)}">`);
    html = html.replace(/<link rel="canonical" id="canonical-link" href="[^"]*">/, `<link rel="canonical" id="canonical-link" href="${url}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
    html = html.replace(/<meta property="og:title" id="og-title" content="[^"]*">/, `<meta property="og:title" id="og-title" content="${escAttr(title)}">`);
    html = html.replace(/<meta property="og:description" id="og-desc" content="[^"]*">/, `<meta property="og:description" id="og-desc" content="${escAttr(descMeta)}">`);
    html = html.replace(/<meta property="og:image" id="og-image" content="[^"]*">/, `<meta property="og:image" id="og-image" content="${escAttr(img)}">`);
    html = html.replace(/<meta property="og:site_name" content="[^"]*">/,
      `<meta property="og:site_name" content="Swedish Cravings">\n<meta property="og:locale" content="fr_FR">\n<meta property="product:price:amount" content="${price}">\n<meta property="product:price:currency" content="EUR">`);
    html = html.replace(/<script type="application\/ld\+json" id="ld-product">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="ld-product">${JSON.stringify(ld)}</script>\n<script type="application/ld+json">${JSON.stringify(ldBreadcrumb)}</script>`);
    html = html.replace(/<\/head>/, `<script>window.__PRODUCT_ID=${JSON.stringify(p.id)};</script>\n</head>`);

    // ── Corps statique : le contenu que voient les crawlers sans JS ──
    html = html.replace(/<strong id="bc-name">[^<]*<\/strong>/, `<strong id="bc-name">${escHtml(p.name_fr)}</strong>`);
    html = html.replace(/<img id="main-photo" src="" alt="" style="[^"]*display:none;">/,
      `<img id="main-photo" src="${escAttr(img)}" alt="${escAttr(alt)}" fetchpriority="high" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:16px;">`);
    html = html.replace(/<div class="pdp-cat" id="pdp-cat"><\/div>/, `<div class="pdp-cat" id="pdp-cat">${escHtml(catNom)}</div>`);
    html = html.replace(/<h1 class="pdp-name" id="pdp-name">[^<]*<\/h1>/, `<h1 class="pdp-name" id="pdp-name">${escHtml(p.name_fr)}</h1>`);
    if (p.subtitle_fr) html = html.replace(/<div class="pdp-sub" id="pdp-sub"><\/div>/, `<div class="pdp-sub" id="pdp-sub">${escHtml(p.subtitle_fr)}</div>`);
    html = html.replace(/<span class="pdp-price" id="pdp-price"><\/span>/, `<span class="pdp-price" id="pdp-price">${prixFr(p.price)}</span>`);
    if (p.weight) html = html.replace(/<div class="pdp-weight" id="pdp-weight" style="display:none;"><\/div>/, `<div class="pdp-weight" id="pdp-weight">${escHtml(String(p.weight))}</div>`);
    html = html.replace(/<p class="pdp-desc" id="pdp-desc"><\/p>/, `<p class="pdp-desc" id="pdp-desc">${escHtml(descFull)}</p>`);
    html = html.replace(/<div class="grid-4" id="related-grid" style="margin-top:32px;"><\/div>/, `<div class="grid-4" id="related-grid" style="margin-top:32px;">\n${relHtml}\n</div>`);

    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    productUrls.push({ url, lastmod: (p.updated_at || '').slice(0, 10) || null });
    count++;
  }

  // Sitemap régénéré : lastmod réel pour les produits
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [['/', 1.0], ['/boutique', 0.9], ['/maison', 0.8], ['/bonbons-suedois', 0.7],
    ['/ahlgrens-bilar', 0.7], ['/olw', 0.7], ['/recettes', 0.7], ['/recette-dip-suedois', 0.6],
    ['/recette-fredagsmys-tacos', 0.6], ['/recette-entrecote-cafe-de-paris', 0.6],
    ['/a-propos', 0.6], ['/contact', 0.5], ['/livraison', 0.4], ['/faq', 0.4]];
  const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const [pth, pri] of staticPages) sm.push(`  <url><loc>${SITE}${pth}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`);
  for (const u of productUrls) sm.push(`  <url><loc>${u.url}</loc><lastmod>${u.lastmod || today}</lastmod><priority>0.8</priority></url>`);
  sm.push('</urlset>');
  fs.writeFileSync('sitemap.xml', sm.join('\n') + '\n');

  console.log(`✓ ${count} fiches produit pré-générées (contenu statique complet) + sitemap (${staticPages.length + productUrls.length} URLs)`);
}

main().catch(e => { console.error('prerender-products failed:', e.message); process.exit(0); });
