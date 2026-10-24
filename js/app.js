/* app.js v5 */
var PRODUCTS=[];
window._SD_STATIC=PRODUCTS.slice();

var CATS=[{id:'Épices',emoji:'🌶️'},{id:'Flocons & Céréales',emoji:'🌾'},{id:'Baies séchées',emoji:'🫐'},{id:'Sucres & Sirops',emoji:'🍯'},{id:'Thés & Tisanes',emoji:'🫖'},{id:'Farines & Graines',emoji:'🌻'},{id:'Mélanges',emoji:'🎄'},{id:'Chips & Snacks',emoji:'🍟'},{id:'Basics suédois',emoji:'🇸🇪'},{id:'Confiseries',emoji:'🍬'},{id:'Fika & Boulangerie',emoji:'🧁'},{id:'Art de la table',emoji:'🍽️'},{id:'Maison & Déco',emoji:'🕯️'}];
const CAT_LABELS={'Épices':{sv:'Kryddor',fr:'Épices & Aromates',en:'Spices & Herbs'},'Flocons & Céréales':{sv:'Flingor & spannmål',fr:'Flocons & Céréales',en:'Oats & Cereals'},'Baies séchées':{sv:'Torkade bär',fr:'Baies séchées',en:'Dried berries'},'Sucres & Sirops':{sv:'Sucres & Sirops',fr:'Sucres & Sirops',en:'Sugars & Syrups'},'Thés & Tisanes':{sv:'Thés & Tisanes',fr:'Thés & Tisanes',en:'Teas & Infusions'},'Farines & Graines':{sv:'Farines & Graines',fr:'Farines & Graines',en:'Flours & Seeds'},'Mélanges':{sv:'Blandningar',fr:'Mélanges suédois',en:'Swedish blends'},'Chips & Snacks':{sv:'Chips & Snacks',fr:'Chips & Snacks',en:'Chips & Snacks'},'Basics suédois':{sv:'Svenska baser',fr:'Basics suédois',en:'Swedish basics'},'Confiseries':{sv:'Konfektyr',fr:'Confiseries',en:'Confectionery'},'Fika & Boulangerie':{sv:'Fika & Bakning',fr:'Fika & Boulangerie',en:'Fika & Baking'},'Art de la table':{sv:'Dukning',fr:'Art de la table',en:'Tableware'},'Maison & Déco':{sv:'Hem & Inredning',fr:'Maison & Déco',en:'Home & Decor'}};
const UI={sv:{addedCart:'Tillagd i korgen!',emptyCart:'Din korg är tom',subtotal:'Delsumma',checkout:'Beställ →',keepShopping:'Fortsätt handla',freeShip:'Fri frakt från 29€',searchPlaceholder:'Sök en krydda, ett produkt...',noResults:'Inga resultat',cartTitle:'Din korg',products:'produkter',product:'produkt',filterAll:'Alla',sortDefault:'Standard',sortPriceAsc:'Pris stigande',sortPriceDesc:'Pris fallande',sortName:'Namn A→Ö',subscribe:'Tack!'},fr:{addedCart:'Ajouté au panier !',emptyCart:'Votre panier est vide',subtotal:'Sous-total',checkout:'Commander →',keepShopping:'Continuer mes achats',freeShip:'Livraison offerte dès 29€',searchPlaceholder:'Rechercher une épice, un produit...',noResults:'Aucun résultat',cartTitle:'Votre panier',products:'produits',product:'produit',filterAll:'Tous',sortDefault:'Par défaut',sortPriceAsc:'Prix croissant',sortPriceDesc:'Prix décroissant',sortName:'Nom A→Z',subscribe:'Merci !'},en:{addedCart:'Added to cart!',emptyCart:'Your cart is empty',subtotal:'Subtotal',checkout:'Checkout →',keepShopping:'Continue shopping',freeShip:'Free delivery from €29',searchPlaceholder:'Search for a spice, product...',noResults:'No results',cartTitle:'Your cart',products:'products',product:'product',filterAll:'All',sortDefault:'Default',sortPriceAsc:'Price: low to high',sortPriceDesc:'Price: high to low',sortName:'Name A→Z',subscribe:'Thanks!'}};
/* « Livraison offerte dès … » : calculé depuis les réglages (SD_SHIP), jamais écrit en dur */
['fr','en','sv'].forEach(function(l){Object.defineProperty(UI[l],'freeShip',{configurable:true,enumerable:true,get:function(){return sdFreeShipText(l);}});});
/* Petit traducteur des textes d'interface : _sdT('fr','en','sv') */
function _sdT(fr,en,sv){return LANG==='en'?en:LANG==='sv'?sv:fr;}

/* Lien de parrainage : /?parrain=CODE, sur n'importe quelle page. Le code
   ami est gardé 30 jours et proposé au panier ; c'est le serveur qui
   décide s'il s'applique (nouveau client, articles hors promotion). */
(function(){
  try{
    var q=new URLSearchParams(location.search);
    var c=(q.get('parrain')||'').trim().toUpperCase();
    if(!/^[A-Z0-9-]{3,40}$/.test(c))return;
    localStorage.setItem('sd_parrain',JSON.stringify({code:c,t:Date.now()}));
    q.delete('parrain');
    var s=q.toString();
    history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);
  }catch(e){}
})();

/* Règles de frais de port — miroir de `src/lib/shipping.ts` du back-office.
   Le serveur reste l'autorité (c'est /api/checkout qui facture) ; ici on
   n'affiche qu'une estimation. La fenêtre de dates est recalculée à chaque
   appel : une opération expirée retombe seule au seuil normal, même si le
   cache localStorage n'a pas été rafraîchi. */
window.SD_SHIP=(function(){
  var DEF={FR:{threshold:29,cost:4.90},INTL:{threshold:50,cost:9.90}};
  function cfg(){try{return JSON.parse(localStorage.getItem('sd_wl_v1'))||{};}catch(e){return {};}}
  /* Date à Paris, comme le serveur : un client à l'étranger ne doit pas
     voir l'opération finir (ou commencer) un jour avant le checkout. */
  function today(){var d=new Date();try{return d.toLocaleDateString('en-CA',{timeZone:'Europe/Paris'});}catch(e){}var p=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  function promoOn(c){
    if(!c||c.ship_promo_active!==true)return false;
    var t=today();
    var f=c.ship_promo_from?String(c.ship_promo_from).slice(0,10):null;
    var u=c.ship_promo_until?String(c.ship_promo_until).slice(0,10):null;
    if(f&&t<f)return false;
    if(u&&t>u)return false;
    return true;
  }
  function rules(isIntl){
    var c=cfg();
    var base=isIntl?DEF.INTL:DEF.FR;
    var configured=parseFloat(c.free_shipping_threshold);
    var baseThreshold=(!isIntl&&configured>0)?configured:base.threshold;
    if(promoOn(c)){
      var raw=isIntl?c.ship_promo_threshold_intl:c.ship_promo_threshold;
      var thr=parseFloat(raw);
      if(raw!==null&&raw!==undefined&&raw!==''&&!isNaN(thr)&&thr>=0){
        return {threshold:thr,cost:base.cost,promoActive:true,baseThreshold:baseThreshold};
      }
    }
    return {threshold:baseThreshold,cost:base.cost,promoActive:false,baseThreshold:baseThreshold};
  }
  return {
    rules:rules,
    threshold:function(isIntl){return rules(isIntl).threshold;},
    cost:function(isIntl){return rules(isIntl).cost;},
    /* Message d'opération dans la langue courante, '' si pas d'opération */
    label:function(lang){
      var c=cfg();
      if(!promoOn(c))return '';
      return c['ship_promo_label_'+(lang||'fr')]||c.ship_promo_label_fr||'';
    }
  };
})();
window.SD_WL=(function(){var _w={};var _ok=false;try{var _r=localStorage.getItem('sd_wl_v1');if(_r){_w=JSON.parse(_r)||{};_ok=!!_w.site_name;}}catch(e){}var n=_w.site_name||'';return{brand_name:n,brand_tagline:_w.site_slogan||'',contact_email:_w.email||'',instagram:_w.instagram||'',facebook:_w.facebook||'',pinterest:_w.pinterest||'',free_shipping_threshold:_w.free_shipping_threshold||SD_SHIP.threshold(false),announcement:{sv:_w.announcement_sv||'',fr:_w.announcement_fr||'',en:_w.announcement_en||''},footer_desc:{sv:_w.footer_desc_sv||'',fr:_w.footer_desc_fr||'',en:_w.footer_desc_en||''},footer_tagline:{sv:_w.footer_tagline_sv||'',fr:_w.footer_tagline_fr||'',en:_w.footer_tagline_en||''},copyright:{sv:'© 2026 '+n+' · Alla rättigheter förbehållna',fr:'© 2026 '+n+' · Tous droits réservés',en:'© 2026 '+n+' · All rights reserved'},_ready:_ok};})();
let _favorites=(function(){try{return JSON.parse(localStorage.getItem('sd_favorites')||'[]');}catch(e){return[];}})();
function saveFavorites(){try{localStorage.setItem('sd_favorites',JSON.stringify(_favorites));}catch(e){}}
function toggleFavorite(id){const sid=String(id);const idx=_favorites.indexOf(sid);if(idx===-1){_favorites.push(sid);}else{_favorites.splice(idx,1);}saveFavorites();document.querySelectorAll('[data-fav-id="'+sid+'"]').forEach(el=>{el.classList.toggle('liked',_favorites.includes(sid));el.setAttribute('aria-pressed',_favorites.includes(sid));});}
/* Stockage local blindé : un panier corrompu ou un navigateur qui bloque
   le stockage (navigation privée, cookies refusés) ne doit jamais casser
   le site — on repart d'un panier vide plutôt que d'une page blanche. */
function _sdLSGet(k,fb){try{var v=localStorage.getItem(k);if(v==null)return fb;var o=JSON.parse(v);return(o&&typeof o==='object')?o:fb;}catch(e){return fb;}}
function _sdCartProducts(){return _sdLSGet('sd_cart_products',{});}
let cart=(function(){var _c=_sdLSGet('sd_cart',{});var _dirty=false;Object.keys(_c).forEach(function(k){if(!k||k==='NaN'||k==='undefined'||k==='null'){delete _c[k];_dirty=true;}});if(_dirty)try{localStorage.setItem('sd_cart',JSON.stringify(_c));}catch(e){}return _c;})();
let LANG=(function(){try{var l=localStorage.getItem('sd_lang');return(l==='sv'||l==='en'||l==='fr')?l:'fr';}catch(e){return 'fr';}})();
var _sekRate=(function(){try{var r=parseFloat(sessionStorage.getItem('_sekRate'));return r>0?r:0;}catch(e){return 0;}})();
/* Prix : toujours en euros, la devise que Stripe débite — « 6,19 € » en
   français et en suédois, « €6.19 » en anglais. Les couronnes, arrondies
   ligne à ligne, ne tombaient jamais sur le montant prélevé : en suédois
   elles ne sont plus qu'un repère, à part (sdSekHint). */
function fmtPrice(eur){var n=(+(eur||0)).toFixed(2);return LANG==='en'?'€'+n:n.replace('.',',')+' €';}
/* « ≈ 388 kr » en suédois une fois le taux connu, vide sinon. */
function sdSekHint(eur){eur=+eur||0;return LANG==='sv'&&_sekRate>0&&eur>0?'≈ '+Math.round(eur*_sekRate)+' kr':'';}
/* Repère <span class="sd-sek" data-eur="…"> : rempli au rendu, puis à
   l'arrivée du taux et au changement de langue (sdFillSek). */
function sdSekSpan(eur){return'<span class="sd-sek" data-eur="'+(+eur||0)+'">'+sdSekHint(eur)+'</span>';}
function sdFillSek(root){(root||document).querySelectorAll('.sd-sek[data-eur]').forEach(function(el){el.textContent=sdSekHint(el.getAttribute('data-eur'));});}
/* Texte sûr dans un attribut ou du HTML généré */
function _sdAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ── Fiche produit : adresse, recherche, livraison, quantité nette ──
   Le slug DOIT rester identique à slugify() de scripts/lib/produits.js
   (pages pré-générées /produit/<slug>, sitemap, flux Shopping). Une page
   pas encore générée est servie par produit.html (rewrite de vercel.json),
   qui retrouve le produit par les 8 caractères d'identifiant du slug. */
function sdProductSlug(nameFr,id){var base=String(nameFr||'produit').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);return base+'-'+String(id||'').slice(0,8);}
/* Adresse figée en base (produits.slug) quand elle existe : renommer un
   produit ne casse plus son URL. Sinon, calculée depuis le nom (avant). */
var SD_SLUG_OK=/^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}$/;
function sdProductUrl(p){if(!p)return'/boutique';if(p.slug&&SD_SLUG_OK.test(p.slug))return'/produit/'+p.slug;var n=p.name&&typeof p.name==='object'?(p.name.fr||p.name.en||p.name.sv):(p.name_fr||p.name);return'/produit/'+sdProductSlug(n,p.uuid||p.id);}
/* Art de la table (serviettes…) : univers « Maison » à part, jamais proposé
   en suggestion à côté de l'épicerie ni dans le flux Shopping. */
var SD_HOME_CATS=['art-de-la-table','maison-deco'];
function sdIsHomeProduct(p){var c=p&&(p.category||p.categories);return!!(c&&SD_HOME_CATS.indexOf(c.slug)>-1);}
function sdIsOut(p){return!!(p&&p.trackStock&&p.stock!=null&&p.stock<=0);}
/* Recherche : sans accents (« lakerol » trouve « Läkerol »), tous les mots
   demandés, dans les trois langues, le sous-titre, la catégorie et les tags. */
function sdNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ø/g,'o').replace(/æ/g,'ae').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();}
function sdSearchText(p){if(!p)return'';if(p._sdSearch)return p._sdSearch;var o=function(v){return v&&typeof v==='object'?[v.fr,v.en,v.sv].join(' '):(v||'');};var c=p.category||{};return p._sdSearch=sdNorm([o(p.name),o(p.subtitle),p.cat,c.fr,c.en,c.sv,(p.tags||[]).filter(function(t){return!/^format:/.test(t);}).join(' '),p.weight].join(' '));}
function sdMatches(p,q){var words=sdNorm(q).split(' ').filter(Boolean);if(!words.length)return true;var t=sdSearchText(p);return words.every(function(w){return t.indexOf(w)>-1||(w.length>3&&/s$/.test(w)&&t.indexOf(w.slice(0,-1))>-1);});}
/* Ligne de livraison sous le prix, calculée depuis les réglages (jamais en dur) */
/* Montant rond sans centimes (« 29 € », « €29 ») ; sinon fmtPrice */
function sdPriceShort(n){n=+n||0;if(n%1!==0)return fmtPrice(n);return LANG==='en'?'€'+n:n+' €';}
function sdShipLine(){var r=SD_SHIP.rules(false);var promo=SD_SHIP.label(LANG);var c=fmtPrice(r.cost),t=sdPriceShort(r.threshold);
  if(LANG==='en')return(promo?promo+' · ':'')+'Pickup point delivery '+c+', free from '+t+' · Free workshop pickup (Drôme)';
  if(LANG==='sv')return(promo?promo+' · ':'')+'Leverans till utlämningsställe '+c+', gratis från '+t+' · Gratis upphämtning i ateljén (Drôme)';
  return(promo?promo+' · ':'')+'Livraison en point relais '+c+', offerte dès '+t+' · Retrait gratuit à l’atelier (Drôme)';}
/* Quantité nette : « 16x21g » = 16 sachets de 21 g, soit 336 g. */
function sdNetQty(w){var raw=String(w||'').trim(),s=raw.toLowerCase().replace(',','.'),keep='';var m=s.replace(/\s+/g,'').match(/^(?:(\d+)[x×*])?(\d+(?:\.\d+)?)(kg|g|l|cl|ml)$/);
  /* « 240 g (6 x 40 g) » : la première quantité est le total, le libellé reste tel quel */
  if(!m){var t=s.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml)(?![a-z])/);if(!t)return null;m=[t[0],null,t[1],t[2]];keep=raw;}
  var n=m[1]?parseInt(m[1],10):1,v=parseFloat(m[2]),u=m[3];var base=u==='kg'?v:u==='g'?v/1000:u==='l'?v:u==='cl'?v/100:v/1000;var liq=/l$/.test(u);var one=String(v).replace('.',LANG==='en'?'.':',')+' '+u;return{total:n*base,per:liq?'l':'kg',count:keep?1:n,one:one,label:keep||(n>1?n+' × '+one:one)};}
function sdUnitPrice(price,w){var q=sdNetQty(w);if(!q||!(q.total>0)||!(price>0))return'';return fmtPrice(price/q.total)+'/'+(q.per==='l'?'l':'kg');}
/* Allergènes (annexe II du règlement 1169/2011) en gras dans la liste
   d'ingrédients, comme l'exige l'article 21. Texte échappé d'abord. */
var SD_ALLERGENS=new RegExp('(^|[^\\p{L}])('+[
  'lait','lactos[ée]rum','lactose','babeurre','beurre(?! de cacao)','cr[èe]me','fromages?','bl[ée]','gluten','seigle','orge','avoine','[ée]peautre','kamut','soja','(?:œ|oe)ufs?','arachides?','cacahu[èe]tes?','noisettes?','amandes?','noix(?! de coco)','pistaches?','cajou','p[ée]cans?','macadamia','s[ée]same','moutarde','c[ée]leri','poissons?','crustac[ée]s','mollusques','sulfites?','anhydride sulfureux','lupin',
  'milk','whey','butter','cream','cheese','wheat','rye','barley','oats?','spelt','soy(?:a|bean)?s?','eggs?','peanuts?','hazelnuts?','almonds?','walnuts?','nuts','pistachios?','cashews?','sesame','mustard','celery','fish','crustaceans','molluscs','sulphites?',
  /* suédois : les mots composés commencent par l'allergène (mjölkpulver, vetemjöl) */
  'mjölk\\p{L}*','skummjölk\\p{L}*','helmjölk\\p{L}*','vassle\\p{L}*','grädd\\p{L}*','smör\\p{L}*','laktos','vete\\p{L}*','råg\\p{L}*','korn','havre\\p{L}*','dinkel','soja\\p{L}*','ägg\\p{L}*','jordnöt\\p{L}*','hasselnöt\\p{L}*','mandel','mandlar','sesam\\p{L}*','senap\\p{L}*','selleri','fisk','kräftdjur','blötdjur','sulfit\\p{L}*'
].join('|')+')(?!\\p{L})','giu');
/* Vignette redimensionnée par le stockage (rewrite /media-w/<largeur>/… de
   vercel.json) : une photo de 365 Ko en PNG devient ~12 Ko en WebP à 300 px. */
function sdThumb(u,w){u=String(u||'');return u.indexOf('/media/')===0?'/media-w/'+(w||400)+'/'+u.slice(7):u;}
function sdThumbSet(u){return u&&String(u).indexOf('/media/')===0?sdThumb(u,300)+' 300w, '+sdThumb(u,600)+' 600w, '+sdThumb(u,900)+' 900w':'';}
function sdBoldAllergens(t){return _sdAttr(t).replace(SD_ALLERGENS,function(m,pre,word,off,str){if(/^butter$/i.test(word)&&/(cocoa|cacao)\s*$/i.test(str.slice(Math.max(0,off-7),off+pre.length)))return m;return pre+'<strong>'+word+'</strong>';});}
function _doSekRefresh(){try{window.dispatchEvent(new Event('sd:currency'));}catch(e){}renderCartDrawer();if(typeof renderCart==='function')renderCart();sdFillSek();}
function loadSekRate(){if(_sekRate>0){if(LANG==='sv')_doSekRefresh();return;}/* api.frankfurter.app redirige (301) vers .dev sans en-tête CORS : le navigateur refusait, les prix suédois restaient en euros */fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=SEK').then(function(r){return r.json();}).then(function(d){var rate=d&&d.rates&&d.rates.SEK;if(rate>0){_sekRate=rate;try{sessionStorage.setItem('_sekRate',String(rate));}catch(e){}if(LANG==='sv')_doSekRefresh();}}).catch(function(){});}
function saveCart(){try{localStorage.setItem('sd_cart',JSON.stringify(cart));}catch(e){}}
/* Panier synchronisé entre onglets. La page de confirmation vide le panier
   après paiement, mais seulement dans SON onglet : un autre onglet ouvert
   gardait l'ancien panier en mémoire, le ré-écrivait, et le recalage sur le
   stock (qui déduit déjà la commande payée) le « réduisait » à tort — une
   cliente a cru que sa commande payée avait été amputée (14/10). */
window.addEventListener('storage',function(e){
  if(e.key!=='sd_cart'&&e.key!==null)return;
  var neuf=_sdLSGet('sd_cart',{});
  Object.keys(cart).forEach(function(k){delete cart[k];});
  Object.keys(neuf).forEach(function(k){cart[k]=neuf[k];});
  if(typeof updateCartBadge==='function')updateCartBadge();
  if(typeof renderCartDrawer==='function')renderCartDrawer();
  if(typeof renderCartPageFull==='function')renderCartPageFull();
});
function clearCart(){cart={};saveCart();try{Object.keys(localStorage).filter(function(k){return k.startsWith('sd_cart');}).forEach(function(k){localStorage.removeItem(k);});}catch(e){}updateCartBadge();renderCartDrawer();}
function saveLang(l){try{localStorage.setItem('sd_lang',l);}catch(e){}}
// ─── Tracking publicitaire : Meta Pixel + e-commerce GA4 (pour lancer des pubs mesurées) ───
// POUR ACTIVER META : coller l'ID du Pixel Meta ci-dessous (ex. '1234567890123456'). Vide = inactif.
window.SD_META_PIXEL_ID = window.SD_META_PIXEL_ID || '';
/* Rien ne part vers Meta avant « Accepter » sur la bannière cookies
   (sd-consent.js, CNIL) : le pixel se charge au consentement, et un refus
   ultérieur le révoque. Si le pixel est activé, citer Meta dans le texte de
   la bannière et dans la politique de confidentialité. */
(function(){
  function load(){
    if(!window.SD_META_PIXEL_ID || window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', window.SD_META_PIXEL_ID); fbq('track','PageView');
  }
  if(typeof window.sdConsent==='function' && window.sdConsent()==='granted') load();
  window.addEventListener('sd:consent',function(e){ if(e.detail==='granted') load(); else if(window.fbq){ try{ fbq('consent','revoke'); }catch(x){} } });
})();
/* Événements e-commerce GA4 (importés dans Google Ads). item_id = UUID produit = g:id du flux Merchant : c'est ce qui relie une conversion au produit Shopping cliqué et alimente le remarketing dynamique. Ne pas changer l'un sans l'autre. */
function _sdGaPrice(p){var b=(p&&p.price)||0;return window.SDPrice?SDPrice.effective(b,p):b;}
function _sdGaItem(p,qty){return {item_id:String((p&&(p.uuid||p.id))||''),item_name:(p&&p.name&&(p.name.fr||p.name))||'',item_category:(p&&p.cat)||'',quantity:qty||1,price:_sdGaPrice(p)};}
function sdTrackViewItem(p){try{if(!p||typeof gtag!=='function')return;var id=String(p.uuid||p.id);if(window._sdViewed===id)return;window._sdViewed=id;var it=_sdGaItem(p,1);gtag('event','view_item',{currency:'EUR',value:it.price,items:[it]});}catch(e){}}
function sdTrackAddToCart(p,qty){try{var it=_sdGaItem(p,qty);var v=Math.round(it.price*it.quantity*100)/100;if(typeof gtag==='function')gtag('event','add_to_cart',{currency:'EUR',value:v,items:[it]});if(window.fbq)fbq('track','AddToCart',{value:v,currency:'EUR'});}catch(e){}}
function _sdGaCartEvent(name,extra){try{if(typeof gtag!=='function')return false;var cp={};try{cp=_sdCartProducts();}catch(e){}var items=[],v=0;Object.entries(cart).filter(function(e){return e[1]>0;}).forEach(function(e){var k=e[0],i=k.indexOf('_'),id=i===-1?k:k.slice(0,i);var p=PRODUCTS.find(function(x){return String(x.uuid||x.id)===id;})||cp[id];if(!p)return;var it=_sdGaItem(Object.assign({uuid:id},p),e[1]);it.item_id=id;items.push(it);v+=it.price*it.quantity;});if(!items.length)return false;gtag('event',name,Object.assign({currency:'EUR',value:Math.round(v*100)/100,items:items},extra||{}));return true;}catch(e){return false;}}
function sdTrackBeginCheckout(){_sdGaCartEvent('begin_checkout');}
// Entonnoir GA4 du panier : vue du panier (une fois par page), puis mode de livraison choisi.
function sdTrackViewCart(){if(window._sdCartViewed)return;if(_sdGaCartEvent('view_cart'))window._sdCartViewed=1;}
function sdTrackShippingInfo(tier){_sdGaCartEvent('add_shipping_info',{shipping_tier:tier||''});}
function sdTrackPurchase(order){try{if(!order)return;var total=parseFloat(order.total)||0;var tid=String(order.order_number||order.id||'');var L=[];try{L=typeof order.lines==='string'?JSON.parse(order.lines):(order.lines||[]);}catch(e){}var items=L.map(function(l){return {item_id:String(l.product_id||''),item_name:l.name||'',quantity:l.qty||1,price:parseFloat(l.price)||0};});if(typeof gtag==='function'){gtag('event','purchase',{transaction_id:tid,value:total,shipping:parseFloat(order.shipping)||0,currency:'EUR',items:items});var A=window.SD_ADS;if(A&&A.id&&A.purchaseLabel)gtag('event','conversion',{send_to:A.id+'/'+A.purchaseLabel,value:total,currency:'EUR',transaction_id:tid});}if(window.fbq)fbq('track','Purchase',{value:total,currency:'EUR'});}catch(e){}}

// ── Stock : helpers partagés (panier + page produit) ─────────────────────────
// Un produit sans suivi de stock (trackStock=false ou stock null) = stock illimité.
function _sdFindProd(id){return ((typeof PRODUCTS!=='undefined'&&PRODUCTS)||[]).find(x=>x.id===id||x.uuid===id||String(x.id)===String(id)||String(x.uuid)===String(id))||(window._SD_STATIC||[]).find(x=>x.id===id||String(x.id)===String(id));}
function _sdStock(p){return (!p||!p.trackStock||p.stock===null||p.stock===undefined)?Infinity:p.stock;}
/* Recale le panier sur le stock reellement disponible.
   Un panier vit dans le localStorage : celui d'avant-hier peut demander
   3 boites d'un article dont il ne reste rien. Sans ce recalage, le
   client remplit son adresse, clique Payer, et decouvre le refus a la
   toute derniere etape — la pire place pour l'apprendre.
   Retourne la liste de ce qui a bouge, pour pouvoir le lui dire. */
function sdRevaliderPanier(){
  var changes=[];
  var parProduit={};
  Object.keys(cart).forEach(function(k){
    var ri=k.indexOf('_');var base=ri===-1?k:k.slice(0,ri);
    (parProduit[base]=parProduit[base]||[]).push(k);
  });
  Object.keys(parProduit).forEach(function(cid){
    var p=_sdFindProd(cid);
    /* Produit inconnu du catalogue courant : on n'y touche pas. Il peut
       s'agir d'un chargement partiel, et vider un panier sur un doute
       serait pire que le laisser. */
    if(!p)return;
    var stock=_sdStock(p);
    if(stock===Infinity)return;
    var reste=Math.max(0,stock);
    parProduit[cid].forEach(function(k){
      var veut=cart[k]||0;
      var garde=Math.min(veut,reste);
      reste-=garde;
      if(garde!==veut){
        changes.push({nom:(p.name&&p.name[LANG])||'',avant:veut,apres:garde});
        if(garde<=0)delete cart[k];else cart[k]=garde;
      }
    });
  });
  if(changes.length){saveCart();if(typeof updateCartBadge==='function')updateCartBadge();if(typeof renderCartDrawer==='function')renderCartDrawer();}
  return changes;
}
function sdLigneRecalage(c){
  return c.apres<=0
    ? (LANG==='en'?(c.nom+' is no longer available and was removed')
      :LANG==='sv'?(c.nom+' finns inte längre och togs bort')
      :(c.nom+" n'est plus disponible et a été retiré"))
    : (LANG==='en'?(c.nom+': quantity reduced to '+c.apres)
      :LANG==='sv'?(c.nom+': antal minskat till '+c.apres)
      :(c.nom+' : quantité ramenée à '+c.apres));
}
function sdMessageRevalidation(changes){
  if(!changes||!changes.length)return'';
  return changes.map(sdLigneRecalage).join('\n');
}
/* Affiche le recalage DANS la page panier (plus d'alerte bloquante du
   navigateur), et dit clairement que les commandes déjà passées ne sont
   pas touchées : seul le panier en cours est ajusté. */
function sdAfficherRecalage(changes){
  if(!changes||!changes.length)return;
  var root=document.getElementById('cart-page-root');if(!root||!root.parentNode)return;
  var T={
    tete:{fr:'Votre panier a été ajusté au stock disponible :',en:'Your cart was adjusted to the stock available:',sv:'Din varukorg har anpassats efter lagret:'},
    pied:{fr:'Vos commandes déjà passées ne sont pas concernées.',en:'Orders you have already placed are not affected.',sv:'Beställningar du redan har gjort påverkas inte.'},
    fermer:{fr:'Fermer',en:'Close',sv:'Stäng'}
  };
  var t=function(o){return o[LANG]||o.fr;};
  var n=document.getElementById('sd-recalage');
  if(!n){n=document.createElement('div');n.id='sd-recalage';n.className='sd-recalage';n.setAttribute('role','status');root.parentNode.insertBefore(n,root);}
  n.innerHTML='<strong>'+t(T.tete)+'</strong>'
    +'<ul>'+changes.map(function(c){return '<li>'+_sdAttr(sdLigneRecalage(c))+'</li>';}).join('')+'</ul>'
    +'<span class="sd-recalage-foot">'+t(T.pied)+'</span>'
    +'<button type="button" class="sd-recalage-x" aria-label="'+t(T.fermer)+'">'+_sdIcons.close+'</button>';
  n.querySelector('button').onclick=function(){n.remove();};
}
function _sdCartQtyForProduct(cid){let n=0;Object.keys(cart).forEach(function(k){var ri=k.indexOf('_');var base=ri===-1?k:k.slice(0,ri);if(base===String(cid))n+=cart[k]||0;});return n;}
function _sdStockMsg(kind,n){if(kind==='out')return LANG==='en'?'Out of stock':LANG==='sv'?'Slut i lager':'Produit épuisé';if(kind==='max')return LANG==='en'?'Maximum available quantity reached':LANG==='sv'?'Max antal i lager nått':'Quantité maximale en stock atteinte';return LANG==='en'?('Only '+n+' left in stock'):LANG==='sv'?(n+' kvar i lager'):('Il ne reste que '+n+' en stock');}
/* Ajout au panier. Le tiroir s'ouvre et confirme lui-même l'ajout (bandeau
   en tête du tiroir, lu par les lecteurs d'écran) : le toast ne recouvre
   plus le bouton « Commander » sur mobile. */
function addToCart(id,qty=1,variant=null){if(id===undefined||id===null||String(id)==='NaN'||String(id)==='undefined')return;const p=_sdFindProd(id);const cid=(p&&p.uuid)?p.uuid:id;const key=variant?`${cid}_${variant}`:`${cid}`;const stock=_sdStock(p);if(stock<=0){showToast(_sdStockMsg('out'));return;}const already=_sdCartQtyForProduct(cid);let add=qty;if(stock!==Infinity)add=Math.min(qty,Math.max(0,stock-already));if(add<=0){openCart();showToast(_sdStockMsg('max'));return;}cart[key]=(cart[key]||0)+add;saveCart();updateCartBadge();if(p){try{const cp=_sdCartProducts();cp[String(cid)]={name:p.name,photo:p.photo,price:p.price,weight:p.weight,variants:p.variants||[],pickup_only:!!p.pickup_only,discountType:p.discountType||null,discountValue:p.discountValue!=null?p.discountValue:null,discountStart:p.discountStart||null,discountEnd:p.discountEnd||null};localStorage.setItem('sd_cart_products',JSON.stringify(cp));}catch(e){}}sdTrackAddToCart(p,add);openCart();if(stock!==Infinity&&add<qty){showToast(_sdStockMsg('only',stock));}else if(p){const name=(p.name&&(p.name[LANG]||p.name.fr))||'';showToast(_sdT('Ajouté au panier : ','Added to cart: ','Tillagd i korgen: ')+name);}}
function openSnipcartCheckout(){closeCart(false);if(!/\/panier(\.html)?$/.test(window.location.pathname))window.location.href='/panier';}
function _snipAdd(){}
function changeQty(key,delta){var ri=key.indexOf('_');var cid=ri===-1?key:key.slice(0,ri);var p=_sdFindProd(cid);var stock=_sdStock(p);var target=(cart[key]||0)+delta;if(target>0&&stock!==Infinity){var others=_sdCartQtyForProduct(cid)-(cart[key]||0);var maxThis=stock-others;if(target>maxThis){target=Math.max(0,maxThis);showToast(_sdStockMsg('only',stock));}}if(target<=0)delete cart[key];else cart[key]=target;saveCart();updateCartBadge();renderCartDrawer();}
function removeItem(key){delete cart[key];saveCart();updateCartBadge();renderCartDrawer();}
/* Pastille du panier : masquée à zéro ; le bouton annonce le nombre d'articles */
function updateCartBadge(){const total=_sdCartCount();document.querySelectorAll('.cart-badge').forEach(el=>{el.textContent=total>0?String(total):'';el.hidden=!(total>0);});const base=_sdT('Panier','Cart','Varukorg');const unit=total>1?_sdT('articles','items','varor'):_sdT('article','item','vara');document.querySelectorAll('.btn-cart').forEach(b=>b.setAttribute('aria-label',total>0?base+', '+total+' '+unit:base));}
function cartTotal(){return Object.entries(cart).filter(([,q])=>q>0).reduce((sum,[key,qty])=>{const _ti=key.indexOf('_');const idStr=_ti===-1?key:key.slice(0,_ti);const variant=_ti===-1?undefined:key.slice(_ti+1);const _cpt=_sdCartProducts();const p=PRODUCTS.find(x=>String(x.uuid||x.id)===idStr||(/^\d+$/.test(idStr)&&x.id===parseInt(idStr,10)))||_cpt[idStr]||(window._SD_STATIC||[]).find(x=>String(x.id)===idStr);if(!p)return sum;const v=variant?p.variants?.find(x=>x.label===variant):p.variants?.[0];const _base=v?v.price:p.price;const _eff=window.SDPrice?SDPrice.effective(_base,p):_base;return sum+_eff*qty;},0);}

/* ── Tiroir panier ──
   Lignes échappées (noms venus de l'API) et actions par délégation
   (data-cart-act, voir sdInitA11y) : plus de clé de panier recopiée dans un
   onclick. Frais de port : point relais France, même règle que panier.html
   et /api/checkout (SD_SHIP ↔ lib/shipping.ts) ; l'Europe est rappelée. */
function _sdCartLineProd(idStr){const cp=_sdCartProducts();return PRODUCTS.find(x=>String(x.uuid||x.id)===idStr||(/^\d+$/.test(idStr)&&x.id===parseInt(idStr,10)))||cp[idStr]||(window._SD_STATIC||[]).find(x=>String(x.id)===idStr);}
/* Suggestions pour atteindre la livraison offerte : l'épicerie d'abord, puis
   un article Maison (serviettes, petit prix) en dernier. Jamais un article
   épuisé, déjà dans le panier, une box ou un produit à plusieurs formats. */
function _sdDrawerSuggestions(remaining){
  if(!(remaining>0))return[];
  const inCart={};Object.keys(cart).forEach(k=>{const i=k.indexOf('_');inCart[i===-1?k:k.slice(0,i)]=1;});
  const eff=p=>window.SDPrice?SDPrice.effective(p.price,p):p.price;
  const pool=(PRODUCTS||[]).filter(p=>p&&p.uuid&&!inCart[String(p.uuid)]&&!sdIsOut(p)&&p.price>0&&!(p.variants&&p.variants.length>1)&&(p.tags||[]).indexOf('box')===-1);
  const rank=(a,b)=>{const ua=eff(a)>=remaining?0:1,ub=eff(b)>=remaining?0:1;if(ua!==ub)return ua-ub;if(!!a.bestseller!==!!b.bestseller)return a.bestseller?-1:1;return eff(a)-eff(b);};
  const food=pool.filter(p=>!sdIsHomeProduct(p)).sort(rank),home=pool.filter(sdIsHomeProduct).sort(rank);
  return home.length?food.slice(0,2).concat(home.slice(0,1)):food.slice(0,3);
}
function _sdDrawerSuggHTML(remaining){
  const list=_sdDrawerSuggestions(remaining);if(!list.length)return'';
  return`<section class="cart-sugg" aria-labelledby="cart-sugg-t"><h3 class="cart-sugg-title" id="cart-sugg-t">${_sdT('Pour compléter votre panier','To complete your order','Komplettera din beställning')}</h3><ul class="cart-sugg-list">${list.map(p=>{const name=(p.name&&(p.name[LANG]||p.name.fr))||'';const sale=!!(window.SDPrice&&SDPrice.active(p));const e=window.SDPrice?SDPrice.effective(p.price,p):p.price;const unlock=e>=remaining;return`<li class="cart-sugg-item">${p.photo?`<img src="${_sdAttr(sdThumb(p.photo,300))}" alt="" width="44" height="44" loading="lazy" decoding="async">`:'<span class="cart-sugg-ph"></span>'}<span class="cart-sugg-text"><a class="cart-sugg-name" href="${_sdAttr(sdProductUrl(p))}" onclick="closeCart(false)">${_sdAttr(name)}</a><span class="cart-sugg-meta"><span class="cart-sugg-price${sale?' prod-price--sale':''}">${fmtPrice(e)}</span>${unlock?`<span class="cart-sugg-unlock">${_sdT('livraison offerte avec cet article','free delivery with this item','fri frakt med denna vara')}</span>`:''}</span></span><button type="button" class="cart-sugg-add" data-sugg-add="${_sdAttr(p.uuid)}" aria-label="${_sdAttr(_sdT('Ajouter au panier : ','Add to cart: ','Lägg i korgen: ')+name)}"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg></button></li>`;}).join('')}</ul></section>`;
}
function renderCartDrawer(){
  const list=document.getElementById('drawer-items-list');const foot=document.getElementById('drawer-footer');if(!list)return;
  const entries=Object.entries(cart).filter(([,q])=>q>0);
  if(entries.length===0){list.innerHTML=`<div class="cart-empty"><p class="cart-empty-msg">${UI[LANG].emptyCart}</p><a class="btn-outline-dark" href="/boutique" onclick="closeCart(false)">${_sdT('Découvrir la boutique','Browse the shop','Utforska butiken')}</a></div>`;if(foot){foot.hidden=true;foot.style.display='';}return;}
  if(foot){foot.hidden=false;foot.style.display='';}
  let total=0;
  const rows=entries.map(([key,qty])=>{
    const ri=key.indexOf('_');const idStr=ri===-1?key:key.slice(0,ri);const variant=ri===-1?undefined:key.slice(ri+1);
    const p=_sdCartLineProd(idStr);if(!p)return'';
    const v=variant?p.variants?.find(x=>x.label===variant):p.variants?.[0];
    const base=v?v.price:p.price;const onSale=!!(window.SDPrice&&SDPrice.active(p));const eff=window.SDPrice?SDPrice.effective(base,p):base;const line=eff*qty;total+=line;
    const name=(p.name&&(p.name[LANG]||p.name.fr))||'';const nm=_sdAttr(name);
    const url=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(idStr)?sdProductUrl({name:p.name,uuid:idStr}):'';
    const price=onSale?`<span class="cart-row-price-old">${fmtPrice(base*qty)}</span><span class="cart-row-price cart-row-price--sale">${fmtPrice(line)}</span>`:`<span class="cart-row-price">${fmtPrice(line)}</span>`;
    const thumb=p.photo?`<img src="${_sdAttr(sdThumb(p.photo,300))}" alt="" width="60" height="60" loading="lazy" decoding="async">`:'';
    return`<li class="cart-row" data-key="${_sdAttr(key)}"><div class="cart-row-thumb">${thumb}</div><div class="cart-row-info"><p class="cart-row-name">${url?`<a href="${_sdAttr(url)}" onclick="closeCart(false)">${nm}</a>`:nm}</p><p class="cart-row-sub">${_sdAttr(variant||p.weight||'')}</p><div class="cart-qty" role="group" aria-label="${_sdAttr(_sdT('Quantité : ','Quantity: ','Antal: ')+name)}"><button type="button" class="cq-btn" data-cart-act="dec" aria-label="${_sdT('Retirer un','Remove one','Ta bort en')}">−</button><span class="cq-num">${qty}</span><button type="button" class="cq-btn" data-cart-act="inc" aria-label="${_sdT('Ajouter un','Add one','Lägg till en')}">+</button></div></div><div class="cart-row-side">${price}<button type="button" class="cart-del" data-cart-act="del" aria-label="${_sdAttr(_sdT('Retirer du panier : ','Remove from cart: ','Ta bort ur korgen: ')+name)}">${_sdIcons.close}</button></div></li>`;
  }).join('');
  const fr=SD_SHIP.rules(false),eu=SD_SHIP.rules(true);
  const remaining=fr.threshold-total;const free=remaining<=0;const shipCost=free?0:fr.cost;
  list.innerHTML=`<ul class="cart-rows">${rows}</ul>`+_sdDrawerSuggHTML(remaining);
  const set=(id,h)=>{const el=document.getElementById(id);if(el)el.innerHTML=h;};
  set('cart-total-price',fmtPrice(total));
  set('cart-ship-price',free?`<span class="cart-ship-free">${_sdT('Offerte','Free','Gratis')}</span>`:fmtPrice(shipCost));
  set('cart-grand-total',fmtPrice(total+shipCost)+sdSekSpan(total+shipCost));
  const pct=fr.threshold>0?Math.min(100,total/fr.threshold*100):100;
  const promo=SD_SHIP.label(LANG);
  const msg=!free?_sdT(`Plus que ${fmtPrice(remaining)} pour la livraison offerte en France`,`${fmtPrice(remaining)} away from free delivery in France`,`${fmtPrice(remaining)} kvar till fri frakt i Frankrike`):(promo||_sdT('Livraison offerte en France','Free delivery in France','Fri frakt i Frankrike'));
  const euTxt=_sdT(`Europe : ${fmtPrice(eu.cost)}, offerte dès ${sdPriceShort(eu.threshold)}`,`Europe: ${fmtPrice(eu.cost)}, free from ${sdPriceShort(eu.threshold)}`,`Europa: ${fmtPrice(eu.cost)}, fri frakt från ${sdPriceShort(eu.threshold)}`);
  set('cart-ship-note',`<span class="ship-bar" aria-hidden="true"><span class="ship-bar-fill" style="width:${pct.toFixed(1)}%"></span></span><span class="cart-ship-msg${free?' is-free':''}">${_sdAttr(msg)}</span><span class="cart-ship-eu">${euTxt}</span>`);
}

/* ── Surcouches : panier, menu, recherche, suggestion, aide au paiement ──
   Une seule mécanique : le focus entre dans la surcouche puis revient au
   bouton d'origine, Tab reste piégé dedans, Échap ferme la plus haute, la
   page ne défile plus et les bulles flottantes s'effacent (sdInitA11y). */
var _sdOpeners={};
var SD_LAYERS=['sd-cart-help','suggest-modal','search-overlay','mobile-nav','cart-drawer'];
function _sdTopLayer(){for(var i=0;i<SD_LAYERS.length;i++){var el=document.getElementById(SD_LAYERS[i]);if(el&&el.classList.contains('open'))return el;}return null;}
function _sdSyncLayers(){var open=!!_sdTopLayer();document.body.style.overflow=open?'hidden':'';document.body.classList.toggle('sd-layer-open',open);}
function _sdRemember(id){var a=document.activeElement,box=document.getElementById(id);if(a&&a!==document.body&&!(box&&box.contains(a)))_sdOpeners[id]=a;}
function _sdRestore(id,fallback){var a=_sdOpeners[id];delete _sdOpeners[id];if(!a||!a.isConnected||!a.getClientRects().length)a=fallback?document.querySelector(fallback):null;if(a&&a.getClientRects().length){try{a.focus({preventScroll:true});}catch(e){}}}
function _sdFocusables(root){return[].filter.call(root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'),function(x){return x.getClientRects().length>0;});}
function _sdExpanded(sel,v){document.querySelectorAll(sel).forEach(function(b){b.setAttribute('aria-expanded',v?'true':'false');});}
function openCart(){renderCartDrawer();const d=document.getElementById('cart-drawer');if(!d)return;const was=d.classList.contains('open');if(!was)_sdRemember('cart-drawer');d.classList.add('open');document.getElementById('drawer-overlay')?.classList.add('open');_sdExpanded('.btn-cart',true);_sdSyncLayers();if(!was)setTimeout(()=>{if(d.classList.contains('open')&&!d.contains(document.activeElement))d.querySelector('.drawer-close')?.focus({preventScroll:true});},60);}
/* closeCart(false) : sans rendre le focus (on quitte la page par un lien) */
function closeCart(restore){const d=document.getElementById('cart-drawer');const was=!!(d&&d.classList.contains('open'));d?.classList.remove('open');document.getElementById('drawer-overlay')?.classList.remove('open');_sdExpanded('.btn-cart',false);_sdSyncLayers();const n=document.getElementById('drawer-note');if(n)n.textContent='';if(was&&restore!==false)_sdRestore('cart-drawer','.btn-cart');}
function setLang(l){if(!UI[l])l='fr';LANG=l;saveLang(l);document.documentElement.lang=l;document.querySelectorAll('[data-sv]').forEach(el=>{const v=el.getAttribute('data-'+l);if(v!==null)el.innerHTML=v;});document.querySelectorAll('[data-sv-ph]').forEach(el=>{const v=el.getAttribute('data-'+l+'-ph');if(v)el.placeholder=v;});document.querySelectorAll('[data-sv-aria]').forEach(el=>{const v=el.getAttribute('data-'+l+'-aria');if(v)el.setAttribute('aria-label',v);});document.querySelectorAll('.lang-btn').forEach(b=>{const on=b.dataset.lang===l;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');});renderCartDrawer();updateCartBadge();sdFillShipping();sdFillSek();_sdWaRefresh();if(l==='sv')loadSekRate();if(typeof refreshSuggestLang==='function')refreshSuggestLang();try{window.dispatchEvent(new CustomEvent('sd:lang',{detail:l}));}catch(e){}if(typeof onLangChange==='function')onLangChange(l);}
function openSearch(){const so=document.getElementById('search-overlay');if(!so)return;if(!so.classList.contains('open'))_sdRemember('search-overlay');so.classList.add('open');_sdExpanded('.btn-search',true);_sdSyncLayers();const i=document.getElementById('search-inp');doSearch(i?i.value:'');setTimeout(()=>i?.focus(),50);}
function closeSearch(){const so=document.getElementById('search-overlay');const was=!!(so&&so.classList.contains('open'));so?.classList.remove('open');_sdExpanded('.btn-search',false);_sdSyncLayers();const i=document.getElementById('search-inp');if(i)i.value='';const r=document.getElementById('search-res');if(r)r.innerHTML='';const st=document.getElementById('search-status');if(st)st.textContent='';if(was)_sdRestore('search-overlay','.btn-search');}
function handleSearchClick(e){if(e.target===document.getElementById('search-overlay'))closeSearch();}
/* Entrée : tous les résultats dans la boutique, qui lit ?q= */
function _sdSearchKey(e){if(e.key!=='Enter')return;const q=(e.target.value||'').trim();if(!q)return;e.preventDefault();location.href='/boutique?q='+encodeURIComponent(q);}
/* Une ligne de résultat = un vrai lien vers la fiche */
function _sdSearchItem(p){const out=sdIsOut(p);const sale=!out&&!!(window.SDPrice&&SDPrice.active(p));const price=out?`<span class="search-item-out">${_sdT('Épuisé','Sold out','Slut i lager')}</span>`:sale?`<span class="search-item-price-old">${fmtPrice(p.price||0)}</span> <span class="prod-price--sale">${fmtPrice(SDPrice.effective(p.price,p))}</span>`:fmtPrice(p.price||0);const cat=(p.category&&(p.category[LANG]||p.category.fr))||CAT_LABELS[p.cat]?.[LANG]||p.cat||'';const name=(p.name&&(p.name[LANG]||p.name.fr))||'';const img=p.photo?`<img class="search-thumb" src="${_sdAttr(sdThumb(p.photo,300))}" alt="" width="44" height="44" loading="lazy" decoding="async">`:'<span class="search-thumb"></span>';return`<a class="search-item" href="${_sdAttr(sdProductUrl(p))}">${img}<span class="search-item-text"><span class="search-item-name">${_sdAttr(name)}</span><span class="search-item-cat">${_sdAttr(cat)}</span></span><span class="search-item-price">${price}</span></a>`;}
/* Recherche vide : les plus demandés plutôt qu'un écran blanc. L'épicerie
   d'abord, puis un article Maison (serviettes) en dernier. */
function _sdSearchSuggestions(){const pool=(PRODUCTS||[]).filter(p=>!sdIsOut(p));const food=pool.filter(p=>p.bestseller&&!sdIsHomeProduct(p));const home=pool.filter(sdIsHomeProduct).sort((a,b)=>(b.bestseller?1:0)-(a.bestseller?1:0));const f=food.slice(0,home.length?5:6),h=home.slice(0,1);if(!f.length&&!h.length)return'';return(f.length?`<p class="search-hint">${_sdT('Les plus demandés','Popular right now','Populärt just nu')}</p>`+f.map(_sdSearchItem).join(''):'')+(h.length?`<p class="search-hint">${_sdT('Pour la table','For the table','Till bordet')}</p>`+h.map(_sdSearchItem).join(''):'');}
function doSearch(q){const res=document.getElementById('search-res');if(!res)return;q=String(q||'');const qt=q.trim();
  const st=document.getElementById('search-status');clearTimeout(window._sdSayT);const say=t=>{window._sdSayT=setTimeout(()=>{if(st)st.textContent=t;},450);};
  if(!qt){res.innerHTML=_sdSearchSuggestions();say('');return;}
  const all=(PRODUCTS||[]).filter(p=>sdMatches(p,qt)).sort((a,b)=>sdIsOut(a)-sdIsOut(b));const found=all.slice(0,6);
  if(!found.length){const qq=LANG==='fr'?`« ${_sdAttr(qt)} »`:LANG==='sv'?`”${_sdAttr(qt)}”`:`“${_sdAttr(qt)}”`;res.innerHTML=`<div class="search-empty"><p>${UI[LANG].noResults} ${qq}</p><p class="search-empty-sub">${_sdT('Un produit suédois qui manque ? Dites-le-nous.','A Swedish product missing? Let us know.','Saknar du en svensk produkt? Berätta för oss.')}</p><button type="button" class="btn-outline-dark" onclick="_sdSuggestFromSearch()">${_sdT('Suggérer ce produit','Suggest this product','Föreslå produkten')}</button></div>`+_sdSearchSuggestions();say(UI[LANG].noResults);return;}
  const n=all.length;res.innerHTML=found.map(_sdSearchItem).join('')+(n>found.length?`<a class="search-all" href="/boutique?q=${encodeURIComponent(qt)}">${_sdT(`Voir les ${n} résultats dans la boutique`,`See all ${n} results in the shop`,`Visa alla ${n} resultat i butiken`)}</a>`:'');
  say(n+' '+(n>1?_sdT('résultats','results','resultat'):_sdT('résultat','result','resultat')));}
function _sdSuggestFromSearch(){const q=(document.getElementById('search-inp')?.value||'').trim();closeSearch();if(typeof openSuggest==='function')openSuggest(q);}
/* Message court. Tiroir panier ouvert : il s'affiche en tête du tiroir
   (le toast recouvrait « Commander » sur mobile). */
function showToast(msg){const d=document.getElementById('cart-drawer');const n=document.getElementById('drawer-note');if(d&&n&&d.classList.contains('open')){n.textContent=msg;return;}const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),3200);}
function openMob(){const n=document.getElementById('mobile-nav');if(!n)return;_sdFillMobRayons();if(!n.classList.contains('open'))_sdRemember('mobile-nav');n.classList.add('open');n.scrollTop=0;_sdExpanded('.hamburger',true);_sdSyncLayers();setTimeout(()=>n.querySelector('.mob-close')?.focus(),30);}
function closeMob(){const n=document.getElementById('mobile-nav');if(!n||!n.classList.contains('open'))return;n.classList.remove('open');_sdExpanded('.hamburger',false);_sdSyncLayers();_sdRestore('mobile-nav','.hamburger');}

/* ── NEWSLETTER (capture email → CRM contacts, exploitable par le module Marketing) ── */
function sdNewsletterSubscribe(email){
  var base=(typeof SD_API_URL!=='undefined'&&SD_API_URL)?SD_API_URL:'https://admin.swedishcravings.fr';
  /* La langue du site part avec l'inscription : la newsletter du jeudi arrive dans cette langue. */
  return fetch(base+'/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,lang:LANG})})
    .then(function(r){return r.ok;}).catch(function(){return false;});
}
/* Formulaire du pied de page : vrai <form> (Entrée envoie), message annoncé */
function sdFooterNlSubmit(e){
  if(e&&e.preventDefault)e.preventDefault();
  var el=document.getElementById('footer-nl-email');if(!el)return false;
  var email=(el.value||'').trim();var msg=document.getElementById('footer-nl-msg');var btn=document.getElementById('footer-nl-btn');
  var say=function(t){if(msg)msg.textContent=t;};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){el.setAttribute('aria-invalid','true');say(_sdT('Adresse e-mail invalide.','Please enter a valid email address.','Ange en giltig e-postadress.'));el.focus();return false;}
  el.removeAttribute('aria-invalid');if(btn)btn.disabled=true;say(_sdT('Inscription en cours…','Subscribing…','Registrerar…'));
  sdNewsletterSubscribe(email).then(function(ok){
    if(btn)btn.disabled=false;
    say(ok?_sdT('Merci, c’est noté !','Thanks, you’re on the list!','Tack, du är anmäld!'):_sdT('L’inscription n’a pas abouti. Réessayez dans un instant.','That didn’t work. Please try again in a moment.','Det gick inte. Försök igen om en stund.'));
    if(ok)el.value='';
  });
  return false;
}

/* Carte produit. Le nom est un vrai lien, étiré sur toute la carte (clavier,
   nouvel onglet, moteurs de recherche) ; « + » et favori restent au-dessus.
   Stock : seules les exceptions sont signalées. */
function productCardHTML(p){const name=p.name?.[LANG]||p.name?.fr||'';const bl=p.badge?getBadgeLabel(p.badge):'';const badge=bl?`<div class="prod-badge ${_sdAttr(p.badge)}">${bl}</div>`:'';const _onSale=!!(window.SDPrice&&SDPrice.active(p));const _salePrice=_onSale?SDPrice.effective(p.price,p):(p.price||0);const promoBadge=_onSale?`<div class="prod-badge badge-promo">${_sdT('Offre spéciale','Special offer','Erbjudande')}</div>`:'';const priceHtml=_onSale?`<span class="prod-price-old">${fmtPrice(p.price||0)}</span><span class="prod-price prod-price--sale">${fmtPrice(_salePrice)}</span>`:`<span class="prod-price">${fmtPrice(p.price||0)}</span>`;const origin=(p.origin&&typeof p.origin==='object')?(p.origin[LANG]||''):(p.origin||'');const addId=p.uuid?`'${_sdAttr(p.uuid)}'`:(typeof p.id==='string'?`'${_sdAttr(p.id)}'`:(+p.id||0));
  /* Poids : « 16 × 21 g » pour un lot (le « 16x » n'est plus coupé) */
  const q=sdNetQty(p.weight);const wLbl=q?q.label:String(p.weight||'').trim();const weightHtml=wLbl?`<span class="prod-weight">${_sdAttr(wLbl)}</span>`:'';
  const _tracked=p.trackStock&&p.stock!==null&&p.stock!==undefined;const _isOut=_tracked&&p.stock<=0;let stockBadge='';if(_isOut)stockBadge=`<div class="prod-stock-badge psb-out">${_sdT('Épuisé','Sold out','Slut i lager')}</div>`;else if(_tracked&&p.stock<=2)stockBadge=`<div class="prod-stock-badge psb-low">${_sdT('Stock limité','Limited stock','Begränsat lager')}</div>`;
  const addLbl=_isOut?name+' — '+_sdT('bientôt disponible','coming soon','kommer snart'):_sdT('Ajouter au panier : ','Add to cart: ','Lägg i korgen: ')+name;
  /* Catégorie réelle du back-office (comme la boutique et la recherche) */
  const cat=(p.category&&(p.category[LANG]||p.category.fr))||CAT_LABELS[p.cat]?.[LANG]||p.cat||'';
  /* Vignette redimensionnée (/media-w) au lieu de la photo d'origine */
  const set=sdThumbSet(p.photo);const img=p.photo?`<img src="${_sdAttr(sdThumb(p.photo,300))}"${set?` srcset="${_sdAttr(set)}" sizes="(max-width:600px) 50vw, (max-width:1024px) 33vw, 300px"`:''} alt="${_sdAttr(name)}" width="300" height="300" loading="lazy" decoding="async" onerror="this.style.display='none'">`:'';
  /* Plus de cœur « favori » sur les cartes : sans compte client, les favoris
     n'étaient visibles nulle part (voir toggleFavorite, gardé pour la fiche). */
  return`<div class="prod-card"><div class="prod-img">${badge}${promoBadge}${stockBadge}<div class="prod-img-inner">${img}</div><button type="button" class="prod-quick"${_isOut?' disabled':` onclick="event.stopPropagation();addToCart(${addId})"`} aria-label="${_sdAttr(addLbl)}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg></button></div><div class="prod-body"><div class="prod-cat">${_sdAttr(cat)}</div><div class="prod-name"><a class="prod-link" href="${_sdAttr(sdProductUrl(p))}">${_sdAttr(name)}</a></div><div class="prod-origin">${_sdAttr(origin)}</div><div class="prod-footer">${priceHtml}${weightHtml}</div></div></div>`;}
function getBadgeLabel(b){const m={'badge-new':{sv:'Ny',fr:'Nouveau',en:'New'},'badge-pop':{sv:'Bästsäljare',fr:'Best-seller',en:'Best-seller'},'badge-org':{sv:'Ekologisk',fr:'Bio',en:'Organic'},'badge-must':{sv:'Klassiker',fr:'Incontournable',en:'Must have'}};return m[b]?.[LANG]||'';}

var _sdIcons={
  search:'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="7.5" cy="7.5" r="5.5"/><line x1="11.5" y1="11.5" x2="17" y2="17"/></svg>',
  close:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>',
  cart:'<svg class="cart-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
};

/* ── Livraison : textes calculés depuis les réglages (SD_SHIP), jamais en dur ── */
/* Montant rond dans une langue donnée (« 29 € », « €29 », couronnes en suédois) */
function _sdShortIn(n,l){n=+n||0;var s=n%1?n.toFixed(2):String(n);return l==='en'?'€'+s:s.replace('.',',')+' €';}
/* « Livraison offerte dès 29 € en France », ou le libellé de l'opération en cours */
function sdFreeShipText(l){l=l||LANG;var lab=SD_SHIP.label(l);if(lab)return lab;var t=_sdShortIn(SD_SHIP.rules(false).threshold,l);return l==='en'?'Free delivery in France from '+t:l==='sv'?'Fri frakt i Frankrike från '+t:'Livraison offerte dès '+t+' en France';}
/* Pour les pages : <span data-sd-ship="fr-threshold">29 €</span> est recalculé
   au chargement, au changement de langue et de devise. Clés : fr-threshold,
   eu-threshold, fr-cost, eu-cost, free-fr (phrase complète), line (sdShipLine). */
function sdFillShipping(root){
  var fr=SD_SHIP.rules(false),eu=SD_SHIP.rules(true);
  var v={'fr-threshold':sdPriceShort(fr.threshold),'eu-threshold':sdPriceShort(eu.threshold),'fr-cost':fmtPrice(fr.cost),'eu-cost':fmtPrice(eu.cost),'free-fr':sdFreeShipText(LANG),'line':sdShipLine()};
  (root||document).querySelectorAll('[data-sd-ship]').forEach(function(el){var k=el.getAttribute('data-sd-ship');if(v[k]!=null)el.textContent=v[k];});
  _sdRefreshAnn();
}
/* Barre d'annonce : texte du back-office, mais le message de livraison est
   recalculé (un « dès 29€ » saisi à la main se périme quand le seuil change)
   et passe en tête : sur mobile, seul le premier message s'affiche. */
var _SD_SHIP_RX=/livraison|delivery|shipping|frakt|leverans/i;
function _sdAnnText(){var o={};['sv','fr','en'].forEach(function(l){var raw=String((SD_WL.announcement&&SD_WL.announcement[l])||'');var had=false;var segs=raw.split(/\s+·\s+/).map(function(s){return s.trim();}).filter(Boolean).filter(function(s){if(_SD_SHIP_RX.test(s)&&/\d/.test(s)){had=true;return false;}return true;});if(had||!segs.length)segs.unshift(sdFreeShipText(l));o[l]=segs.join(' · ');});return o;}
function _sdRefreshAnn(){var el=document.querySelector('#header-root .announcement');if(!el)return;var a=_sdAnnText();['sv','fr','en'].forEach(function(l){el.setAttribute('data-'+l,_sdAnn(a[l]));});el.innerHTML=_sdAnn(a[LANG]||a.fr);}

function _sdNavLinks(active,mob){
  var L=[['home','/','Hem','Accueil','Home'],['shop','/boutique','Butiken','Boutique','Shop'],['maison','/maison','Inredning','Maison','Home &amp; living'],['recipes','/recettes','Recept','Recettes','Recipes'],['about','/a-propos','Vår historia','Notre histoire','Our story'],['contact','/contact','Kontakt','Contact','Contact']];
  (window.SD_PAGES||[]).filter(function(p){return p&&p.show_in_nav&&p.slug;}).forEach(function(p){L.push([p.slug,'/page?slug='+encodeURIComponent(p.slug),_sdAttr(p.nav_label_sv||p.title_sv||''),_sdAttr(p.nav_label_fr||p.title_fr||''),_sdAttr(p.nav_label_en||p.title_en||'')]);});
  return L.map(function(x){var on=active===x[0];return'<a href="'+x[1]+'"'+(on?' class="active" aria-current="page"':'')+(mob?' onclick="closeMob()"':'')+' data-sv="'+x[2]+'" data-fr="'+x[3]+'" data-en="'+x[4]+'">'+(LANG==='sv'?x[2]:LANG==='en'?x[4]:x[3])+'</a>';}).join('');
}
function _sdLangBtns(){return[['sv','Svenska'],['fr','Français'],['en','English']].map(function(x){var on=LANG===x[0];return'<button type="button" class="lang-btn'+(on?' active':'')+'" data-lang="'+x[0]+'" lang="'+x[0]+'" aria-pressed="'+on+'" onclick="setLang(\''+x[0]+'\')">'+x[1]+'</button>';}).join('');}
/* Texte d'interface traduit : data-sv/fr/en + texte de la langue courante */
function _sdTx(sv,fr,en){return' data-sv="'+sv+'" data-fr="'+fr+'" data-en="'+en+'">'+(LANG==='sv'?sv:LANG==='en'?en:fr);}
function _sdAria(sv,fr,en){return' aria-label="'+(LANG==='sv'?sv:LANG==='en'?en:fr)+'" data-sv-aria="'+sv+'" data-fr-aria="'+fr+'" data-en-aria="'+en+'"';}

/* L'en-tête est redessiné quand la marque arrive de l'API (sd-api-client.js) :
   un panier, un menu ou une recherche ouverts le restent, focus compris. */
function _sdHeaderKeep(){
  var st={};['cart-drawer','mobile-nav','search-overlay'].forEach(function(id){var el=document.getElementById(id);if(el&&el.classList.contains('open'))st[id]=1;});
  if(!Object.keys(st).length)return;
  var a=document.activeElement,sel=null;if(a&&a.id)sel='#'+a.id;
  var q=(document.getElementById('search-inp')||{}).value||'';
  (window.queueMicrotask||setTimeout)(function(){
    Object.keys(st).forEach(function(id){var el=document.getElementById(id);if(el)el.classList.add('open');});
    if(st['cart-drawer']){document.getElementById('drawer-overlay')?.classList.add('open');_sdExpanded('.btn-cart',true);}
    if(st['mobile-nav'])_sdExpanded('.hamburger',true);
    if(st['search-overlay']){_sdExpanded('.btn-search',true);var i=document.getElementById('search-inp');if(i){i.value=q;doSearch(q);}}
    _sdSyncLayers();
    var L=_sdTopLayer();var f=sel&&document.querySelector(sel);if((!f||!L||!L.contains(f))&&L)f=L.querySelector('#search-inp,.drawer-close,.mob-close');
    if(f){try{f.focus({preventScroll:true});}catch(e){}}
  });
}

function renderHeader(activePage=''){
  _sdHeaderKeep();
  const I=_sdIcons;const ann=_sdAnnText();
  const LANGS_LBL=' role="group" aria-label="Langue · Language · Språk"';
  return `<a class="skip-link" href="${_sdAttr(location.pathname+location.search)}#contenu"${_sdTx('Hoppa till innehållet','Aller au contenu','Skip to content')}</a>`
  +`<div class="lang-bar"${LANGS_LBL}>${_sdLangBtns()}</div>`
  +`<div class="announcement" data-sv="${_sdAttr(_sdAnn(ann.sv))}" data-fr="${_sdAttr(_sdAnn(ann.fr))}" data-en="${_sdAttr(_sdAnn(ann.en))}">${_sdAnn(ann[LANG]||ann.fr)}</div>`
  +sdSeasonBannerHTML()
  +`<header><div class="nav-inner"><a href="/" class="logo"><img class="logo-mark" src="/img/sc-monogramme-96.png" alt="" width="28" height="42"><span class="logo-text"><span class="logo-main">${_sdAttr(SD_WL.brand_name)}</span><span class="logo-tag">${_sdAttr(SD_WL.brand_tagline)}</span></span></a>`
  +`<nav class="main-nav"${_sdAria('Huvudmeny','Menu principal','Main menu')}>${_sdNavLinks(activePage,false)}</nav>`
  +`<div class="nav-actions"><button type="button" class="btn-search" onclick="openSearch()"${_sdAria('Sök','Rechercher','Search')} aria-haspopup="dialog" aria-expanded="false" aria-controls="search-overlay">${I.search}</button>`
  +`<button type="button" class="btn-cart" onclick="openCart()" aria-label="${_sdT('Panier','Cart','Varukorg')}" aria-haspopup="dialog" aria-expanded="false" aria-controls="cart-drawer">${I.cart}<span class="cart-label"${_sdTx('Korg','Panier','Cart')}</span><span class="cart-badge" aria-hidden="true" hidden></span></button>`
  +`<button type="button" class="hamburger" onclick="openMob()"${_sdAria('Meny','Menu','Menu')} aria-haspopup="dialog" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div></div></header>`
  +`<div class="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true"${_sdAria('Meny','Menu','Menu')}><button type="button" class="mob-close" onclick="closeMob()"${_sdAria('Stäng menyn','Fermer le menu','Close the menu')}>${I.close}</button>`
  +`<nav class="mob-links"${_sdAria('Huvudmeny','Menu principal','Main menu')}>${_sdNavLinks(activePage,true)}</nav>`
  +`<p class="mob-section"${_sdTx('Våra avdelningar','Nos rayons','Our aisles')}</p><div class="mob-rayons" id="mob-rayons"></div>`
  +`<div class="mob-langs"${LANGS_LBL}>${_sdLangBtns()}</div></div>`
  +`<div class="search-overlay" id="search-overlay" onclick="handleSearchClick(event)" role="dialog" aria-modal="true"${_sdAria('Sök','Rechercher','Search')}><div class="search-box"><div class="search-row"><span class="search-icon-wrap">${I.search}</span>`
  +`<input type="search" id="search-inp" oninput="doSearch(this.value)" onkeydown="_sdSearchKey(event)" enterkeyhint="search" autocomplete="off" spellcheck="false" aria-controls="search-res"${_sdAria('Sök en produkt','Rechercher un produit','Search for a product')} data-sv-ph="En produkt, ett märke…" data-fr-ph="Un produit, une marque…" data-en-ph="A product, a brand…" placeholder="${_sdT('Un produit, une marque…','A product, a brand…','En produkt, ett märke…')}">`
  +`<button type="button" class="search-close" onclick="closeSearch()"${_sdAria('Stäng sökningen','Fermer la recherche','Close search')}>${I.close}</button></div>`
  +`<p class="sr-only" id="search-status" role="status" aria-live="polite"></p><div class="search-results" id="search-res"></div></div></div>`
  +`<div class="drawer-overlay" id="drawer-overlay" onclick="closeCart()"></div>`
  +`<div class="cart-drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title"><div class="drawer-head"><h2 class="drawer-title" id="cart-drawer-title"${_sdTx('Din korg','Votre panier','Your cart')}</h2><button type="button" class="drawer-close" onclick="closeCart()"${_sdAria('Stäng korgen','Fermer le panier','Close the cart')}>${I.close}</button></div>`
  +`<p class="drawer-note" id="drawer-note" role="status" aria-live="polite"></p><p class="sr-only" id="drawer-live" aria-live="polite"></p>`
  +`<div class="drawer-items" id="drawer-items-list"></div>`
  +`<div class="drawer-foot" id="drawer-footer" hidden><div class="cart-subtotal-row"><span${_sdTx('Delsumma','Sous-total','Subtotal')}</span><span id="cart-total-price">${fmtPrice(0)}</span></div>`
  +`<div class="cart-subtotal-row cart-ship-row"><span${_sdTx('Frakt (Frankrike)','Livraison (France)','Shipping (France)')}</span><span id="cart-ship-price"></span></div>`
  +`<div class="cart-subtotal-row cart-grand-row"><span>Total</span><span id="cart-grand-total"></span></div><p class="cart-free-ship" id="cart-ship-note"></p>`
  +`<button type="button" class="btn-checkout" onclick="openSnipcartCheckout()"${_sdTx('Till kassan','Commander','Checkout')}</button>`
  +`<button type="button" class="btn-keep-shopping" onclick="closeCart()"${_sdTx('Fortsätt handla','Continuer mes achats','Continue shopping')}</button></div></div>`
  +`<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>`;
}

/* Moyens de paiement affichés (pied de page + panier). Ce sont ceux
   activés dans le Dashboard Stripe : Checkout les propose seul selon
   l'appareil (Apple Pay sur Safari, Google Pay sur Chrome…). Petits SVG
   en currentColor : ils prennent la couleur discrète du conteneur. */
function sdPayLogos(cls){
  var T=function(x,txt,w,it){return '<text x="'+x+'" y="10.5" font-family="Arial,Helvetica,sans-serif" font-size="10.5" font-weight="700"'+(it?' font-style="italic"':'')+' fill="currentColor"'+(w?' text-anchor="middle"':'')+'>'+txt+'</text>';};
  var L=[
    ['CB','<svg viewBox="0 0 20 14" height="12">'+T(10,'CB',1)+'</svg>'],
    ['Visa','<svg viewBox="0 0 30 14" height="12">'+T(15,'VISA',1,1)+'</svg>'],
    ['Mastercard','<svg viewBox="0 0 22 14" height="12"><circle cx="8" cy="7" r="6" fill="currentColor" opacity=".6"/><circle cx="14" cy="7" r="6" fill="currentColor" opacity=".35"/></svg>'],
    ['Apple Pay','<svg viewBox="0 0 34 14" height="12"><path transform="translate(0 1) scale(.5)" fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>'+T(13,'Pay')+'</svg>'],
    ['Google Pay','<svg viewBox="0 0 34 14" height="12">'+T(0,'G')+T(10,'Pay')+'</svg>']
    /* PayPal : à rajouter ici dès son approbation dans Stripe (en attente au 07/10/2026) :
       ['PayPal','<svg viewBox="0 0 38 14" height="12">'+T(19,'PayPal',1,1)+'</svg>'] */
  ];
  return L.map(function(l){return '<span class="'+cls+'" role="img" aria-label="'+l[0]+'" title="'+l[0]+'">'+l[1]+'</span>';}).join('');
}

/* Présentation de repli quand le back-office n'en fournit pas (footer_desc_*) */
var SD_FOOTER_DESC={
  fr:'Épicerie suédoise en ligne : bonbons, chocolat, fika et épicerie salée, importés de Suède et livrés en France et en Europe.',
  en:'An online Swedish grocery: sweets, chocolate, fika and savoury staples, imported from Sweden and delivered across France and Europe.',
  sv:'Svensk speceributik på nätet: godis, choklad, fika och skafferivaror, importerade från Sverige och levererade i Frankrike och Europa.'
};
/* Texte du back-office en trois langues : échappé deux fois dans data-*
   (setLang le remet en innerHTML), une fois dans le contenu. */
function _sdTri(tag,o,cls){var e=function(s){return _sdAttr(_sdAttr(s));};return'<'+tag+(cls?' class="'+cls+'"':'')+' data-sv="'+e(o.sv)+'" data-fr="'+e(o.fr)+'" data-en="'+e(o.en)+'">'+_sdAttr(o[LANG]||o.fr)+'</'+tag+'>';}
function _sdML(o,fb){var r={};['sv','fr','en'].forEach(function(l){r[l]=(o&&o[l])||(fb&&fb[l])||'';});return r;}
function _sdFLink(href,sv,fr,en){return'<li><a href="'+href+'"'+_sdTx(sv,fr,en)+'</a></li>';}
function renderFooter(){
  const n=SD_WL.brand_name||'';const yr=new Date().getFullYear();
  const desc=_sdML(SD_WL.footer_desc,SD_FOOTER_DESC);const tag=_sdML(SD_WL.footer_tagline);
  const copy={sv:'© '+yr+' '+n+' · Alla rättigheter förbehållna',fr:'© '+yr+' '+n+' · Tous droits réservés',en:'© '+yr+' '+n+' · All rights reserved'};
  const soc=[['instagram','Instagram','IG'],['facebook','Facebook','FB'],['pinterest','Pinterest','PIN']].filter(s=>/^https?:\/\//i.test(SD_WL[s[0]]||'')).map(s=>`<a href="${_sdAttr(SD_WL[s[0]])}" class="soc-link" target="_blank" rel="noopener" aria-label="${s[1]}">${s[2]}</a>`).join('');
  const mail=SD_WL.contact_email?`<li><a href="mailto:${_sdAttr(SD_WL.contact_email)}">${_sdAttr(SD_WL.contact_email)}</a></li>`:'';
  return`<footer><div class="footer-inner"><div class="footer-grid">`
  +`<div class="footer-logo"><a href="/" class="logo"><span class="logo-main">${_sdAttr(n)}</span><span class="logo-tag">${_sdAttr(SD_WL.brand_tagline)}</span></a>${_sdTri('p',desc)}${soc?`<div class="footer-social">${soc}</div>`:''}`
  +`<form class="footer-nl" onsubmit="return sdFooterNlSubmit(event)" novalidate><label class="footer-nl-label" for="footer-nl-email"${_sdTx('Nyhetsbrev: nyheter och erbjudanden','Newsletter : nouveautés et offres','Newsletter: new arrivals and offers')}</label>`
  +`<div class="footer-nl-row"><input id="footer-nl-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="footer-nl-msg" data-sv-ph="Din e-postadress" data-fr-ph="Votre adresse e-mail" data-en-ph="Your email address" placeholder="${_sdT('Votre adresse e-mail','Your email address','Din e-postadress')}"><button type="submit" id="footer-nl-btn" class="footer-nl-btn"${_sdTx('Prenumerera','S’inscrire','Subscribe')}</button></div>`
  +`<p id="footer-nl-msg" class="footer-nl-msg" role="status" aria-live="polite"></p>`
  +`<p class="footer-nl-legal"><span${_sdTx('Du kan avregistrera dig när som helst.','Désinscription possible à tout moment.','You can unsubscribe at any time.')}</span> <a href="/confidentialite"${_sdTx('Integritet','Confidentialité','Privacy')}</a></p></form></div>`
  +`<div class="footer-col"><h2${_sdTx('Butiken','La boutique','Shop')}</h2><ul>`
  +_sdFLink('/boutique','Hela butiken','Toute la boutique','Whole shop')
  +_sdFLink('/bonbons-suedois','Godis','Bonbons suédois','Swedish sweets')
  +_sdFLink('/boutique?rayon=chocolat','Choklad','Chocolat','Chocolate')
  +_sdFLink('/olw','OLW dippmix','Dips OLW','OLW dips')
  +_sdFLink('/ahlgrens-bilar','Ahlgrens Bilar','Ahlgrens Bilar','Ahlgrens Bilar')
  +_sdFLink('/boutique?rayon=epices','Kryddor','Épices &amp; aromates','Spices')
  +_sdFLink('/boutique?rayon=patisserie-basics','Baka &amp; fika','Bake &amp; Fika','Bake &amp; Fika')
  +_sdFLink('/maison','Inredning','Maison','Home &amp; living')
  +_sdFLink('/recettes','Recept','Recettes','Recipes')
  +`</ul></div><div class="footer-col"><h2${_sdTx('Kundservice','Service','Service')}</h2><ul>`
  +_sdFLink('/livraison','Leverans','Livraison','Delivery')
  +_sdFLink('/faq','Vanliga frågor','FAQ','FAQ')
  +_sdFLink('/compte','Min beställning','Ma commande','My order')
  +_sdFLink('/cgv','Allmänna villkor','CGV','Terms of sale')
  +`<li><button type="button" onclick="openSuggest()" aria-haspopup="dialog"${_sdTx('Föreslå en produkt','Suggérer un produit','Suggest a product')}</button></li>`
  +`</ul></div><div class="footer-col"><h2${_sdTx('Kontakt','Contact','Contact')}</h2><ul>${mail}`
  +_sdFLink('/a-propos','Vår historia','Notre histoire','Our story')
  +_sdFLink('/contact','Kontakta oss','Nous contacter','Contact us')
  +_sdFLink('/mentions-legales','Rättsliga uppgifter','Mentions légales','Legal notice')
  +_sdFLink('/confidentialite','Integritetspolicy','Confidentialité','Privacy')
  +`<li><button type="button" onclick="window.sdCookieSettings&amp;&amp;sdCookieSettings()">Cookies</button></li>`
  +`</ul><p class="footer-origin">SE · FR</p></div></div>`
  +`<div class="footer-bottom">${_sdTri('p',copy)}<div class="pay-badges" role="group"${_sdAria('Godkända betalningssätt','Moyens de paiement acceptés','Accepted payment methods')}>${sdPayLogos('pay-badge')}</div>${tag[LANG]?_sdTri('p',tag):''}</div></div></footer>`;
}

/* ── Bulle WhatsApp flottante (contact direct Victoria) ─────────────
   Présente sur toutes les pages. Une invitation discrète à l'arrivée (deux
   halos), puis immobile. Elle s'efface au-dessus du premier écran de
   l'accueil, quand une surcouche est ouverte et en bas de page, et se
   soulève au-dessus de la barre d'achat collante (styles : style.css). */
var SD_WA_NUM='33625536443';
var SD_WA_SVG='<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.13 1.6 5.93L4 29l8.24-1.56a12 12 0 0 0 3.8.62h.01c6.63 0 12.03-5.4 12.03-12.03C28.08 8.4 22.68 3 16.04 3zm7.05 17.1c-.3.83-1.74 1.6-2.4 1.66-.64.06-1.24.29-4.18-.87-3.53-1.39-5.8-4.98-5.98-5.21-.17-.24-1.44-1.92-1.44-3.66s.91-2.6 1.24-2.95c.3-.33.66-.41.88-.41l.63.01c.2 0 .47-.08.74.56.3.71 1.01 2.46 1.1 2.64.09.18.15.39.03.62-.12.24-.18.39-.35.6-.18.21-.37.47-.53.63-.18.18-.36.37-.16.72.2.35.9 1.48 1.93 2.4 1.33 1.18 2.44 1.55 2.79 1.73.35.18.55.15.76-.09.21-.24.87-1.02 1.1-1.37.24-.35.47-.29.79-.17.32.12 2.05.97 2.4 1.15.35.18.58.26.66.41.09.15.09.83-.21 1.66z"/></svg>';
function _sdWaHref(text){return'https://wa.me/'+SD_WA_NUM+'?text='+encodeURIComponent(text||_sdT('Bonjour Victoria, j’ai une question.','Hello Victoria, I have a question.','Hej Victoria, jag har en fråga.'));}
function _sdWaRefresh(){var a=document.getElementById('sd-wa-bubble');if(!a)return;var lbl=_sdT('Écrire à Victoria sur WhatsApp','Message Victoria on WhatsApp','Skriv till Victoria på WhatsApp');a.href=_sdWaHref();a.title=lbl;a.setAttribute('aria-label',lbl+' '+_sdT('(nouvelle fenêtre)','(opens in a new window)','(öppnas i ett nytt fönster)'));}
function renderWhatsAppBubble(){
  if(document.getElementById('sd-wa-bubble'))return;
  var a=document.createElement('a');a.id='sd-wa-bubble';a.className='sd-fab';
  a.target='_blank';a.rel='noopener';a.innerHTML=SD_WA_SVG;
  document.body.appendChild(a);_sdWaRefresh();
}

/* ── Panier non validé : message d'aide + WhatsApp Victoria ────────────
   Quand le client RESSORT de Stripe sans avoir payé (il est renvoyé sur le
   panier, panier encore plein), on propose un coup de main en direct via
   WhatsApp pour l'aider à finaliser. Une seule fois par session, jamais si
   le panier est vide. Déclenchement : voir initCartHelp(). */
function _sdCartCount(){ try{ return Object.values(cart).reduce(function(a,b){return a+(b||0);},0); }catch(e){ return 0; } }
function renderCartHelpModal(){
  if(document.getElementById('sd-cart-help'))return;
  var T={
    title:{fr:'Une question avant de valider ?',en:'A question before you check out?',sv:'En fråga innan du betalar?'},
    body:{fr:'Un doute sur un produit, la livraison ou le paiement ? Victoria vous répond en direct sur WhatsApp et vous aide à finaliser votre commande.',en:'Unsure about a product, delivery or payment? Victoria replies directly on WhatsApp and helps you complete your order.',sv:'Osäker på en produkt, leveransen eller betalningen? Victoria svarar direkt på WhatsApp och hjälper dig att slutföra beställningen.'},
    cta:{fr:'Écrire à Victoria sur WhatsApp',en:'Message Victoria on WhatsApp',sv:'Skriv till Victoria på WhatsApp'},
    dismiss:{fr:'Non merci, je continue',en:'No thanks, continue',sv:'Nej tack, fortsätt'},
    wamsg:{fr:'Bonjour Victoria, j’ai un panier en cours sur Swedish Cravings et une petite question.',en:'Hello Victoria, I have a cart on Swedish Cravings and a quick question.',sv:'Hej Victoria, jag har en varukorg på Swedish Cravings och en liten fråga.'}
  };
  var tr=function(o){return o[LANG]||o.fr;};
  var ov=document.createElement('div');ov.id='sd-cart-help';
  ov.innerHTML='<div class="sch-card" role="dialog" aria-modal="true" aria-labelledby="sch-title" aria-describedby="sch-body">'
    +'<button type="button" id="sch-close" class="sch-close" aria-label="'+_sdT('Fermer','Close','Stäng')+'">'+_sdIcons.close+'</button>'
    +'<h2 class="sch-title" id="sch-title">'+tr(T.title)+'</h2>'
    +'<p class="sch-body" id="sch-body">'+tr(T.body)+'</p>'
    +'<a class="sch-cta" href="'+_sdAttr(_sdWaHref(tr(T.wamsg)))+'" target="_blank" rel="noopener">'+SD_WA_SVG+'<span>'+tr(T.cta)+'</span></a>'
    +'<button type="button" class="sch-dismiss">'+tr(T.dismiss)+'</button>'
    +'</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){ if(e.target===ov) closeCartHelp(); });
  ov.querySelector('#sch-close').addEventListener('click',closeCartHelp);
  ov.querySelector('.sch-dismiss').addEventListener('click',closeCartHelp);
  ov.querySelector('.sch-cta').addEventListener('click',function(){ setTimeout(closeCartHelp,100); });
}
function openCartHelp(){renderCartHelpModal();var m=document.getElementById('sd-cart-help');if(!m||m.classList.contains('open'))return;_sdRemember('sd-cart-help');m.classList.add('open');_sdSyncLayers();setTimeout(function(){var c=m.querySelector('.sch-cta');if(c)c.focus();},60);}
function closeCartHelp(){var m=document.getElementById('sd-cart-help');if(!m||!m.classList.contains('open'))return;m.classList.remove('open');_sdSyncLayers();_sdRestore('sd-cart-help');}
var _schShown=false;
function _schMaybeShow(){
  if(_schShown)return;
  try{ if(sessionStorage.getItem('sd_cart_help_shown')) return; }catch(e){}
  if(_sdCartCount()<=0) return;            // rien dans le panier → on ne dérange pas
  _schShown=true;
  try{ sessionStorage.setItem('sd_cart_help_shown','1'); }catch(e){}
  openCartHelp();
}
function initCartHelp(){
  /* Déclencheur : le client RESSORT de Stripe sans avoir payé. Stripe le
     renvoie alors sur le panier (cancel_url = panier.html) avec son panier
     encore plein → c'est LE moment pour proposer de l'aide. Le repère
     `sd_from_stripe` est posé juste avant le départ vers Stripe (panier.html).
     On ne déclenche jamais à l'aller, ni sur la page de confirmation. */
  if(/success/i.test(location.pathname)){ try{ sessionStorage.removeItem('sd_from_stripe'); }catch(e){} return; }
  var fromStripe=false;
  try{ fromStripe = sessionStorage.getItem('sd_from_stripe')==='1'; }catch(e){}
  if(!fromStripe && /stripe\.com/i.test(document.referrer||'')) fromStripe=true;   // filet : retour direct depuis Stripe
  if(!fromStripe) return;
  try{ sessionStorage.removeItem('sd_from_stripe'); }catch(e){}
  // Panier encore non validé → on propose Victoria. Petit délai + attente du
  // fetch produits pour être sûr que le panier est bien chargé.
  setTimeout(_schMaybeShow, 1000);
  window.addEventListener('sdapi:ready', function(){ setTimeout(_schMaybeShow, 300); });
}
/* Bandeaux saisonniers datés (date de Paris). Rendus DANS renderHeader :
   l'en-tête est redessiné quand la marque arrive, un élément inséré à côté
   serait effacé. Chacun se retire seul après sa date de fin. */
var SD_SEASONS=[
  {until:'2026-10-04',href:'/recette-kanelbullar',
   fr:'4 octobre, Kanelbullens dag : le sucre perlé pour vos kanelbullar est là · Voir la recette',
   sv:'4 oktober, Kanelbullens dag: pärlsocker till dina kanelbullar · Se receptet',
   en:'4 October, Cinnamon Bun Day: pearl sugar for your kanelbullar is here · See the recipe'}
];
function _sdToday(){try{return new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Paris'});}catch(e){return new Date().toISOString().slice(0,10);}}
function sdSeasonBannerHTML(){var t=_sdToday();var s=SD_SEASONS.filter(function(x){return(!x.from||t>=x.from)&&t<=x.until;})[0];if(!s)return'';return'<a id="sd-season" class="sd-season" href="'+_sdAttr(s.href)+'" data-sv="'+_sdAttr(s.sv)+'" data-fr="'+_sdAttr(s.fr)+'" data-en="'+_sdAttr(s.en)+'">'+_sdAttr(s[LANG]||s.fr)+'</a>';}
function initPage(activePage){window._activePage=activePage;document.body.classList.add('js-ready');var _hr=document.getElementById('header-root');var _fr=document.getElementById('footer-root');if(_hr)_hr.innerHTML=renderHeader(activePage);if(_fr)_fr.innerHTML=renderFooter();if(SD_WL._ready){if(_hr)_hr.classList.add('wl-ready');if(_fr)_fr.classList.add('wl-ready');}setLang(LANG);updateCartBadge();renderCartDrawer();if(LANG==='sv')loadSekRate();initScrollReveal();initHeaderShrink();renderSuggestionWidget();renderWhatsAppBubble();initCartHelp();/* Marque dans le titre : on n'y touche que si elle n'y est pas déjà, sans jamais couper le titre SEO */if(SD_WL.brand_name&&document.title.indexOf(SD_WL.brand_name)===-1){document.title=document.title.replace(/([|—–])[^|—–]*$/,'$1 '+SD_WL.brand_name);const _m=document.querySelector('meta[property="og:title"]');if(_m)_m.setAttribute('content',document.title);}sdInitA11y();}

/* Annonce « A · B · C » découpée en messages : sur mobile, seul le premier
   s'affiche, sur une ligne (voir .ann-seg dans style.css). */
function _sdAnn(txt){return String(txt||'').split(/\s+·\s+/).filter(Boolean).map(function(s,i){return(i?"<span class='ann-sep'> · </span>":'')+"<span class='ann-seg'>"+_sdAttr(s)+'</span>';}).join('');}

/* Rayons réels de la boutique (catégories de l'admin, hors maison), du plus
   fourni au moins fourni. Mêmes règles que js/catalog-v3.js : les box ont
   leur propre section en tête de la boutique et ne comptent pas dans leur rayon. */
/* Rayons réels de la boutique (hors Maison et box). count = produits
   disponibles : un « 25 au choix » qui comptait 5 bonbons épuisés promettait
   ce qu'on ne pouvait pas vendre. photo = un produit disponible du rayon,
   best-seller d'abord, pour illustrer la tuile. */
function _sdShopRayons(){var excl={'art-de-la-table':1,'maison-deco':1};var m={};(window.PRODUCTS||[]).forEach(function(p){var c=p&&p.category;if(!c||!c.slug||excl[c.slug])return;if((p.tags||[]).indexOf('box')>-1||/^box\b/i.test((p.name&&p.name.fr)||''))return;if(!m[c.slug])m[c.slug]={slug:c.slug,label:c,count:0,total:0,photo:'',best:false};var r=m[c.slug];r.total++;if(sdIsOut(p))return;r.count++;if(p.photo&&(!r.photo||(p.bestseller&&!r.best))){r.photo=p.photo;r.best=!!p.bestseller;}});return Object.keys(m).map(function(k){return m[k];}).filter(function(r){return r.count>0;}).sort(function(a,b){return b.count-a.count;});}
function _sdRayonUrl(slug){return '/boutique?rayon='+encodeURIComponent(slug);}
function _sdFillMobRayons(){var box=document.getElementById('mob-rayons');if(!box)return;box.innerHTML='<a href="'+_sdRayonUrl('box')+'" onclick="closeMob()">'+_sdT('Nos box','Gift boxes','Presentlådor')+'</a>'+_sdShopRayons().slice(0,6).map(function(r){return'<a href="'+_sdRayonUrl(r.slug)+'" onclick="closeMob()">'+_sdAttr(r.label[LANG]||r.label.fr)+'</a>';}).join('');}

/* Clavier et lecteurs d'écran, communs à toutes les pages */
function _sdCartRefocus(key,act){
  var list=document.getElementById('drawer-items-list');if(!list)return;
  var row=[].filter.call(list.querySelectorAll('[data-key]'),function(r){return r.getAttribute('data-key')===key;})[0];
  var live=document.getElementById('drawer-live');var t=row&&row.querySelector('[data-cart-act="'+act+'"]');
  if(row){var n=row.querySelector('.cq-num');if(live&&n)live.textContent=_sdT('Quantité : ','Quantity: ','Antal: ')+n.textContent;if(!t)t=row.querySelector('[data-cart-act="inc"]');}
  else{if(live)live.textContent=_sdT('Article retiré du panier','Item removed from the cart','Varan har tagits bort');t=list.querySelector('[data-cart-act="del"]')||document.querySelector('#cart-drawer .drawer-close');}
  if(t){try{t.focus({preventScroll:true});}catch(e){}}
}
function sdInitA11y(){
  if(window._sdA11y)return;window._sdA11y=true;
  document.addEventListener('keydown',function(e){
    /* Échap ferme la surcouche du dessus */
    if(e.key==='Escape'){var L=_sdTopLayer();if(!L)return;var id=L.id;e.preventDefault();
      if(id==='sd-cart-help')closeCartHelp();else if(id==='suggest-modal')closeSuggest();else if(id==='search-overlay')closeSearch();else if(id==='mobile-nav')closeMob();else closeCart();return;}
    /* Tab reste dans la surcouche ouverte */
    if(e.key!=='Tab')return;var top=_sdTopLayer();if(!top)return;
    var root=top.id==='sd-cart-help'?(top.querySelector('.sch-card')||top):top;var f=_sdFocusables(root);
    if(!f.length){e.preventDefault();return;}
    var first=f[0],last=f[f.length-1],a=document.activeElement;
    if(!root.contains(a)){e.preventDefault();(e.shiftKey?last:first).focus();}
    else if(e.shiftKey&&a===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&a===last){e.preventDefault();first.focus();}
  });
  /* Tiroir panier : + / − / retirer / suggestion, par délégation (le tiroir est redessiné) */
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target:null;if(!t)return;
    var s=t.closest('[data-sugg-add]');
    if(s){var id=s.getAttribute('data-sugg-add');addToCart(id);_sdCartRefocus(id,'inc');return;}
    var b=t.closest('[data-cart-act]');if(!b)return;var row=b.closest('[data-key]');if(!row)return;
    var key=row.getAttribute('data-key'),act=b.getAttribute('data-cart-act');
    if(act==='del')removeItem(key);else changeQty(key,act==='inc'?1:-1);
    _sdCartRefocus(key,act);
  });
  /* Cible du lien d'évitement : le premier bloc de contenu après l'en-tête */
  if(!document.getElementById('contenu')){
    var n=document.getElementById('header-root');n=n&&n.nextElementSibling;
    while(n&&(n.tagName==='SCRIPT'||n.tagName==='STYLE'))n=n.nextElementSibling;
    if(n){var a=document.createElement('span');a.id='contenu';a.setAttribute('tabindex','-1');n.parentNode.insertBefore(a,n);}
  }
  /* Bulles flottantes masquées tant que le hero de l'accueil occupe l'écran */
  var hero=document.querySelector('.hero');
  if(hero&&'IntersectionObserver' in window){
    document.body.classList.add('sd-hero-visible');
    new IntersectionObserver(function(es){es.forEach(function(en){document.body.classList.toggle('sd-hero-visible',en.intersectionRatio>0.35);});},{threshold:[0,0.35,0.6,1]}).observe(hero);
  }
  /* Textes de livraison des pages (data-sd-ship) : devise, langue, réglages */
  sdFillShipping();
  window.addEventListener('sd:currency',function(){sdFillShipping();});
  window.addEventListener('sdapi:ready',function(){sdFillShipping();updateCartBadge();});
}
/* ── SCROLL REVEAL ── */
function initScrollReveal() {
  document.body.classList.add('js-ready');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    // Déjà visible → ajouter .visible immédiatement sans animation
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      obs.observe(el);
    }
  });
}

// Anime les cartes produit après render dynamique (décalage plafonné : une
// longue liste ne fait plus attendre ses dernières cartes plusieurs secondes)
function revealNew(container) {
  if (!container) return;
  container.querySelectorAll('.prod-card, .prod-list-item').forEach((el, i) => {
    el.style.animationDelay = (Math.min(i, 8) * 0.06) + 's';
    el.classList.add('prod-card-anim');
  });
}

/* ── HEADER SHRINK + BAS DE PAGE ──
   L'en-tête rétrécit sans faire sauter la page (la marge compense, voir
   style.css). L'élément est relu à chaque fois : l'en-tête est redessiné
   quand la marque arrive. En bas d'une page longue, les bulles flottantes
   s'effacent pour ne pas cacher le pied de page. */
function initHeaderShrink() {
  if (window._sdScrollInit) return; window._sdScrollInit = true;
  let ticking = false;
  const run = () => {
    const header = document.querySelector('#header-root header') || document.querySelector('header');
    if (header) header.classList.toggle('shrunk', window.scrollY > 72);
    const doc = document.documentElement;
    const long = doc.scrollHeight > window.innerHeight * 1.5;
    document.body.classList.toggle('sd-at-end', long && (window.innerHeight + window.scrollY) >= doc.scrollHeight - 160);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(run); ticking = true; } }, { passive: true });
  run();
}

/* ── STICKY ADD TO CART (product page) ──
   Visible dès que le bouton principal n'est plus à l'écran. Masquée, elle
   sort aussi de la tabulation (visibility, style.css) ; affichée, elle
   réserve sa hauteur en bas de page et les bulles passent au-dessus. */
function initStickyAtc(productName, price) {
  const bar = document.getElementById('sticky-atc');
  if (!bar) return;
  const nm = document.getElementById('sticky-atc-name'); if (nm) nm.textContent = productName || '';
  const pr = document.getElementById('sticky-atc-price'); if (pr) pr.textContent = fmtPrice(price || 0);
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', _sdT('Achat rapide', 'Quick buy', 'Snabbköp'));
  const addRow = document.querySelector('.add-row');
  if (!addRow) return;
  if (bar._sdObs) bar._sdObs.disconnect();
  const sync = (on) => {
    on = on && bar.isConnected;
    bar.classList.toggle('visible', on);
    document.body.classList.toggle('sd-atc-visible', on);
    if (on) document.documentElement.style.setProperty('--sd-atc-h', bar.offsetHeight + 'px');
  };
  const obs = new IntersectionObserver(([e]) => sync(!e.isIntersecting), { threshold: 0 });
  obs.observe(addRow);
  bar._sdObs = obs;
  if (window.ResizeObserver && !bar._sdRo) {
    bar._sdRo = new ResizeObserver(() => { if (bar.classList.contains('visible')) document.documentElement.style.setProperty('--sd-atc-h', bar.offsetHeight + 'px'); });
    bar._sdRo.observe(bar);
  }
}

/* ── MOBILE FILTER TOGGLE ── */
function toggleMobFilter() {
  const sb = document.querySelector('.sidebar');
  if (!sb) return;
  sb.classList.toggle('mob-hidden');
  const hid = sb.classList.contains('mob-hidden');
  const btn = document.querySelector('.mob-filter-btn');
  if (btn) { btn.textContent = hid ? _sdT('Afficher les filtres', 'Show filters', 'Visa filter') : _sdT('Masquer les filtres', 'Hide filters', 'Dölj filter'); btn.setAttribute('aria-expanded', hid ? 'false' : 'true'); }
}

/* ── BADGE INIT ── */
window.addEventListener('load', function() { updateCartBadge(); });
document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });

/* ── SUGGESTION WIDGET ──
   Le bouton flottant est léger ; la fenêtre (formulaire) n'est construite
   qu'à la première ouverture. Styles : css/style.css (#suggest-…).
   openSuggest('nom') pré-remplit le produit (depuis une recherche vide). */
var _suggestOpen = false;
var SD_SUGGEST_T = {
  btn:           {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
  title:         {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
  sub:           {fr:'Un produit suédois introuvable ici ? Dites-le-nous, nous ferons notre possible pour le faire venir.', sv:'Hittar du inte det du söker? Berätta för oss, vi gör vårt bästa för att ta hem det.', en:"Can't find a Swedish product here? Tell us and we'll do our best to bring it in."},
  yourInfoTitle: {fr:'Vos coordonnées', sv:'Dina uppgifter', en:'Your details'},
  customerLabel: {fr:'Votre prénom et nom', sv:'Ditt namn', en:'Your name'},
  /* Pas d'exemple de nom ni d'e-mail : un faux contenu se confond avec une saisie */
  customerPh:    {fr:'', sv:'', en:''},
  emailLabel:    {fr:'Votre e-mail', sv:'Din e-post', en:'Your email'},
  emailPh:       {fr:'', sv:'', en:''},
  productTitle:  {fr:'Le produit recherché', sv:'Produkten du söker', en:'The product you want'},
  nameLabel:     {fr:'Nom du produit', sv:'Produktnamn', en:'Product name'},
  namePh:        {fr:'Ex. : confiture d’airelles, knäckebröd…', sv:'T.ex. lingonsylt, knäckebröd…', en:'E.g. lingonberry jam, knäckebröd…'},
  descLabel:     {fr:'Description (facultatif)', sv:'Beskrivning (valfritt)', en:'Description (optional)'},
  descPh:        {fr:'Pourquoi ce produit ? Où l’avez-vous découvert ?', sv:'Varför vill du ha den? Var hittade du den?', en:'Why this product? Where did you discover it?'},
  urlLabel:      {fr:'Lien où vous l’avez vu (facultatif)', sv:'Länk där du såg den (valfritt)', en:'Link where you saw it (optional)'},
  urlPh:         {fr:'https://…', sv:'https://…', en:'https://…'},
  submit:        {fr:'Envoyer ma suggestion', sv:'Skicka mitt förslag', en:'Send my suggestion'},
  hint:          {fr:'Champs marqués * obligatoires. Nous lisons chaque suggestion avec attention.', sv:'Fält markerade med * är obligatoriska. Vi läser varje förslag noggrant.', en:'Fields marked * are required. We read every suggestion carefully.'},
  successTitle:  {fr:'Merci pour votre suggestion !', sv:'Tack för ditt förslag!', en:'Thanks for your suggestion!'},
  successSub:    {fr:'Nous en prenons note et vous recontacterons dès que ce produit est disponible.', sv:'Vi noterar det och återkommer till dig så snart produkten finns tillgänglig.', en:"We've noted it and will get back to you as soon as the product is available."},
  close:         {fr:'Fermer', sv:'Stäng', en:'Close'},
  errCustomer:   {fr:'Merci d’indiquer votre prénom et nom.', sv:'Ange ditt namn.', en:'Please enter your name.'},
  errEmail:      {fr:'Merci d’indiquer votre adresse e-mail.', sv:'Ange din e-postadress.', en:'Please enter your email address.'},
  errEmailBad:   {fr:'Cette adresse e-mail ne semble pas valide.', sv:'E-postadressen verkar inte giltig.', en:'This email address doesn’t look valid.'},
  errName:       {fr:'Merci d’indiquer le nom du produit.', sv:'Ange ett produktnamn.', en:'Please enter the product name.'},
  errSend:       {fr:'L’envoi n’a pas abouti. Réessayez dans un instant.', sv:'Det gick inte att skicka. Försök igen om en stund.', en:'Could not send. Please try again in a moment.'}
};
function _sgT(k){var o=SD_SUGGEST_T[k];return o?(o[LANG]||o.fr):'';}

function renderSuggestionWidget() {
  if (document.getElementById('suggest-widget')) return;
  var wrap = document.createElement('div');
  wrap.id = 'suggest-widget';
  wrap.innerHTML = '<button type="button" id="suggest-btn" class="sd-fab" onclick="openSuggest()" aria-haspopup="dialog" title="' + _sdAttr(_sgT('btn')) + '">'
    + '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 1.5C4.41 1.5 1.5 4.1 1.5 7.3c0 1.7.75 3.22 1.97 4.3L2.5 14.5l3.2-1.4A7.1 7.1 0 008 13.1c3.59 0 6.5-2.6 6.5-5.8S11.59 1.5 8 1.5z"/></svg>'
    + '<span id="suggest-btn-label" class="sr-only">' + _sgT('btn') + '</span></button>';
  document.body.appendChild(wrap);
}

function _sdBuildSuggest() {
  if (document.getElementById('suggest-modal')) return;
  renderSuggestionWidget();
  var w = document.getElementById('suggest-widget');
  var field = function (id, type, extra) { return '<div class="sm-field"><label class="sm-label" for="' + id + '" id="' + id + '-lbl"></label>' + (type === 'textarea' ? '<textarea id="' + id + '" rows="3"' + extra + '></textarea>' : '<input type="' + type + '" id="' + id + '"' + extra + '>') + '</div>'; };
  w.insertAdjacentHTML('beforeend',
    '<div id="suggest-overlay" onclick="closeSuggest()"></div>'
    + '<div id="suggest-modal" role="dialog" aria-modal="true" aria-labelledby="sg-title" aria-describedby="sg-sub">'
    + '<div id="suggest-form-view"><div class="sm-hero"><button type="button" class="sm-hero-close" id="sg-close" onclick="closeSuggest()">' + _sdIcons.close + '</button>'
    + '<h2 class="sm-title" id="sg-title"></h2><p class="sm-sub" id="sg-sub"></p></div>'
    + '<form class="sm-body" onsubmit="event.preventDefault();submitSuggestion();" novalidate>'
    + '<p class="sm-section-title" id="sg-your-info-title"></p>'
    + '<div class="sm-row">' + field('sg-customer', 'text', ' maxlength="80" autocomplete="name" required') + field('sg-email', 'email', ' autocomplete="email" inputmode="email" required') + '</div>'
    + '<hr class="sm-divider"><p class="sm-section-title" id="sg-product-title"></p>'
    + field('sg-name', 'text', ' maxlength="120" required') + field('sg-desc', 'textarea', ' maxlength="400"') + field('sg-url', 'url', ' inputmode="url" autocomplete="url"')
    + '<p class="sm-error" id="sg-error" role="alert"></p>'
    + '<button type="submit" class="sm-submit" id="sg-submit"></button><p class="sm-hint" id="sg-hint"></p></form></div>'
    + '<div id="suggest-success-view" hidden><div class="sm-success"><h2 class="sm-success-title" id="sg-ok-title" tabindex="-1"></h2><p class="sm-success-sub" id="sg-ok-sub"></p>'
    + '<button type="button" class="btn-outline-dark" id="sg-ok-close" onclick="closeSuggest()"></button></div></div></div>');
  refreshSuggestLang();
}

function openSuggest(prefill) {
  _sdBuildSuggest();
  var m = document.getElementById('suggest-modal'); if (!m) return;
  if (!m.classList.contains('open')) _sdRemember('suggest-modal');
  _suggestOpen = true;
  refreshSuggestLang();
  document.getElementById('suggest-form-view').hidden = false;
  document.getElementById('suggest-success-view').hidden = true;
  ['sg-customer','sg-email','sg-name'].forEach(function(id){ var el = document.getElementById(id); if (el) el.removeAttribute('aria-invalid'); });
  var er = document.getElementById('sg-error'); if (er) er.textContent = '';
  var sb = document.getElementById('sg-submit'); if (sb) sb.disabled = false;
  if (typeof prefill === 'string' && prefill.trim()) { var pn = document.getElementById('sg-name'); if (pn && !pn.value) pn.value = prefill.trim().slice(0, 120); }
  document.getElementById('suggest-overlay').classList.add('open');
  m.classList.add('open');
  _sdSyncLayers();
  setTimeout(function() { var n = document.getElementById('sg-customer'); if (n) n.focus(); }, 60);
}

function closeSuggest() {
  _suggestOpen = false;
  var m = document.getElementById('suggest-modal'); var was = !!(m && m.classList.contains('open'));
  var o = document.getElementById('suggest-overlay'); if (o) o.classList.remove('open');
  if (m) m.classList.remove('open');
  _sdSyncLayers();
  if (was) _sdRestore('suggest-modal');
}

function refreshSuggestLang() {
  var lb = document.getElementById('suggest-btn-label'); if (lb) lb.textContent = _sgT('btn');
  var bt = document.getElementById('suggest-btn'); if (bt) bt.title = _sgT('btn');
  if (!document.getElementById('suggest-modal')) return;
  var txt = {'sg-title':'title','sg-sub':'sub','sg-your-info-title':'yourInfoTitle','sg-product-title':'productTitle','sg-desc-lbl':'descLabel','sg-url-lbl':'urlLabel','sg-submit':'submit','sg-hint':'hint','sg-ok-title':'successTitle','sg-ok-sub':'successSub','sg-ok-close':'close'};
  Object.keys(txt).forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = _sgT(txt[id]); });
  [['sg-customer-lbl','customerLabel'],['sg-email-lbl','emailLabel'],['sg-name-lbl','nameLabel']].forEach(function(x) {
    var el = document.getElementById(x[0]); if (el) el.innerHTML = _sdAttr(_sgT(x[1])) + ' <span class="req" aria-hidden="true">*</span>';
  });
  [['sg-customer','customerPh'],['sg-email','emailPh'],['sg-name','namePh'],['sg-desc','descPh'],['sg-url','urlPh']].forEach(function(x) {
    var el = document.getElementById(x[0]); if (el) el.placeholder = _sgT(x[1]);
  });
  var c = document.getElementById('sg-close'); if (c) c.setAttribute('aria-label', _sgT('close'));
}

async function submitSuggestion() {
  var customerEl = document.getElementById('sg-customer');
  var emailEl    = document.getElementById('sg-email');
  var nameEl     = document.getElementById('sg-name');
  var descEl     = document.getElementById('sg-desc');
  var urlEl      = document.getElementById('sg-url');
  var btn        = document.getElementById('sg-submit');
  var err        = document.getElementById('sg-error');
  var customer   = customerEl ? customerEl.value.trim() : '';
  var email      = emailEl    ? emailEl.value.trim()    : '';
  var name       = nameEl     ? nameEl.value.trim()     : '';
  [customerEl, emailEl, nameEl].forEach(function(el){ if (el) el.removeAttribute('aria-invalid'); });
  var fail = function(el, k) { if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } if (err) err.textContent = _sgT(k); };
  if (!customer) return fail(customerEl, 'errCustomer');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(emailEl, email ? 'errEmailBad' : 'errEmail');
  if (!name) return fail(nameEl, 'errName');
  if (err) err.textContent = '';
  if (btn) btn.disabled = true;
  try {
    var base = (typeof SD_API_URL !== 'undefined' && SD_API_URL) ? SD_API_URL : 'https://admin.swedishcravings.fr';
    var res = await fetch(base + '/api/product-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customer,
        product_name:  name,
        description:   descEl ? descEl.value.trim() : '',
        source_url:    urlEl  ? urlEl.value.trim()  : '',
        customer_email:email,
        lang: LANG || 'fr',
      }),
    });
    if (!res.ok) throw new Error('error');
    document.getElementById('suggest-form-view').hidden = true;
    document.getElementById('suggest-success-view').hidden = false;
    [customerEl, nameEl, descEl, urlEl, emailEl].forEach(function(el){ if (el) el.value = ''; });
    if (btn) btn.disabled = false;
    var ok = document.getElementById('sg-ok-title'); if (ok) ok.focus();
  } catch(e) {
    if (err) err.textContent = _sgT('errSend');
    if (btn) btn.disabled = false;
  }
}
