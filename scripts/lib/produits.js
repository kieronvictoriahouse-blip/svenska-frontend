/**
 * Règles produit partagées par les scripts de build (prerender, flux
 * Shopping, liens des recettes). Côté navigateur, js/app.js a les mêmes :
 * sdProductSlug, sdIsHomeProduct, sdNetQty — à garder identiques.
 */

// Adresse d'une fiche : /produit/<slug>. Identique à sdProductSlug() (js/app.js).
function slugify(nameFr, id) {
  const base = (nameFr || 'produit').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base + '-' + String(id || '').slice(0, 8);
}

// Art de la table (serviettes…) : univers « Maison », présenté à part de l'épicerie.
const HOME_CATS = ['art-de-la-table', 'maison-deco'];
const isHome = p => HOME_CATS.includes((p.categories && p.categories.slug) || '');
const isBox = p => (p.tags || []).includes('box') || (Array.isArray(p.bundle_items) && p.bundle_items.length > 0);
const isOut = p => p.track_stock === true && (p.stock || 0) <= 0;

// La marque réelle, pas un fourre-tout.
const BRANDS = ['Marimekko', 'IHR', 'Ihr', 'OLW', 'Ahlgrens', 'Läkerol', 'Lakerol', 'Kavli', 'Fazer',
  'Odense', 'Törsleff', 'Torsleff', "Dave & Jon's", 'Santa Maria', 'Polly', 'Ballerina', 'Wasa',
  'Piffi', 'Marabou', 'P Design', 'Malaco'];
// Sous-marques → fabricant (le nom produit porte la sous-marque, pas le fabricant).
const SUB_BRANDS = { 'Kexchoklad': 'Cloetta', 'Center': 'Cloetta', 'Djungelvrål': 'Malaco', 'Gott & Blandat': 'Malaco', 'Tyrkisk Peber': 'Fazer', 'Dumle': 'Fazer', "O'boy": "O'boy" };
function brandOf(nameFr) {
  const n = (nameFr || '').toLowerCase();
  for (const b of BRANDS) if (n.includes(b.toLowerCase()))
    return b === 'Lakerol' ? 'Läkerol' : (b === 'Torsleff' ? 'Törsleff' : (b === 'Ihr' ? 'IHR' : b));
  for (const [k, v] of Object.entries(SUB_BRANDS)) if (n.includes(k.toLowerCase())) return v;
  return '';
}

// Pays d'origine saisi en français → code ISO (JSON-LD countryOfOrigin).
const PAYS = { 'suède': 'SE', 'finlande': 'FI', 'danemark': 'DK', 'norvège': 'NO', 'islande': 'IS', 'pérou': 'PE', 'allemagne': 'DE', 'pays-bas': 'NL', 'belgique': 'BE', 'france': 'FR' };
const isoPays = o => PAYS[String(o || '').trim().toLowerCase()] || '';

/* Quantité nette : « 16x21g » = 16 × 21 g, soit 336 g. Identique à sdNetQty(). */
function netQty(w) {
  const s = String(w || '').toLowerCase().replace(',', '.');
  let m = s.replace(/\s+/g, '').match(/^(?:(\d+)[x×*])?(\d+(?:\.\d+)?)(kg|g|l|cl|ml)$/);
  // « 240 g (6 x 40 g) » : la première quantité est le total
  if (!m) { const t = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml)(?![a-z])/); if (t) m = [t[0], null, t[1], t[2]]; }
  if (!m) return null;
  const n = m[1] ? parseInt(m[1], 10) : 1, v = parseFloat(m[2]), u = m[3];
  const total = n * (u === 'kg' ? v : u === 'g' ? v / 1000 : u === 'l' ? v : u === 'cl' ? v / 100 : v / 1000);
  return { total, liquid: /l$/.test(u) };
}

const SUPA_MEDIA = /^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i;
const mediaUrl = (u, site) => String(u || '').replace(SUPA_MEDIA, `${site}/media/`);

// Champs commerciaux : jamais dans une page ou un fichier publié.
const PRIVE = /cost|marg|achat|purchase|supplier|fournisseur/i;
const sansPrive = p => Object.fromEntries(Object.entries(p).filter(([k]) => !PRIVE.test(k)));

module.exports = { slugify, HOME_CATS, isHome, isBox, isOut, brandOf, isoPays, netQty, mediaUrl, sansPrive };
