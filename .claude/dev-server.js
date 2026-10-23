/* Serveur local pour la boucle design (aucune dépendance).
   Reproduit ce que fait Vercel en prod (vercel.json) :
   - cleanUrls : /boutique → boutique.html, /produit/x → produit/x.html
   - /a-propos → page.html
   - /media/* : fichier local s'il existe, sinon redirection vers le stockage Supabase public
   - /media-w/<largeur>/* : vignette redimensionnée par Supabase
   - /produit/<slug> sans fichier pré-généré → produit.html
   Usage : node .claude/dev-server.js [port]   (défaut 8088, écoute sur 127.0.0.1) */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2], 10) || 8088;
const MEDIA_REMOTE = 'https://fdagtzhodyxulhqbkkoz.supabase.co/storage/v1/object/public/svenska-media/';
const REWRITES = { '/a-propos': '/page' };

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Chemin URL → fichier sur disque, ou null. Refuse la sortie de ROOT et les dossiers cachés (.git, .claude…).
function resolveFile(urlPath) {
  const rel = path.normalize(urlPath).replace(/^[\\/]+/, '');
  if (rel.split(/[\\/]/).some(seg => seg.startsWith('.') && seg !== '.well-known')) return null;
  const base = path.join(ROOT, rel);
  if (base !== ROOT && !base.startsWith(ROOT + path.sep)) return null;
  for (const candidate of [base, base + '.html', path.join(base, 'index.html')]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }

  if (urlPath.length > 1) urlPath = urlPath.replace(/\/+$/, '');
  urlPath = REWRITES[urlPath] || urlPath;

  let file = resolveFile(urlPath === '/' ? '/index' : urlPath);
  // Fiche sans page pré-générée : produit.html la sert (rewrite de vercel.json)
  if (!file && /^\/produit\/[^/]+$/.test(urlPath)) file = resolveFile('/produit.html');
  if (!file) {
    const mw = urlPath.match(/^\/media-w\/(\d+)\/(.+)$/);
    if (mw) {
      res.writeHead(302, { Location: MEDIA_REMOTE.replace('/object/', '/render/image/') + mw[2].split('/').map(encodeURIComponent).join('/') + '?width=' + mw[1] + '&resize=contain&quality=75' });
      res.end();
      return;
    }
    if (urlPath.startsWith('/media/')) {
      res.writeHead(302, { Location: MEDIA_REMOTE + urlPath.slice('/media/'.length).split('/').map(encodeURIComponent).join('/') });
      res.end();
      return;
    }
    // Comme Vercel : /compte/* → « Ma commande », sinon la page 404 du site
    if (/^\/compte\/.+/.test(urlPath)) file = resolveFile('/compte');
    if (!file) {
      const nf = resolveFile('/404');
      res.writeHead(404, { 'Content-Type': nf ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
      if (nf && req.method !== 'HEAD') fs.createReadStream(nf).pipe(res); else res.end('404 ' + urlPath);
      return;
    }
  }

  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Swedish Cravings (local) → http://localhost:${PORT}`);
});
