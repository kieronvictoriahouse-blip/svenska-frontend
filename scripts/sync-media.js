/**
 * Copie OPTIMISÉE des photos produit dans le site (media/products/…).
 *
 * Pourquoi : /media/* est relayé par Vercel vers le Storage Supabase, et
 * Vercel ne met PAS ces réponses en cache (X-Vercel-Cache: MISS à chaque
 * fois). Chaque affichage d'image — fiche, catalogue, email, crawl Google
 * Shopping — était donc payé en trafic Supabase (5 Go/mois en gratuit),
 * avec des originaux jusqu'à 6,4 Mo. Dépassé le 25/09/2026 (9,97 Go).
 *
 * Vercel sert les fichiers du dépôt AVANT d'appliquer une réécriture :
 * une copie à la même adresse /media/products/<fichier> court-circuite
 * Supabase sans changer aucune URL (flux Merchant, fiches, emails).
 * Une photo ajoutée plus tard en admin continue de passer par Supabase
 * jusqu'au prochain lancement de ce script.
 *
 * Usage (sharp n'est pas une dépendance du site statique) :
 *   NODE_PATH=<dossier node_modules contenant sharp> node scripts/sync-media.js
 *   (ex. celui du backend : ../../svenska-backend-v2/svenska-backend/node_modules)
 *   Ajouter --force pour ré-optimiser les fichiers déjà présents.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const API = process.env.SD_API_URL || 'https://admin.swedishcravings.fr';
const SUPA = /^https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/svenska-media\//i;
const OUT = path.join(__dirname, '..', 'media');
const MAX = 1000;              // px, plus grand côté — largement assez pour fiche, Google et email
const FORCE = process.argv.includes('--force');

async function optimiser(buf, ext) {
  const img = sharp(buf, { failOn: 'none' }).rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  if (ext === '.png') return img.png({ compressionLevel: 9, palette: true, quality: 85, effort: 10 }).toBuffer();
  if (ext === '.webp') return img.webp({ quality: 82, effort: 6 }).toBuffer();
  if (ext === '.avif') return img.avif({ quality: 60 }).toBuffer();
  return img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

(async () => {
  const data = await fetch(`${API}/api/products`).then(r => r.json());
  const urls = new Set();
  for (const p of data.products || []) {
    if (p.image_url) urls.add(p.image_url);
    for (const x of Array.isArray(p.extra_images) ? p.extra_images : []) {
      const u = typeof x === 'string' ? x : x && x.url;
      if (u) urls.add(u);
    }
  }
  let avant = 0, apres = 0, n = 0;
  for (const u of urls) {
    if (!SUPA.test(u)) continue;
    const rel = decodeURIComponent(u.replace(SUPA, '').split('?')[0]);
    const dest = path.join(OUT, rel);
    if (!FORCE && fs.existsSync(dest)) continue;
    try {
      const res = await fetch(u);
      if (!res.ok) { console.log('  ✗', rel, res.status); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(rel).toLowerCase();
      let out = await optimiser(buf, ext);
      if (out.length >= buf.length) out = buf;   // jamais plus lourd que l'original
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, out);
      avant += buf.length; apres += out.length; n++;
      console.log(`  ✓ ${rel}  ${(buf.length / 1e3).toFixed(0)} Ko → ${(out.length / 1e3).toFixed(0)} Ko`);
    } catch (e) { console.log('  ✗', rel, e.message); }
  }
  console.log(`\n${n} image(s) : ${(avant / 1e6).toFixed(1)} Mo → ${(apres / 1e6).toFixed(1)} Mo`);
})();
