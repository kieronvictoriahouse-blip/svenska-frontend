/**
 * Build-time product prerenderer (SEO).
 * Pour chaque produit actif, génère une page statique /produit/<slug>.html
 * (servie en /produit/<slug> grâce à cleanUrls) avec, DANS le HTML servi à Google :
 *   - <title>, meta description, canonical, Open Graph propres au produit
 *   - <h1> rempli avec le nom du produit
 *   - JSON-LD schema.org/Product (prix, disponibilité, marque, image)
 *   - window.__PRODUCT_ID pour que le JS existant hydrate la page
 * Régénère aussi sitemap.xml avec les URLs propres. Lancé en CI avant le déploiement.
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

function descOf(p) {
  const d = (p.desc_fr || '').trim();
  if (d) return d.replace(/\s+/g, ' ').slice(0, 160);
  const cat = p.categories && p.categories.name_fr ? p.categories.name_fr.toLowerCase() : 'produit suédois';
  return `${p.name_fr} — ${cat} suédois authentique, livré en France par Swedish Cravings.`.slice(0, 160);
}

async function main() {
  const data = await get(`${BASE}/api/products`);
  const products = (data && data.products || []).filter(p => p.is_active);
  if (!products.length) { console.log('Aucun produit — prerender ignoré'); return; }

  let template = fs.readFileSync('produit.html', 'utf8');
  // Pages servies sous /produit/<slug> (sous-dossier) : sans <base>, les chemins relatifs
  // (css/, js/, img/, liens de nav) se résoudraient vers /produit/... → 404 (page cassée).
  // <base> les réancre sur la racine du site.
  template = template.replace(/<meta charset="UTF-8">/i, '<meta charset="UTF-8">\n<base href="https://www.swedishcravings.fr/">');
  const outDir = path.join(process.cwd(), 'produit');
  fs.mkdirSync(outDir, { recursive: true });

  const productUrls = [];
  let count = 0;

  for (const p of products) {
    const slug = slugify(p.name_fr, p.id);
    const url = `${SITE}/produit/${slug}`;
    const title = `${p.name_fr} | Swedish Cravings`;
    const desc = descOf(p);
    // og:image / JSON-LD : URL absolue, mais servie via le domaine du site
    // (/media/…) pour passer par le CDN Vercel plutôt que le Storage Supabase.
    const img = (p.image_url || '')
      .replace(/^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i, `${SITE}/media/`)
      || `${SITE}/css/og-default.jpg`;
    const price = (parseFloat(p.price) || 0).toFixed(2);
    const avail = (p.track_stock === true && (p.stock || 0) <= 0)
      ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';

    const ld = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name_fr, description: desc, image: img, sku: p.id,
      brand: { '@type': 'Brand', name: 'Swedish Cravings' },
      offers: { '@type': 'Offer', price, priceCurrency: 'EUR', availability: avail, url },
    };
    if ((p.reviews_count || 0) > 0 && p.rating) {
      ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews_count };
    }

    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(desc)}">`);
    html = html.replace(/<link rel="canonical" id="canonical-link" href="[^"]*">/, `<link rel="canonical" id="canonical-link" href="${url}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
    html = html.replace(/<meta property="og:title" id="og-title" content="[^"]*">/, `<meta property="og:title" id="og-title" content="${escAttr(title)}">`);
    html = html.replace(/<meta property="og:description" id="og-desc" content="[^"]*">/, `<meta property="og:description" id="og-desc" content="${escAttr(desc)}">`);
    html = html.replace(/<meta property="og:image" id="og-image" content="[^"]*">/, `<meta property="og:image" id="og-image" content="${escAttr(img)}">`);
    html = html.replace(/<script type="application\/ld\+json" id="ld-product">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="ld-product">${JSON.stringify(ld)}</script>`);
    html = html.replace(/<h1 class="pdp-name" id="pdp-name">[^<]*<\/h1>/, `<h1 class="pdp-name" id="pdp-name">${escHtml(p.name_fr)}</h1>`);
    // Injecte l'id produit pour l'hydratation JS
    html = html.replace(/<\/head>/, `<script>window.__PRODUCT_ID=${JSON.stringify(p.id)};</script>\n</head>`);

    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    productUrls.push(url);
    count++;
  }

  // Sitemap régénéré avec les URLs propres + pages statiques
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [['/', 1.0], ['/boutique', 0.9], ['/maison', 0.8], ['/bonbons-suedois', 0.7],
    ['/ahlgrens-bilar', 0.7], ['/olw', 0.7], ['/recettes', 0.7], ['/recette-dip-suedois', 0.6],
    ['/recette-fredagsmys-tacos', 0.6], ['/recette-entrecote-cafe-de-paris', 0.6],
    ['/a-propos', 0.6], ['/contact', 0.5], ['/livraison', 0.4], ['/faq', 0.4]];
  const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const [pth, pri] of staticPages) sm.push(`  <url><loc>${SITE}${pth}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`);
  for (const u of productUrls) sm.push(`  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`);
  sm.push('</urlset>');
  fs.writeFileSync('sitemap.xml', sm.join('\n') + '\n');

  console.log(`✓ ${count} fiches produit pré-générées dans /produit + sitemap (${staticPages.length + productUrls.length} URLs)`);
}

main().catch(e => { console.error('prerender-products failed:', e.message); process.exit(0); });
