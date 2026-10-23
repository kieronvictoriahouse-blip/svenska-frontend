/**
 * Build-time white-label + CMS injector
 * Fetches WL config and CMS from the API, then bakes the data directly
 * into the HTML files before Vercel deployment. Zero JS needed at runtime
 * for colors and hero text — no flash even on first visit.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SD_API_URL || 'https://admin.swedishcravings.fr';
const MARKER_START = '<!-- wl-baked-start -->';
const MARKER_END = '<!-- wl-baked-end -->';

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('Fetching WL + CMS from', BASE);
  const [wlData, cmsData] = await Promise.all([
    get(`${BASE}/api/white-label`),
    get(`${BASE}/api/cms`),
  ]);

  const wl  = wlData?.config;
  const cms = cmsData?.cms ? Object.fromEntries(cmsData.cms.map(i => [i.key, i])) : {};

  if (!wl?.id) {
    console.log('No WL config — skipping injection');
    return;
  }

  // Build :root CSS block
  const vars = [];
  if (wl.color_primary)   { vars.push(`--heather:${wl.color_primary}`); vars.push(`--heather-mid:${wl.color_primary}CC`); }
  if (wl.color_secondary) { vars.push(`--lingon:${wl.color_secondary}`); vars.push(`--lingon-mid:${wl.color_secondary}CC`); }
  if (wl.color_bg)   vars.push(`--cream:${wl.color_bg}`);
  if (wl.color_text) vars.push(`--midnight:${wl.color_text}`);
  if (wl.font_display) vars.push(`--font-display:'${wl.font_display}',Georgia,serif`);
  if (wl.font_body)    vars.push(`--font-body:'${wl.font_body}',Georgia,serif`);
  if (wl.font_ui)      vars.push(`--font-ui:'${wl.font_ui}',sans-serif`);

  const styleBlock = `${MARKER_START}<style>:root{${vars.join(';')}}</style>${MARKER_END}`;

  // Also build Google Fonts link if custom fonts
  const fonts = [wl.font_display, wl.font_body, wl.font_ui].filter(Boolean);
  const fontLink = fonts.length
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(/ /g, '+') + ':wght@300;400;600').join('&family=')}&display=swap">`
    : '';

  const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf8');

    // Remove previous injection
    html = html.replace(new RegExp(`${MARKER_START}.*?${MARKER_END}`, 's'), '');

    /* Variables injectées juste après la feuille de style. Les pages la
       chargent avec un numéro de version (css/style.css?v=20) : l'ancien
       motif, sans « ?v= », ne trouvait plus rien et le premier affichage
       gardait la palette par défaut (vert et orange). Le texte du hero
       n'est plus cuit ici : l'accueil le lit dans le CMS (carrousel). */
    html = html.replace(
      /(<link rel="stylesheet" href="\/?css\/style\.css(?:\?v=\d+)?">)/,
      `$1\n${styleBlock}${fontLink ? '\n' + fontLink : ''}`
    );

    fs.writeFileSync(file, html);
    console.log(`✓ ${file}`);
  }

  console.log(`\nWL "${wl.site_name}" baked into ${htmlFiles.length} files.`);
}

main().catch(e => { console.error('inject-wl failed:', e.message); process.exit(0); });
