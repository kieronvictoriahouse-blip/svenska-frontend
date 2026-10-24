/**
 * Build-time product prerenderer (SEO + GEO).
 * Pour chaque produit actif, génère une page statique /produit/<slug>.html
 * (servie en /produit/<slug> grâce à cleanUrls). Lancé à chaque déploiement
 * par scripts/build.js (buildCommand de vercel.json).
 *
 * Principe : TOUT ce qui compte doit être dans le HTML servi, car les
 * crawlers des moteurs IA (ChatGPT Search, Perplexity, Claude) n'exécutent
 * PAS le JavaScript. Le JS du site ré-hydrate ensuite par-dessus les mêmes
 * conteneurs : aucun changement visuel.
 *
 * Dans le HTML statique :
 *   - <title> ≤ 60 car., meta description coupée au mot, canonical, OG complet
 *   - corps ENTIER : nom, catégorie, sous-titre, prix, poids, description
 *     complète, image avec alt, fil d'Ariane rempli, 4 produits similaires
 *     en liens réels (maillage interne)
 *   - JSON-LD Product (vraie marque, origine réelle, GTIN, poids, livraison,
 *     retours) + JSON-LD BreadcrumbList avec le rayon
 *   - window.__SD_PRODUCT : la fiche elle-même, sans champ commercial, pour
 *     un affichage et un « Ajouter au panier » immédiats
 * Régénère aussi sitemap.xml et la liste statique de la boutique.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { slugOf, isHome, isOut, brandOf, isoPays, netQty, mediaUrl, sansPrive } = require('./lib/produits');

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

const escAttr = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// JSON posé dans un <script> : « </script> » ou « <!-- » ne doivent pas le fermer.
const jsonScript = o => JSON.stringify(o).replace(/</g, '\\u003c');

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
  return `${p.name_fr} — ${cat}, importé de Suède et livré partout en France par Swedish Cravings.`;
}

/* « 75 g », « 2,01 kg », « 33 cl » — q vient de netQty (total en kg ou en l). */
function quantiteFr(q) {
  const fr = (n, d) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');
  if (q.liquid) return q.total >= 1 ? `${fr(q.total, 2)} l` : `${fr(q.total * 100, 1)} cl`;
  return q.total >= 1 ? `${fr(q.total, 2)} kg` : `${fr(q.total * 1000, 0)} g`;
}

function titreSeo(p) {
  const plein = `${p.name_fr} | Swedish Cravings`;
  if (plein.length <= 60) return plein;
  if (p.name_fr.length <= 60) return p.name_fr;
  return auMot(p.name_fr, 60);
}

const prixFr = n => (parseFloat(n) || 0).toFixed(2).replace('.', ',') + ' €';

/* Livraison et retours tels que les annoncent livraison.html et les CGV
   (article 7) : point relais en France, traitement 1 jour, 2 à 4 jours
   ouvrés de transport ; rétractation 14 jours, retour à la charge du client.
   Le tarif et le seuil viennent des réglages du back-office. */
function livraisonLd(cfg) {
  const cost = 4.90;
  const seuil = parseFloat(cfg && cfg.free_shipping_threshold) > 0 ? parseFloat(cfg.free_shipping_threshold) : 29;
  return {
    shipping: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: cost.toFixed(2), currency: 'EUR' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },   // « 24 à 48 h ouvrées »
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' },
      },
    },
    seuil,
    returns: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'FR',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnShippingFees',
    },
  };
}

async function main() {
  const [data, wl] = await Promise.all([get(`${BASE}/api/products`), get(`${BASE}/api/white-label`)]);
  const products = (data && data.products || []).filter(p => p.is_active);
  if (!products.length) { console.log('Aucun produit — prerender ignoré (fichiers existants conservés)'); return; }
  const liv = livraisonLd(wl && wl.config);

  // produit.html porte <base href="/"> : servies sous /produit/<slug>, les pages
  // trouvent css/, js/ et img/ à la racine (et en local, les fichiers locaux).
  const template = fs.readFileSync('produit.html', 'utf8');
  const outDir = path.join(process.cwd(), 'produit');
  fs.mkdirSync(outDir, { recursive: true });
  /* Purge des fiches obsolètes : un produit renommé change de slug, et
     l'ancien fichier resterait servi à côté du nouveau — contenu quasi
     dupliqué avec un canonical divergent, exactement ce que Google punit. */
  const slugsActuels = new Set(products.map(p => slugOf(p) + '.html'));
  for (const f of fs.readdirSync(outDir).filter(x => x.endsWith('.html'))) {
    if (!slugsActuels.has(f)) { fs.unlinkSync(path.join(outDir, f)); console.log('  purgé (slug obsolète) :', f); }
  }

  const productUrls = [];
  let count = 0;

  for (const p of products) {
    const slug = slugOf(p);
    const url = `${SITE}/produit/${slug}`;
    const title = titreSeo(p);
    const descFull = descComplete(p);
    const descMeta = auMot(descFull, 158);
    const marque = brandOf(p.name_fr, p);
    const catNom = (p.categories && p.categories.name_fr) || 'Épicerie suédoise';
    const catSlug = (p.categories && p.categories.slug) || '';
    const img = mediaUrl(p.image_url, SITE) || `${SITE}/img/sc-logo-horizontal.jpg`;
    const price = (parseFloat(p.price) || 0).toFixed(2);
    const avail = isOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
    const alt = `${p.name_fr}${marque ? ' — ' + marque : ''}, ${catNom.toLowerCase()}`;
    const rayonUrl = catSlug && !isHome(p) ? `${SITE}/boutique?rayon=${encodeURIComponent(catSlug)}` : (isHome(p) ? `${SITE}/maison` : `${SITE}/boutique`);

    // ── JSON-LD Product ─────────────────────────────────────────────
    const offers = {
      '@type': 'Offer', price, priceCurrency: 'EUR', availability: avail, url,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Swedish Cravings' },
      shippingDetails: (parseFloat(p.price) || 0) >= liv.seuil
        ? { ...liv.shipping, shippingRate: { '@type': 'MonetaryAmount', value: '0.00', currency: 'EUR' } }
        : liv.shipping,
      hasMerchantReturnPolicy: liv.returns,
    };
    /* Poids net en clair dans la description : Merchant Center (produits
       trouvés sur le site) le cherche dans le texte, pas dans `weight`, et
       signalait les bonbons comme « descriptions incomplètes ». Ajouté
       après la coupe à 800 caractères pour ne jamais être tronqué. */
    const q = netQty(p.weight);
    const poidsTxt = q ? ` ${q.liquid ? 'Contenance' : 'Poids net'} : ${quantiteFr(q)}.` : '';
    const ld = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name_fr,
      description: auMot(descFull, 800 - poidsTxt.length) + poidsTxt,
      image: img, sku: p.sku || p.id,
      category: catNom,
      offers,
    };
    if (marque) ld.brand = { '@type': 'Brand', name: marque };
    if (/^\d{8,14}$/.test(String(p.ean || '').trim())) ld.gtin = String(p.ean).trim();
    const iso = isoPays(p.origin_fr);
    if (iso) ld.countryOfOrigin = iso;
    if (q) ld.weight = { '@type': 'QuantitativeValue', value: Math.round(q.total * 1000 * 100) / 100, unitCode: q.liquid ? 'MLT' : 'GRM' };
    if ((p.reviews_count || 0) > 0 && p.rating) {
      ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews_count };
    }
    const ldBreadcrumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: isHome(p) ? 'Maison' : 'Boutique', item: isHome(p) ? `${SITE}/maison` : `${SITE}/boutique` },
        ...(catSlug && !isHome(p) ? [{ '@type': 'ListItem', position: 3, name: catNom, item: rayonUrl }] : []),
        { '@type': 'ListItem', position: catSlug && !isHome(p) ? 4 : 3, name: p.name_fr, item: url },
      ],
    };

    // ── Produits similaires : 4 liens statiques (maillage interne) ──
    // En stock seulement, et jamais une serviette à côté d'un paquet de bonbons.
    const voisins = products.filter(x => x.id !== p.id && !isOut(x) && isHome(x) === isHome(p) && (parseFloat(x.price) || 0) > 0);
    const similaires = voisins.filter(x => (x.categories && x.categories.slug) === catSlug).slice(0, 4);
    const complement = voisins.filter(x => !similaires.includes(x)).slice(0, 4 - similaires.length);
    const relHtml = [...similaires, ...complement].map(x => {
      const xImg = mediaUrl(x.image_url, '').replace(/^\/media\//, '/media-w/400/');
      return `<a href="/produit/${slugOf(x)}" style="display:block;text-decoration:none;color:inherit;">` +
        (xImg ? `<img src="${escAttr(xImg)}" alt="${escAttr(x.name_fr)}" loading="lazy" width="400" height="400" style="width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:var(--parchment);">` : '') +
        `<div style="font-family:var(--font-display);font-size:17px;font-weight:600;color:var(--heather-text);margin-top:8px;">${escHtml(x.name_fr)}</div>` +
        `<div style="font-family:var(--font-display);font-size:17px;color:var(--midnight);">${prixFr(x.price)}</div></a>`;
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
      `<script type="application/ld+json" id="ld-product">${jsonScript(ld)}</script>\n<script type="application/ld+json">${jsonScript(ldBreadcrumb)}</script>`);
    html = html.replace(/<\/head>/, `<script>window.__PRODUCT_ID=${JSON.stringify(p.id)};window.__SD_PRODUCT=${jsonScript(sansPrive(p))};</script>\n</head>`);

    // ── Corps statique : le contenu que voient les crawlers sans JS ──
    html = html.replace(/<strong id="bc-name">[^<]*<\/strong>/, `<strong id="bc-name">${escHtml(p.name_fr)}</strong>`);
    // Versions redimensionnées (même règle que _pdpSetMain dans produit.html)
    const imgRel = mediaUrl(p.image_url, '');
    const srcset = imgRel.startsWith('/media/') && !/[\s,]/.test(imgRel)
      ? ` srcset="${[600, 1000, 1600].map(w => `${escAttr(imgRel.replace(/^\/media\//, `/media-w/${w}/`))} ${w}w`).join(', ')}" sizes="(max-width:1024px) 100vw, 560px"` : '';
    html = html.replace(/<img id="main-photo" src="" alt="" style="[^"]*display:none;">/,
      `<img id="main-photo" src="${escAttr(img)}"${srcset} alt="${escAttr(alt)}" fetchpriority="high" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:16px;">`);
    html = html.replace(/<div class="pdp-cat" id="pdp-cat"><\/div>/, `<div class="pdp-cat" id="pdp-cat">${escHtml(catNom)}</div>`);
    html = html.replace(/<h1 class="pdp-name" id="pdp-name">[^<]*<\/h1>/, `<h1 class="pdp-name" id="pdp-name">${escHtml(p.name_fr)}</h1>`);
    if (p.subtitle_fr) html = html.replace(/<div class="pdp-sub" id="pdp-sub"><\/div>/, `<div class="pdp-sub" id="pdp-sub">${escHtml(p.subtitle_fr)}</div>`);
    html = html.replace(/<span class="pdp-price" id="pdp-price"><\/span>/, `<span class="pdp-price" id="pdp-price">${prixFr(p.price)}</span>`);
    if (p.weight) html = html.replace(/<div class="pdp-weight" id="pdp-weight" style="display:none;"><\/div>/, `<div class="pdp-weight" id="pdp-weight">${escHtml(String(p.weight))}</div>`);
    html = html.replace(/<p class="pdp-desc" id="pdp-desc"><\/p>/, `<p class="pdp-desc" id="pdp-desc">${escHtml(descFull)}</p>`);
    if (p.ingredients_fr) html = html.replace(/<div class="accordion" id="accordion"><\/div>/,
      `<div class="accordion" id="accordion"><div class="acc-item"><h2 class="acc-h">Ingrédients</h2><div class="acc-content">${escHtml(p.ingredients_fr)}${p.allergens_fr ? '<br>' + escHtml(p.allergens_fr) : ''}</div></div></div>`);
    html = html.replace(/<div class="grid-4" id="related-grid" style="margin-top:32px;"><\/div>/, `<div class="grid-4" id="related-grid" style="margin-top:32px;">\n${relHtml}\n</div>`);

    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    productUrls.push({ url, lastmod: (p.updated_at || '').slice(0, 10) || null });
    count++;
  }

  // Sitemap régénéré : lastmod réel pour les produits
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [['/', 1.0], ['/boutique', 0.9], ['/maison', 0.8], ['/bonbons-suedois', 0.7],
    ['/ahlgrens-bilar', 0.7], ['/olw', 0.7], ['/recettes', 0.7], ['/recette-dip-suedois', 0.6], ['/recette-kanelbullar', 0.7],
    ['/recette-fredagsmys-tacos', 0.6], ['/recette-entrecote-cafe-de-paris', 0.6],
    ['/a-propos', 0.6], ['/contact', 0.5], ['/livraison', 0.4], ['/faq', 0.4]];
  const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const [pth, pri] of staticPages) sm.push(`  <url><loc>${SITE}${pth}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`);
  for (const u of productUrls) sm.push(`  <url><loc>${u.url}</loc><lastmod>${u.lastmod || today}</lastmod><priority>0.8</priority></url>`);
  sm.push('</urlset>');
  fs.writeFileSync('sitemap.xml', sm.join('\n') + '\n');

  // Boutique : liste de liens pour les robots sans JavaScript, et ItemList.
  remplirBoutique(products.filter(p => !isHome(p)));

  console.log(`✓ ${count} fiches produit pré-générées (contenu statique complet) + sitemap (${staticPages.length + productUrls.length} URLs)`);
}

function remplirBoutique(tous) {
  const f = 'boutique.html';
  if (!fs.existsSync(f)) return;
  // Disponibles d'abord, comme la grille : un épuisé n'ouvre pas la liste.
  const produits = [...tous.filter(p => !isOut(p)), ...tous.filter(isOut)];
  let html = fs.readFileSync(f, 'utf8');
  const liste = '<ul>' + produits.map(p =>
    `<li><a href="/produit/${slugOf(p)}">${escHtml(p.name_fr)}</a> — ${prixFr(p.price)}</li>`).join('') + '</ul>';
  const itemList = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Boutique Swedish Cravings',
    numberOfItems: produits.length,
    itemListElement: produits.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/produit/${slugOf(p)}`, name: p.name_fr })),
  };
  const avant = html;
  html = html.replace(/<!-- sd-static-start -->[\s\S]*?<!-- sd-static-end -->/, `<!-- sd-static-start -->${liste}<!-- sd-static-end -->`);
  html = html.replace(/<!-- sd-itemlist-start -->[\s\S]*?<!-- sd-itemlist-end -->/,
    `<!-- sd-itemlist-start --><script type="application/ld+json">${jsonScript(itemList)}</script><!-- sd-itemlist-end -->`);
  if (html !== avant) { fs.writeFileSync(f, html); console.log(`✓ boutique : ${produits.length} liens statiques + ItemList`); }
}

main().catch(e => { console.error('prerender-products failed:', e.message); process.exit(0); });
