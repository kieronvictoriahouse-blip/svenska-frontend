/**
 * Génère google-shopping.xml — flux produit Google Merchant Center (RSS 2.0 + namespace g:).
 * À soumettre dans Merchant Center (Produits → Flux) avec l'URL :
 *   https://www.swedishcravings.fr/google-shopping.xml
 * Régénérer à chaque changement de catalogue/prix (idéalement en CI, cf. prerender).
 */
const https = require('https');
const fs = require('fs');

const BASE = process.env.SD_API_URL || 'https://admin.swedishcravings.fr';
const SITE = 'https://www.swedishcravings.fr';

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } }); }).on('error', () => resolve(null));
  });
}
// Identique à produit.html _sdProductSlug / prerender slugify
function slugify(nameFr, id) {
  const base = (nameFr || 'produit').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base + '-' + String(id || '').slice(0, 8);
}
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BRANDS = ['Marimekko', 'IHR', 'Ihr', 'OLW', 'Ahlgrens', 'Läkerol', 'Lakerol', 'Kavli', 'Fazer',
  'Odense', 'Törsleff', 'Torsleff', "Dave & Jon's", 'Santa Maria', 'Polly', 'Ballerina', 'Wasa',
  'Piffi', 'Marabou', 'P Design'];
function brandOf(nameFr) {
  const n = (nameFr || '');
  for (const b of BRANDS) if (n.toLowerCase().includes(b.toLowerCase())) return b === 'Lakerol' ? 'Läkerol' : (b === 'Torsleff' ? 'Törsleff' : (b === 'Ihr' ? 'IHR' : b));
  return 'Swedish Cravings';
}
function descOf(p) {
  const d = (p.desc_fr || '').trim();
  if (d) return d.replace(/\s+/g, ' ').slice(0, 500);
  const cat = p.categories && p.categories.name_fr ? p.categories.name_fr.toLowerCase() : 'produit suédois';
  return `${p.name_fr} — ${cat} suédois authentique, importé et livré en France par Swedish Cravings.`;
}
function googleCat(p) {
  const slug = (p.categories && p.categories.slug) || '';
  if (slug === 'art-de-la-table' || slug === 'maison-deco')
    return 'Home & Garden > Kitchen & Dining > Tableware';
  return 'Food, Beverages & Tobacco > Food Items';
}

/* ── Remise → g:sale_price ─────────────────────────────────────
   Même règle que SDPrice (front) / product-price.ts (back) : remise produit
   prioritaire, sinon remise de la catégorie ; bornes incluses. Merchant
   applique la fenêtre g:sale_price_effective_date lui-même, le flux n'a
   donc pas besoin d'être régénéré le jour où la promo commence ou finit. */
function discountOf(p) {
  const own = { type: p.discount_type, value: p.discount_value, start: p.discount_start, end: p.discount_end };
  const c = p.categories || {};
  const cat = { type: c.discount_type, value: c.discount_value, start: c.discount_start, end: c.discount_end };
  const ok = d => (d.type === 'percent' || d.type === 'fixed') && parseFloat(d.value) > 0;
  const d = ok(own) ? own : ok(cat) ? cat : null;
  if (!d) return null;
  const today = new Date().toISOString().slice(0, 10);
  const end = String(d.end || '').slice(0, 10);
  if (end && end < today) return null;
  const base = parseFloat(p.price) || 0;
  const v = parseFloat(d.value);
  const sale = Math.max(0, Math.round((d.type === 'percent' ? base * (1 - v / 100) : base - v) * 100) / 100);
  if (!(sale > 0 && sale < base)) return null;
  const start = String(d.start || '').slice(0, 10);
  // Format ISO 8601 attendu par Merchant : début/fin séparés par « / ».
  const window = (start || end)
    ? `${start || today}T00:00+02:00/${end || '2099-12-31'}T23:59+02:00`
    : '';
  return { sale: sale.toFixed(2), window };
}

/* ── Étiquettes personnalisées (pilotage Google Ads) ─────────────
   custom_label_0 = marge (coût d'achat vs prix HT) → enchérir plus sur ce qui rapporte
   custom_label_1 = tranche de prix → un produit à 2 € ne paie pas un clic à 0,50 €
   custom_label_2 = mise en avant (bestseller / nouveauté)
   custom_label_3 = catégorie (slug) */
function marginLabel(p) {
  const price = parseFloat(p.price) || 0, cost = parseFloat(p.cost_price) || 0;
  if (!price || !cost) return 'marge-inconnue';
  const m = 1 - cost / (price / 1.055); // TVA alimentaire 5,5 % — approximation suffisante pour un palier
  return m >= 0.6 ? 'marge-haute' : m >= 0.45 ? 'marge-moyenne' : 'marge-basse';
}
function priceLabel(p) {
  const x = parseFloat(p.price) || 0;
  return x < 3 ? 'prix-moins-3' : x < 6 ? 'prix-3-6' : x < 15 ? 'prix-6-15' : 'prix-15-plus';
}
function pushLabel(p) {
  return p.is_bestseller ? 'bestseller' : p.is_new ? 'nouveaute' : 'standard';
}

async function main() {
  const data = await get(`${BASE}/api/products`);
  const products = (data && data.products || []).filter(p => p.is_active && p.image_url && (parseFloat(p.price) || 0) > 0);
  if (!products.length) { console.log('Aucun produit éligible — flux ignoré'); return; }

  const items = products.map(p => {
    const url = `${SITE}/produit/${slugify(p.name_fr, p.id)}`;
    const avail = (p.track_stock === true && (p.stock || 0) <= 0) ? 'out_of_stock' : 'in_stock';
    const price = (parseFloat(p.price) || 0).toFixed(2);
    const disc = discountOf(p);
    const catName = (p.categories && p.categories.name_fr) || '';
    const extra = [
      disc ? `    <g:sale_price>${disc.sale} EUR</g:sale_price>` : '',
      disc && disc.window ? `    <g:sale_price_effective_date>${disc.window}</g:sale_price_effective_date>` : '',
      catName ? `    <g:product_type>${esc(googleCat(p).startsWith('Home') ? 'Maison' : 'Épicerie')} &gt; ${esc(catName)}</g:product_type>` : '',
      `    <g:custom_label_0>${marginLabel(p)}</g:custom_label_0>`,
      `    <g:custom_label_1>${priceLabel(p)}</g:custom_label_1>`,
      `    <g:custom_label_2>${pushLabel(p)}</g:custom_label_2>`,
      `    <g:custom_label_3>${esc((p.categories && p.categories.slug) || 'sans-categorie')}</g:custom_label_3>`,
    ].filter(Boolean).join('\n');
    return `  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title>${esc((p.name_fr || '').slice(0, 150))}</g:title>
    <g:description>${esc(descOf(p))}</g:description>
    <g:link>${url}</g:link>
    <g:image_link>${esc((p.image_url || '').replace(/^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i, `${SITE}/media/`))}</g:image_link>
    <g:availability>${avail}</g:availability>
    <g:price>${price} EUR</g:price>
    <g:brand>${esc(brandOf(p.name_fr))}</g:brand>
    <g:condition>new</g:condition>
    <g:identifier_exists>no</g:identifier_exists>
    <g:google_product_category>${esc(googleCat(p))}</g:google_product_category>
${extra}
  </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Swedish Cravings — épicerie &amp; maison suédoises</title>
  <link>${SITE}</link>
  <description>Produits suédois authentiques livrés en France.</description>
${items}
</channel>
</rss>
`;
  fs.writeFileSync('google-shopping.xml', xml);
  console.log(`✓ Flux Google Shopping généré : ${products.length} produits → google-shopping.xml`);
}
main().catch(e => { console.error('generate-shopping-feed failed:', e.message); process.exit(0); });
