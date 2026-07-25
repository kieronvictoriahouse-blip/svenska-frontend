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

async function main() {
  const data = await get(`${BASE}/api/products`);
  const products = (data && data.products || []).filter(p => p.is_active && p.image_url && (parseFloat(p.price) || 0) > 0);
  if (!products.length) { console.log('Aucun produit éligible — flux ignoré'); return; }

  const items = products.map(p => {
    const url = `${SITE}/produit/${slugify(p.name_fr, p.id)}`;
    const avail = (p.track_stock === true && (p.stock || 0) <= 0) ? 'out_of_stock' : 'in_stock';
    const price = (parseFloat(p.price) || 0).toFixed(2);
    return `  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title>${esc((p.name_fr || '').slice(0, 150))}</g:title>
    <g:description>${esc(descOf(p))}</g:description>
    <g:link>${url}</g:link>
    <g:image_link>${esc(p.image_url)}</g:image_link>
    <g:availability>${avail}</g:availability>
    <g:price>${price} EUR</g:price>
    <g:brand>${esc(brandOf(p.name_fr))}</g:brand>
    <g:condition>new</g:condition>
    <g:identifier_exists>no</g:identifier_exists>
    <g:google_product_category>${esc(googleCat(p))}</g:google_product_category>
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
