/**
 * Build du site, lancé par Vercel à chaque déploiement (buildCommand de
 * vercel.json) et par le rafraîchissement programmé (.github/workflows).
 *
 * Avant ce script, rien n'était régénéré : l'action GitHub qui devait le
 * faire n'a jamais réussi, Vercel publiait les fichiers tels quels. Les
 * fiches, le sitemap et le flux Shopping restaient figés au dernier
 * lancement manuel (une box encore annoncée épuisée sur Google Shopping
 * alors qu'elle était en stock).
 *
 * Chaque étape garde les fichiers existants si l'API ne répond pas : un
 * build ne doit jamais publier un site vide.
 */
const { execFileSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const { slugify } = require('./lib/produits');

const BASE = process.env.SD_API_URL || 'https://admin.swedishcravings.fr';

function etape(script) {
  const t = Date.now();
  try {
    execFileSync(process.execPath, [script], { stdio: 'inherit', env: { ...process.env, SD_API_URL: BASE } });
    console.log(`  (${script} : ${Date.now() - t} ms)`);
  } catch (e) {
    console.error(`! ${script} a échoué, fichiers existants conservés :`, e.message);
  }
}

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } }); }).on('error', () => resolve(null));
  });
}

/* Liens écrits à la main dans les recettes (« produit.html?id=96eff74d ») :
   on les remplace par l'adresse réelle de la fiche. produit.html sait aussi
   retrouver un produit par ces 8 caractères, au cas où. */
async function liensProduits() {
  const d = await get(`${BASE}/api/products`);
  const produits = (d && d.products) || [];
  if (!produits.length) return;
  const parPrefixe = new Map(produits.map(p => [String(p.id).slice(0, 8).toLowerCase(), p]));
  let n = 0;
  for (const f of fs.readdirSync('.').filter(x => x.endsWith('.html') && x !== 'produit.html')) {
    const html = fs.readFileSync(f, 'utf8');
    const neuf = html.replace(/href="(?:\/)?produit\.html\?id=([0-9a-f]{8})(?:[0-9a-f-]{28})?"/gi, (m, pre) => {
      const p = parPrefixe.get(pre.toLowerCase());
      if (!p) return m;
      n++;
      return `href="/produit/${slugify(p.name_fr, p.id)}"`;
    });
    if (neuf !== html) fs.writeFileSync(f, neuf);
  }
  console.log(`✓ ${n} liens de pages vers des fiches produit réécrits`);
}

(async () => {
  console.log('Build Swedish Cravings —', BASE);
  etape('scripts/inject-wl.js');          // couleurs et polices de la marque, d'abord : les fiches en héritent
  etape('scripts/prerender-products.js'); // fiches, sitemap, liste statique de la boutique
  etape('scripts/generate-shopping-feed.js');
  try { await liensProduits(); } catch (e) { console.error('! liens produits :', e.message); }
})();
