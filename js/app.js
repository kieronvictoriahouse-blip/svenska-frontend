/* app.js v5 */
var PRODUCTS=[];
window._SD_STATIC=PRODUCTS.slice();

var CATS=[{id:'Épices',emoji:'🌶️'},{id:'Flocons & Céréales',emoji:'🌾'},{id:'Baies séchées',emoji:'🫐'},{id:'Sucres & Sirops',emoji:'🍯'},{id:'Thés & Tisanes',emoji:'🫖'},{id:'Farines & Graines',emoji:'🌻'},{id:'Mélanges',emoji:'🎄'},{id:'Chips & Snacks',emoji:'🍟'},{id:'Basics suédois',emoji:'🇸🇪'},{id:'Confiseries',emoji:'🍬'},{id:'Fika & Boulangerie',emoji:'🧁'}];
const CAT_LABELS={'Épices':{sv:'Épices & Aromates',fr:'Épices & Aromates',en:'Spices & Herbs'},'Flocons & Céréales':{sv:'Flocons & Céréales',fr:'Flocons & Céréales',en:'Oats & Cereals'},'Baies séchées':{sv:'Baies séchées',fr:'Baies séchées',en:'Dried berries'},'Sucres & Sirops':{sv:'Sucres & Sirops',fr:'Sucres & Sirops',en:'Sugars & Syrups'},'Thés & Tisanes':{sv:'Thés & Tisanes',fr:'Thés & Tisanes',en:'Teas & Infusions'},'Farines & Graines':{sv:'Farines & Graines',fr:'Farines & Graines',en:'Flours & Seeds'},'Mélanges':{sv:'Blandningar',fr:'Mélanges suédois',en:'Swedish blends'},'Chips & Snacks':{sv:'Chips & Snacks',fr:'Chips & Snacks',en:'Chips & Snacks'},'Basics suédois':{sv:'Svenska baser',fr:'Basics suédois',en:'Swedish basics'},'Confiseries':{sv:'Konfektyr',fr:'Confiseries',en:'Confectionery'},'Fika & Boulangerie':{sv:'Fika & Bakning',fr:'Fika & Boulangerie',en:'Fika & Baking'}};
const UI={sv:{addedCart:'Tillagd i korgen!',emptyCart:'Din korg är tom',subtotal:'Delsumma',checkout:'Beställ →',keepShopping:'Fortsätt handla',freeShip:'Fri frakt från 50€',searchPlaceholder:'Sök en krydda, ett produkt...',noResults:'Inga resultat',cartTitle:'Din korg',products:'produkter',product:'produkt',filterAll:'Alla',sortDefault:'Standard',sortPriceAsc:'Pris stigande',sortPriceDesc:'Pris fallande',sortName:'Namn A→Ö',subscribe:'Tack!'},fr:{addedCart:'Ajouté au panier !',emptyCart:'Votre panier est vide',subtotal:'Sous-total',checkout:'Commander →',keepShopping:'Continuer mes achats',freeShip:'Livraison offerte dès 50€',searchPlaceholder:'Rechercher une épice, un produit...',noResults:'Aucun résultat',cartTitle:'Votre panier',products:'produits',product:'produit',filterAll:'Tous',sortDefault:'Par défaut',sortPriceAsc:'Prix croissant',sortPriceDesc:'Prix décroissant',sortName:'Nom A→Z',subscribe:'Merci !'},en:{addedCart:'Added to cart!',emptyCart:'Your cart is empty',subtotal:'Subtotal',checkout:'Checkout →',keepShopping:'Continue shopping',freeShip:'Free delivery from €50',searchPlaceholder:'Search for a spice, product...',noResults:'No results',cartTitle:'Your cart',products:'products',product:'product',filterAll:'All',sortDefault:'Default',sortPriceAsc:'Price: low to high',sortPriceDesc:'Price: high to low',sortName:'Name A→Z',subscribe:'Thanks!'}};

window.SD_WL=(function(){var _w={};var _ok=false;try{var _r=localStorage.getItem('sd_wl_v1');if(_r){_w=JSON.parse(_r)||{};_ok=!!_w.site_name;}}catch(e){}var n=_w.site_name||'';return{brand_name:n,brand_tagline:_w.site_slogan||'',contact_email:_w.email||'',instagram:_w.instagram||'',facebook:_w.facebook||'',pinterest:_w.pinterest||'',free_shipping_threshold:_w.free_shipping_threshold||50,announcement:{sv:_w.announcement_sv||'',fr:_w.announcement_fr||'',en:_w.announcement_en||''},footer_desc:{sv:_w.footer_desc_sv||'',fr:_w.footer_desc_fr||'',en:_w.footer_desc_en||''},footer_tagline:{sv:_w.footer_tagline_sv||'',fr:_w.footer_tagline_fr||'',en:_w.footer_tagline_en||''},copyright:{sv:'© 2026 '+n+' · Alla rättigheter förbehållna',fr:'© 2026 '+n+' · Tous droits réservés',en:'© 2026 '+n+' · All rights reserved'},_ready:_ok};})();
let _favorites=(function(){try{return JSON.parse(localStorage.getItem('sd_favorites')||'[]');}catch(e){return[];}})();
function saveFavorites(){try{localStorage.setItem('sd_favorites',JSON.stringify(_favorites));}catch(e){}}
function toggleFavorite(id){const sid=String(id);const idx=_favorites.indexOf(sid);if(idx===-1){_favorites.push(sid);}else{_favorites.splice(idx,1);}saveFavorites();document.querySelectorAll('[data-fav-id="'+sid+'"]').forEach(el=>{el.classList.toggle('liked',_favorites.includes(sid));});}
let cart=(function(){var _c=JSON.parse(localStorage.getItem('sd_cart')||'{}');var _dirty=false;Object.keys(_c).forEach(function(k){if(!k||k==='NaN'||k==='undefined'||k==='null'){delete _c[k];_dirty=true;}});if(_dirty)try{localStorage.setItem('sd_cart',JSON.stringify(_c));}catch(e){}return _c;})();
let LANG=localStorage.getItem('sd_lang')||'fr';
var _sekRate=(function(){try{var r=parseFloat(sessionStorage.getItem('_sekRate'));return r>0?r:0;}catch(e){return 0;}})();
function fmtPrice(eur){if(LANG==='sv'&&_sekRate>0)return Math.round((eur||0)*_sekRate)+' kr';return '€'+(+(eur||0)).toFixed(2);}
function _doSekRefresh(){renderCartDrawer();if(typeof renderCart==='function')renderCart();document.querySelectorAll('.prod-price').forEach(function(el){var m=el.textContent.match(/€([\d.]+)/);if(m)el.textContent=Math.round(parseFloat(m[1])*_sekRate)+' kr';});var pp=document.getElementById('pdp-price');if(pp){var m=pp.textContent.match(/€([\d.]+)/);if(m)pp.textContent=Math.round(parseFloat(m[1])*_sekRate)+' kr';}var sp=document.getElementById('sticky-atc-price');if(sp){var m2=sp.textContent.match(/€([\d.]+)/);if(m2)sp.textContent=Math.round(parseFloat(m2[1])*_sekRate)+' kr';}}
function loadSekRate(){if(_sekRate>0){if(LANG==='sv')_doSekRefresh();return;}fetch('https://api.frankfurter.app/latest?from=EUR&to=SEK').then(function(r){return r.json();}).then(function(d){var rate=d&&d.rates&&d.rates.SEK;if(rate>0){_sekRate=rate;try{sessionStorage.setItem('_sekRate',String(rate));}catch(e){}if(LANG==='sv')_doSekRefresh();}}).catch(function(){});}
function saveCart(){localStorage.setItem('sd_cart',JSON.stringify(cart));}
function clearCart(){cart={};saveCart();Object.keys(localStorage).filter(function(k){return k.startsWith('sd_cart');}).forEach(function(k){localStorage.removeItem(k);});updateCartBadge();renderCartDrawer();}
function saveLang(l){localStorage.setItem('sd_lang',l);}
function addToCart(id,qty=1,variant=null){if(id===undefined||id===null||String(id)==='NaN'||String(id)==='undefined')return;const p=PRODUCTS.find(x=>x.id===id||x.uuid===id||String(x.id)===String(id))||(window._SD_STATIC||[]).find(x=>x.id===id||String(x.id)===String(id));const cid=(p&&p.uuid)?p.uuid:id;const key=variant?`${cid}_${variant}`:`${cid}`;cart[key]=(cart[key]||0)+qty;saveCart();updateCartBadge();if(p){try{const cp=JSON.parse(localStorage.getItem('sd_cart_products')||'{}');cp[String(cid)]={name:p.name,photo:p.photo,price:p.price,weight:p.weight,variants:p.variants||[],pickup_only:!!p.pickup_only};localStorage.setItem('sd_cart_products',JSON.stringify(cp));}catch(e){}const name=p.name[LANG];showToast(name.substring(0,28)+(name.length>28?'…':'')+' — '+UI[LANG].addedCart);}openCart();}
function openSnipcartCheckout(){closeCart();const here=window.location.pathname;if(!here.includes('panier')){window.location.href='panier.html';}}
function _snipAdd(){}
function changeQty(key,delta){cart[key]=(cart[key]||0)+delta;const newQty=cart[key]||0;if(newQty<=0)delete cart[key];saveCart();updateCartBadge();renderCartDrawer();}
function removeItem(key){delete cart[key];saveCart();updateCartBadge();renderCartDrawer();}
function updateCartBadge(){const total=Object.values(cart).reduce((a,b)=>a+b,0);document.querySelectorAll('.cart-badge').forEach(el=>el.textContent=total);}
function cartTotal(){return Object.entries(cart).filter(([,q])=>q>0).reduce((sum,[key,qty])=>{const _ti=key.indexOf('_');const idStr=_ti===-1?key:key.slice(0,_ti);const variant=_ti===-1?undefined:key.slice(_ti+1);const _cpt=JSON.parse(localStorage.getItem('sd_cart_products')||'{}');const p=PRODUCTS.find(x=>String(x.uuid||x.id)===idStr||x.id===parseInt(idStr))||_cpt[idStr]||(window._SD_STATIC||[]).find(x=>String(x.id)===idStr);if(!p)return sum;const v=variant?p.variants?.find(x=>x.label===variant):p.variants?.[0];return sum+(v?v.price:p.price)*qty;},0);}

function renderCartDrawer(){const list=document.getElementById('drawer-items-list');const foot=document.getElementById('drawer-footer');if(!list)return;const entries=Object.entries(cart).filter(([,q])=>q>0);if(entries.length===0){list.innerHTML=`<div class="cart-empty-msg">${UI[LANG].emptyCart}</div>`;if(foot)foot.style.display='none';return;}if(foot)foot.style.display='block';let total=0;list.innerHTML=entries.map(([key,qty])=>{const _ri=key.indexOf('_');const idStr=_ri===-1?key:key.slice(0,_ri);const variant=_ri===-1?undefined:key.slice(_ri+1);const _cpd=JSON.parse(localStorage.getItem('sd_cart_products')||'{}');const p=PRODUCTS.find(x=>String(x.uuid||x.id)===idStr||x.id===parseInt(idStr))||_cpd[idStr]||(window._SD_STATIC||[]).find(x=>String(x.id)===idStr);if(!p)return'';const v=variant?p.variants?.find(x=>x.label===variant):p.variants?.[0];const price=v?v.price:p.price;const line=price*qty;total+=line;return`<div class="cart-row"><div class="cart-row-thumb" style="background-image:url('${p.photo}')"></div><div class="cart-row-info"><div class="cart-row-name">${p.name[LANG]}</div><div class="cart-row-sub">${variant||p.weight}</div><div class="cart-qty"><button class="cq-btn" onclick="changeQty('${key}',-1)">−</button><span class="cq-num">${qty}</span><button class="cq-btn" onclick="changeQty('${key}',1)">+</button></div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;"><span class="cart-row-price">${fmtPrice(line)}</span><button class="cart-del" onclick="removeItem('${key}')">✕</button></div></div>`;}).join('');const totalEl=document.getElementById('cart-total-price');if(totalEl)totalEl.textContent=fmtPrice(total);const shipEl=document.getElementById('cart-ship-note');if(shipEl){const remaining=50-total;if(remaining>0){const pct=Math.min(100,(total/50)*100);shipEl.innerHTML=`<div class="ship-bar"><div class="ship-bar-fill" style="width:${pct}%"></div></div><span>${LANG==='fr'?`Plus que ${fmtPrice(remaining)} pour la livraison gratuite`:LANG==='en'?`${fmtPrice(remaining)} away from free delivery`:`${fmtPrice(remaining)} kvar till fri frakt`}</span>`;}else{shipEl.innerHTML=`<span style="color:var(--moss);font-weight:600;">${UI[LANG].freeShip} ✓</span>`;}}}

function openCart(){renderCartDrawer();document.getElementById('cart-drawer')?.classList.add('open');document.getElementById('drawer-overlay')?.classList.add('open');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('cart-drawer')?.classList.remove('open');document.getElementById('drawer-overlay')?.classList.remove('open');document.body.style.overflow='';}
function setLang(l){LANG=l;saveLang(l);document.documentElement.lang=l;document.querySelectorAll('[data-sv]').forEach(el=>{const v=el.getAttribute('data-'+l);if(v!==null)el.innerHTML=v;});document.querySelectorAll('[data-sv-ph]').forEach(el=>{const v=el.getAttribute('data-'+l+'-ph');if(v)el.placeholder=v;});document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));renderCartDrawer();updateCartBadge();if(l==='sv')loadSekRate();if(typeof refreshSuggestLang==='function')refreshSuggestLang();if(typeof onLangChange==='function')onLangChange(l);}
function openSearch(){document.getElementById('search-overlay')?.classList.add('open');setTimeout(()=>document.getElementById('search-inp')?.focus(),80);}
function closeSearch(){document.getElementById('search-overlay')?.classList.remove('open');const i=document.getElementById('search-inp');if(i)i.value='';document.getElementById('search-res').innerHTML='';}
function handleSearchClick(e){if(e.target===document.getElementById('search-overlay'))closeSearch();}
function doSearch(q){const res=document.getElementById('search-res');if(!res)return;if(!q.trim()){res.innerHTML='';return;}const ql=q.toLowerCase();const found=PRODUCTS.filter(p=>{const name=p.name||{};return(name.fr||'').toLowerCase().includes(ql)||(name.sv||'').toLowerCase().includes(ql)||(name.en||'').toLowerCase().includes(ql)||p.cat.toLowerCase().includes(ql)||(p.tags||[]).some(t=>t.toLowerCase().includes(ql));}).slice(0,6);if(!found.length){res.innerHTML=`<div style="padding:20px;text-align:center;font-family:var(--font-body);font-style:italic;color:var(--dust);">${UI[LANG].noResults} "${q}"</div>`;return;}res.innerHTML=found.map(p=>`<div class="search-item" onclick="closeSearch();window.location.href='produit.html?id=${p.uuid||p.id}'"><div class="search-thumb" style="background-image:url('${p.photo}')"></div><div><div class="search-item-name">${p.name[LANG]||p.name.fr||''}</div><div class="search-item-cat">${CAT_LABELS[p.cat]?.[LANG]||p.cat}</div></div><span class="search-item-price">€${(p.price||0).toFixed(2)}</span></div>`).join('');}
function showToast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2800);}
function openMob(){document.getElementById('mobile-nav')?.classList.add('open');document.body.style.overflow='hidden';}
function closeMob(){document.getElementById('mobile-nav')?.classList.remove('open');document.body.style.overflow='';}

function productCardHTML(p){const badge=p.badge?`<div class="prod-badge ${p.badge}">${getBadgeLabel(p.badge)}</div>`:'';const rating=parseFloat(p.rating)||4.5;const origin=typeof p.origin==='object'?p.origin[LANG]||'':p.origin||'';const navId=p.uuid||p.id;const addId=p.uuid?`'${p.uuid}'`:(typeof p.id==='string'?`'${p.id}'`:p.id);const isFav=_favorites.includes(String(navId));const _rawW=p.weight||'';const _cleanW=_rawW.replace(/^\d+\s*[xX×]\s*/,'').trim();const weightHtml=_cleanW?`<span class="prod-weight">${_cleanW}</span>`:'';let stockBadge='';if(p.trackStock&&p.stock!==null){if(p.stock<=0){const l={fr:'Coming soon',en:'Coming soon',sv:'Coming soon'};stockBadge=`<div class="prod-stock-badge psb-out">${l[LANG]||l.fr}</div>`;}else if(p.stock<=2){const l={fr:'Stock limité',en:'Limited stock',sv:'Begränsat'};stockBadge=`<div class="prod-stock-badge psb-low">${l[LANG]||l.fr}</div>`;}else{const l={fr:'En stock',en:'In stock',sv:'I lager'};stockBadge=`<div class="prod-stock-badge psb-ok">${l[LANG]||l.fr}</div>`;}}return`<div class="prod-card" onclick="window.location.href='produit.html?id=${navId}'"><div class="prod-img">${badge}${stockBadge}<div class="prod-img-inner"><img src="${p.photo||''}" alt="${p.name?.['fr']||''}" loading="lazy" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:contain;padding:8px;background:var(--cream);"></div><button class="prod-quick" onclick="event.stopPropagation();addToCart(${addId})" title="Ajouter"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg></button><button class="prod-wish${isFav?' liked':''}" data-fav-id="${navId}" onclick="event.stopPropagation();toggleFavorite('${navId}')"><svg width="14" height="13" viewBox="0 0 14 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 11.5C7 11.5 1 7.8 1 4a3 3 0 0 1 6 0 3 3 0 0 1 6 0c0 3.8-6 7.5-6 7.5z"/></svg></button></div><div class="prod-body"><div class="prod-cat">${CAT_LABELS[p.cat]?.[LANG]||p.cat||''}</div><div class="prod-name">${p.name?.[LANG]||''}</div><div class="prod-origin">${origin}</div><div class="prod-footer"><span class="prod-price">${fmtPrice(p.price||0)}</span>${weightHtml}</div></div></div>`;}
function getBadgeLabel(b){const m={'badge-new':{sv:'Ny',fr:'Nouveau',en:'New'},'badge-pop':{sv:'Bästsäljare',fr:'Best-seller',en:'Best-seller'},'badge-org':{sv:'Ekologisk',fr:'Bio',en:'Organic'},'badge-must':{sv:'Klassiker',fr:'Incontournable',en:'Must have'}};return m[b]?.[LANG]||'';}

function renderHeader(activePage=''){const _searchIcon='<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7.5" cy="7.5" r="5.5"/><line x1="11.5" y1="11.5" x2="17" y2="17"/></svg>';const _closeIcon='<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>';return`<div class="lang-bar"><button class="lang-btn${LANG==='sv'?' active':''}" data-lang="sv" onclick="setLang('sv')">Svenska</button><button class="lang-btn${LANG==='fr'?' active':''}" data-lang="fr" onclick="setLang('fr')">Français</button><button class="lang-btn${LANG==='en'?' active':''}" data-lang="en" onclick="setLang('en')">English</button></div><div class="announcement" data-sv="${SD_WL.announcement.sv}" data-fr="${SD_WL.announcement.fr}" data-en="${SD_WL.announcement.en}">${SD_WL.announcement[LANG]}</div><header><div class="nav-inner"><a href="index.html" class="logo"><span class="logo-main">${SD_WL.brand_name}</span><span class="logo-tag">${SD_WL.brand_tagline}</span></a><nav><a href="index.html"${activePage==='home'?' class="active"':''} data-sv="Hem" data-fr="Accueil" data-en="Home">Accueil</a><a href="boutique.html"${activePage==='shop'?' class="active"':''} data-sv="Butiken" data-fr="Boutique" data-en="Shop">Boutique</a><a href="recettes.html"${activePage==='recipes'?' class="active"':''} data-sv="Recept" data-fr="Recettes" data-en="Recipes">Recettes</a><a href="a-propos.html"${activePage==='about'?' class="active"':''} data-sv="Vår historia" data-fr="Notre histoire" data-en="Our story">Notre histoire</a><a href="contact.html"${activePage==='contact'?' class="active"':''} data-sv="Contact" data-fr="Contact" data-en="Contact">Contact</a>${(window.SD_PAGES||[]).filter(p=>p.show_in_nav).map(p=>`<a href="page.html?slug=${p.slug}"${activePage===p.slug?' class="active"':''} data-sv="${p.nav_label_sv||p.title_sv}" data-fr="${p.nav_label_fr||p.title_fr}" data-en="${p.nav_label_en||p.title_en}">${p.nav_label_fr||p.title_fr}</a>`).join('')}</nav><div class="nav-actions"><button class="btn-search" onclick="openSearch()" aria-label="Rechercher">${_searchIcon}</button><button class="btn-cart" onclick="openCart()" aria-label="Panier"><svg class="cart-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="cart-label" data-sv="Korg" data-fr="Panier" data-en="Cart">Panier</span><span class="cart-badge">${Object.values(cart).reduce((a,b)=>a+b,0)}</span></button><button class="hamburger" onclick="openMob()"><span></span><span></span><span></span></button></div></div></header><div class="mobile-nav" id="mobile-nav"><button class="mob-close" onclick="closeMob()" aria-label="Fermer">${_closeIcon}</button><a href="index.html" onclick="closeMob()" data-sv="Hem" data-fr="Accueil" data-en="Home">Accueil</a><a href="boutique.html" onclick="closeMob()" data-sv="Butiken" data-fr="Boutique" data-en="Shop">Boutique</a><a href="recettes.html" onclick="closeMob()" data-sv="Recept" data-fr="Recettes" data-en="Recipes">Recettes</a><a href="a-propos.html" onclick="closeMob()" data-sv="Vår historia" data-fr="Notre histoire" data-en="Our story">Notre histoire</a><a href="contact.html" onclick="closeMob()" data-sv="Contact" data-fr="Contact" data-en="Contact">Contact</a>${(window.SD_PAGES||[]).filter(p=>p.show_in_nav).map(p=>`<a href="page.html?slug=${p.slug}" onclick="closeMob()" data-sv="${p.nav_label_sv||p.title_sv}" data-fr="${p.nav_label_fr||p.title_fr}" data-en="${p.nav_label_en||p.title_en}">${p.nav_label_fr||p.title_fr}</a>`).join('')}</div><div class="search-overlay" id="search-overlay" onclick="handleSearchClick(event)"><div class="search-box"><div class="search-row"><span class="search-icon-wrap">${_searchIcon}</span><input type="text" id="search-inp" oninput="doSearch(this.value)" data-sv-ph="Sök..." data-fr-ph="Rechercher..." data-en-ph="Search..." placeholder="Rechercher..."><button class="search-close" onclick="closeSearch()" aria-label="Fermer">${_closeIcon}</button></div><div class="search-results" id="search-res"></div></div></div><div class="drawer-overlay" id="drawer-overlay" onclick="closeCart()"></div><div class="cart-drawer" id="cart-drawer"><div class="drawer-head"><h3 data-sv="Din korg" data-fr="Votre panier" data-en="Your cart">Votre panier</h3><button class="drawer-close" onclick="closeCart()" aria-label="Fermer">${_closeIcon}</button></div><div class="drawer-items" id="drawer-items-list"></div><div class="drawer-foot" id="drawer-footer" style="display:none;"><div class="cart-subtotal-row"><span data-sv="Delsumma" data-fr="Sous-total" data-en="Subtotal">Sous-total</span><span id="cart-total-price">€0.00</span></div><p class="cart-free-ship" id="cart-ship-note"></p><button class="btn-checkout" onclick="openSnipcartCheckout()" data-sv="Beställ →" data-fr="Commander →" data-en="Checkout →">Commander →</button><button class="btn-keep-shopping" onclick="closeCart()" data-sv="Fortsätt handla" data-fr="Continuer mes achats" data-en="Continue shopping">Continuer mes achats</button></div></div><div class="toast" id="toast"></div>`;}

function renderFooter(){return`<footer><div class="footer-inner"><div class="footer-grid"><div class="footer-logo"><a href="index.html" class="logo"><span class="logo-main">${SD_WL.brand_name}</span><span class="logo-tag">${SD_WL.brand_tagline}</span></a><p data-sv="${SD_WL.footer_desc.sv}" data-fr="${SD_WL.footer_desc.fr}" data-en="${SD_WL.footer_desc.en}">${SD_WL.footer_desc[LANG]}</p><div class="footer-social">${SD_WL.instagram?`<a href="${SD_WL.instagram}" class="soc-link" target="_blank" rel="noopener" aria-label="Instagram">IG</a>`:''}${SD_WL.facebook?`<a href="${SD_WL.facebook}" class="soc-link" target="_blank" rel="noopener" aria-label="Facebook">FB</a>`:''}${SD_WL.pinterest?`<a href="${SD_WL.pinterest}" class="soc-link" target="_blank" rel="noopener" aria-label="Pinterest">PIN</a>`:''}</div></div><div class="footer-col"><h4 data-sv="Butiken" data-fr="La boutique" data-en="Shop">La boutique</h4><ul><li><a href="boutique.html?cat=%C3%89pices" data-sv="Kryddor & Örter" data-fr="Épices & Aromates" data-en="Spices & Herbs">Épices & Aromates</a></li><li><a href="boutique.html?cat=Chips+%26+Snacks">Chips & Snacks</a></li><li><a href="boutique.html?cat=Confiseries" data-sv="Konfektyr" data-fr="Confiseries" data-en="Confectionery">Confiseries</a></li><li><a href="boutique.html?cat=Basics+su%C3%A9dois" data-sv="Svenska baser" data-fr="Basics suédois" data-en="Swedish basics">Basics suédois</a></li><li><a href="boutique.html?cat=Fika+%26+Boulangerie" data-sv="Fika & Bakning" data-fr="Fika & Boulangerie" data-en="Fika & Baking">Fika & Boulangerie</a></li><li><a href="bonbons-suedois.html" data-sv="Godis" data-fr="Bonbons suédois" data-en="Swedish candy">Bonbons suédois</a></li><li><a href="ahlgrens-bilar.html" data-sv="Ahlgrens Bilar" data-fr="Ahlgrens Bilar" data-en="Ahlgrens Bilar">Ahlgrens Bilar</a></li><li><a href="olw.html" data-sv="OLW dippmix" data-fr="Dips OLW" data-en="OLW dips">Dips OLW</a></li><li><a href="recettes.html" data-sv="Recept" data-fr="Recettes" data-en="Recipes">Recettes</a></li></ul></div><div class="footer-col"><h4 data-sv="Kundservice" data-fr="Service" data-en="Service">Service</h4><ul><li><a href="livraison.html" data-sv="Leverans & returer" data-fr="Livraison & retours" data-en="Delivery & returns">Livraison &amp; retours</a></li><li><a href="faq.html">FAQ</a></li><li><a href="contact.html" data-sv="Beställningsspårning" data-fr="Suivi commande" data-en="Order tracking">Suivi commande</a></li><li><a href="cgv.html" data-sv="Allmänna villkor" data-fr="CGV" data-en="T&Cs">CGV</a></li></ul></div><div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:${SD_WL.contact_email}">${SD_WL.contact_email}</a></li><li><a href="a-propos.html" data-sv="Vår historia" data-fr="Notre histoire" data-en="Our story">Notre histoire</a></li><li><a href="mentions-legales.html" data-sv="Rättsliga uppgifter" data-fr="Mentions légales" data-en="Legal notice">Mentions légales</a></li></ul><p class="footer-origin">SE · FR</p></div></div><div class="footer-bottom"><p data-sv="${SD_WL.copyright.sv}" data-fr="${SD_WL.copyright.fr}" data-en="${SD_WL.copyright.en}">${SD_WL.copyright[LANG]}</p><div class="pay-badges"><span class="pay-badge">VISA</span><span class="pay-badge">MASTERCARD</span></div><p data-sv="${SD_WL.footer_tagline.sv}" data-fr="${SD_WL.footer_tagline.fr}" data-en="${SD_WL.footer_tagline.en}">${SD_WL.footer_tagline[LANG]}</p></div></div></footer>`;}

function initPage(activePage){window._activePage=activePage;document.body.classList.add('js-ready');var _hr=document.getElementById('header-root');var _fr=document.getElementById('footer-root');_hr.innerHTML=renderHeader(activePage);_fr.innerHTML=renderFooter();if(SD_WL._ready){_hr.classList.add('wl-ready');_fr.classList.add('wl-ready');}setLang(LANG);updateCartBadge();renderCartDrawer();if(LANG==='sv')loadSekRate();initScrollReveal();initHeaderShrink();renderSuggestionWidget();if(SD_WL.brand_name){document.title=document.title.replace(/— .+$/,'— '+SD_WL.brand_name);const _m=document.querySelector('meta[property="og:title"]');if(_m)_m.setAttribute('content',document.title);}}

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

// Anime les cartes produit après render dynamique
function revealNew(container) {
  if (!container) return;
  container.querySelectorAll('.prod-card, .prod-list-item').forEach((el, i) => {
    el.style.animationDelay = (i * 0.07) + 's';
    el.classList.add('prod-card-anim');
  });
}

/* ── HEADER SHRINK ── */
function initHeaderShrink() {
  const header = document.querySelector('header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('shrunk', window.scrollY > 72);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── STICKY ADD TO CART (product page) ── */
function initStickyAtc(productName, price) {
  const bar = document.getElementById('sticky-atc');
  if (!bar) return;
  document.getElementById('sticky-atc-name').textContent = productName;
  document.getElementById('sticky-atc-price').textContent = fmtPrice(price || 0);

  const addRow = document.querySelector('.add-row');
  if (!addRow) return;
  const obs = new IntersectionObserver(([e]) => {
    bar.classList.toggle('visible', !e.isIntersecting);
  }, { threshold: 0 });
  obs.observe(addRow);
}

/* ── MOBILE FILTER TOGGLE ── */
function toggleMobFilter() {
  const sb = document.querySelector('.sidebar');
  if (!sb) return;
  sb.classList.toggle('mob-hidden');
  const btn = document.querySelector('.mob-filter-btn');
  if (btn) btn.textContent = sb.classList.contains('mob-hidden') ? '🔍 Afficher les filtres' : '✕ Masquer les filtres';
}

/* ── BADGE INIT ── */
console.log('[SD v4] loaded, cart keys:', Object.keys(cart).length);
window.addEventListener('load', function() { console.log('[SD v4] window.load, updating badge'); updateCartBadge(); });
document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });

/* ── SUGGESTION WIDGET ── */
var _suggestOpen = false;

function renderSuggestionWidget() {
  if (document.getElementById('suggest-widget')) return;
  var css = `
    #suggest-btn{position:fixed;bottom:28px;left:24px;z-index:800;display:flex;align-items:center;gap:8px;
      background:var(--heather,#3E5238);color:#fff;border:none;border-radius:50px;padding:11px 18px 11px 14px;
      font-family:var(--font-ui,'Jost',sans-serif);font-size:13px;font-weight:600;cursor:pointer;
      box-shadow:0 4px 18px rgba(0,0,0,0.18);transition:transform 0.18s,box-shadow 0.18s;letter-spacing:0.2px;}
    #suggest-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.22);}
    #suggest-btn svg{flex-shrink:0;}
    #suggest-overlay{position:fixed;inset:0;background:rgba(20,26,20,0.6);z-index:900;backdrop-filter:blur(4px);
      opacity:0;pointer-events:none;transition:opacity 0.26s;}
    #suggest-overlay.open{opacity:1;pointer-events:all;}
    #suggest-modal{position:fixed;top:50%;left:50%;z-index:901;width:100%;max-width:620px;max-height:92vh;
      background:var(--cream,#F6F1E9);border-radius:18px;box-shadow:0 32px 80px rgba(0,0,0,0.28);
      overflow:hidden;display:flex;flex-direction:column;
      transform:translate(-50%,-48%) scale(0.96);opacity:0;pointer-events:none;
      transition:transform 0.28s cubic-bezier(.34,1.4,.64,1),opacity 0.22s;}
    #suggest-modal.open{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:all;}
    #suggest-form-view{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;}
    #suggest-modal .sm-hero{background:var(--heather,#3E5238);padding:28px 32px 24px;position:relative;flex-shrink:0;}
    #suggest-modal .sm-hero-close{position:absolute;top:16px;right:18px;background:rgba(255,255,255,0.15);
      border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:18px;line-height:32px;text-align:center;
      cursor:pointer;transition:background 0.15s;padding:0;}
    #suggest-modal .sm-hero-close:hover{background:rgba(255,255,255,0.28);}
    #suggest-modal .sm-hero-icon{font-size:28px;margin-bottom:10px;}
    #suggest-modal .sm-title{font-family:var(--font-display,'Cormorant Garamond',Georgia,serif);font-size:26px;
      color:#fff;font-weight:600;line-height:1.2;margin-bottom:6px;}
    #suggest-modal .sm-sub{font-size:14px;color:rgba(255,255,255,0.75);font-family:var(--font-body,'Crimson Pro',Georgia,serif);line-height:1.5;}
    #suggest-modal .sm-body{padding:26px 32px 28px;overflow-y:auto;flex:1;min-height:0;}
    #suggest-modal .sm-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
    #suggest-modal .sm-field{margin-bottom:16px;}
    #suggest-modal .sm-field:last-of-type{margin-bottom:0;}
    #suggest-modal .sm-label{display:block;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;
      color:#6A7280;margin-bottom:6px;font-family:var(--font-ui,'Jost',sans-serif);}
    #suggest-modal .sm-label .req{color:var(--heather,#3E5238);}
    #suggest-modal input,#suggest-modal textarea{width:100%;box-sizing:border-box;border:1.5px solid #D8CEBC;border-radius:9px;
      padding:11px 14px;font-size:15px;font-family:var(--font-body,'Crimson Pro',Georgia,serif);color:var(--midnight,#1C2028);
      background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;resize:none;}
    #suggest-modal input:focus,#suggest-modal textarea:focus{border-color:var(--heather,#3E5238);box-shadow:0 0 0 3px rgba(62,82,56,0.1);}
    #suggest-modal input.error,#suggest-modal textarea.error{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,0.1);}
    #suggest-modal input::placeholder,#suggest-modal textarea::placeholder{color:#C4B9AB;}
    #suggest-modal .sm-divider{border:none;border-top:1px solid #E8E0D4;margin:20px 0;}
    #suggest-modal .sm-section-title{font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;
      color:#9CA3AF;font-family:var(--font-ui,'Jost',sans-serif);margin-bottom:14px;}
    #suggest-modal .sm-submit{width:100%;padding:14px;background:var(--heather,#3E5238);color:#fff;border:none;
      border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;cursor:pointer;
      font-family:var(--font-ui,'Jost',sans-serif);transition:opacity 0.15s,transform 0.15s;margin-top:20px;}
    #suggest-modal .sm-submit:hover{opacity:0.9;transform:translateY(-1px);}
    #suggest-modal .sm-submit:disabled{opacity:0.45;cursor:not-allowed;transform:none;}
    #suggest-modal .sm-hint{text-align:center;font-size:12px;color:#9CA3AF;margin-top:10px;
      font-family:var(--font-body,'Crimson Pro',Georgia,serif);}
    #suggest-modal .sm-success{padding:48px 32px;text-align:center;}
    #suggest-modal .sm-success-icon{font-size:52px;margin-bottom:16px;}
    #suggest-modal .sm-success-title{font-family:var(--font-display,'Cormorant Garamond',Georgia,serif);font-size:28px;
      color:var(--midnight,#1C2028);font-weight:600;margin-bottom:10px;}
    #suggest-modal .sm-success-sub{font-size:15px;color:#6A7280;font-family:var(--font-body,'Crimson Pro',Georgia,serif);line-height:1.6;}
    @media(max-width:600px){
      #suggest-modal{max-width:100%;max-height:100%;border-radius:0;top:0;left:0;transform:translateY(100%) scale(1);
        border-radius:18px 18px 0 0;bottom:0;top:auto;max-height:94vh;}
      #suggest-modal.open{transform:translateY(0) scale(1);}
      #suggest-modal .sm-row{grid-template-columns:1fr;}
      #suggest-modal .sm-hero{padding:22px 20px 18px;}
      #suggest-modal .sm-body{padding:20px 20px 24px;}
      #suggest-modal .sm-title{font-size:22px;}
      #suggest-btn{left:16px;bottom:16px;}
    }
    @media(max-width:768px){
      #suggest-btn{padding:0;width:52px;height:52px;border-radius:50%;justify-content:center;left:16px;bottom:16px;}
      #suggest-btn-label{display:none;}
      #suggest-btn svg{width:20px;height:20px;}
    }
  `;

  var T = {
    btn:           {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
    title:         {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
    sub:           {fr:'Un produit suédois introuvable ici ? Dites-le nous, on fera le maximum pour le sourcer.', sv:'Hittar du inte det du söker? Berätta för oss, vi gör vårt bästa för att hitta det!', en:"Can't find a Swedish product here? Tell us and we'll do our best to source it."},
    yourInfoTitle: {fr:'Vos coordonnées', sv:'Dina uppgifter', en:'Your details'},
    customerLabel: {fr:'Votre prénom & nom *', sv:'Ditt namn *', en:'Your name *'},
    customerPh:    {fr:'Marie Dupont', sv:'Anna Svensson', en:'Jane Smith'},
    emailLabel:    {fr:'Votre email *', sv:'Din e-post *', en:'Your email *'},
    emailPh:       {fr:'marie@exemple.fr', sv:'anna@exempel.se', en:'jane@example.com'},
    productTitle:  {fr:'Le produit recherché', sv:'Produkten du söker', en:'The product you want'},
    nameLabel:     {fr:'Nom du produit *', sv:'Produktnamn *', en:'Product name *'},
    namePh:        {fr:'Ex: Lingonberry jam, Knäckebröd…', sv:'T.ex. Lingonsylt, Knäckebröd…', en:'E.g. Lingonberry jam, Knäckebröd…'},
    descLabel:     {fr:'Description (optionnel)', sv:'Beskrivning (valfritt)', en:'Description (optional)'},
    descPh:        {fr:'Pourquoi ce produit ? Où l\'avez-vous découvert ?', sv:'Varför vill du ha den? Var hittade du den?', en:'Why this product? Where did you discover it?'},
    urlLabel:      {fr:'Lien où vous l\'avez vu (optionnel)', sv:'Länk där du såg den (valfritt)', en:'Link where you saw it (optional)'},
    urlPh:         {fr:'https://…', sv:'https://…', en:'https://…'},
    submit:        {fr:'Envoyer ma suggestion →', sv:'Skicka mitt förslag →', en:'Send my suggestion →'},
    hint:          {fr:'Nous lisons chaque suggestion avec attention.', sv:'Vi läser varje förslag noggrant.', en:'We read every suggestion carefully.'},
    successTitle:  {fr:'Merci pour votre suggestion !', sv:'Tack för ditt förslag!', en:'Thanks for your suggestion!'},
    successSub:    {fr:'Nous en prenons note et vous recontacterons dès que ce produit est disponible.', sv:'Vi noterar det och återkommer till dig så snart produkten finns tillgänglig.', en:"We've noted it and will get back to you as soon as the product is available."},
    errCustomer:   {fr:'Merci d\'indiquer votre prénom et nom.', sv:'Ange ditt namn.', en:'Please enter your name.'},
    errEmail:      {fr:'Merci d\'indiquer votre adresse email.', sv:'Ange din e-postadress.', en:'Please enter your email address.'},
    errName:       {fr:'Merci d\'indiquer le nom du produit.', sv:'Ange ett produktnamn.', en:'Please enter the product name.'},
    errSend:       {fr:'Erreur lors de l\'envoi. Réessayez.', sv:'Det gick inte att skicka. Försök igen.', en:'Could not send. Please try again.'},
  };

  var l = LANG || 'fr';
  var t = function(k) { return T[k][l] || T[k].fr; };

  var html = `
    <style>${css}</style>
    <button id="suggest-btn" onclick="openSuggest()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 1.5C4.41 1.5 1.5 4.1 1.5 7.3c0 1.7.75 3.22 1.97 4.3L2.5 14.5l3.2-1.4A7.1 7.1 0 008 13.1c3.59 0 6.5-2.6 6.5-5.8S11.59 1.5 8 1.5z"/>
      </svg>
      <span id="suggest-btn-label">${t('btn')}</span>
    </button>
    <div id="suggest-overlay" onclick="closeSuggest()"></div>
    <div id="suggest-modal" role="dialog" aria-modal="true">
      <div id="suggest-form-view">
        <div class="sm-hero">
          <button class="sm-hero-close" onclick="closeSuggest()" aria-label="Fermer">×</button>
          <div class="sm-hero-icon">💬</div>
          <div class="sm-title" id="sg-title">${t('title')}</div>
          <div class="sm-sub" id="sg-sub">${t('sub')}</div>
        </div>
        <div class="sm-body">
          <div class="sm-section-title" id="sg-your-info-title">${t('yourInfoTitle')}</div>
          <div class="sm-row">
            <div class="sm-field">
              <label class="sm-label" id="sg-customer-lbl">${t('customerLabel').replace('*','<span class="req">*</span>')}</label>
              <input type="text" id="sg-customer" placeholder="${t('customerPh')}" maxlength="80" autocomplete="name">
            </div>
            <div class="sm-field">
              <label class="sm-label" id="sg-email-lbl">${t('emailLabel').replace('*','<span class="req">*</span>')}</label>
              <input type="email" id="sg-email" placeholder="${t('emailPh')}" autocomplete="email">
            </div>
          </div>
          <hr class="sm-divider">
          <div class="sm-section-title" id="sg-product-title">${t('productTitle')}</div>
          <div class="sm-field">
            <label class="sm-label" id="sg-name-lbl">${t('nameLabel').replace('*','<span class="req">*</span>')}</label>
            <input type="text" id="sg-name" placeholder="${t('namePh')}" maxlength="120">
          </div>
          <div class="sm-field">
            <label class="sm-label" id="sg-desc-lbl">${t('descLabel')}</label>
            <textarea id="sg-desc" rows="3" placeholder="${t('descPh')}" maxlength="400"></textarea>
          </div>
          <div class="sm-field">
            <label class="sm-label" id="sg-url-lbl">${t('urlLabel')}</label>
            <input type="url" id="sg-url" placeholder="${t('urlPh')}">
          </div>
          <button class="sm-submit" id="sg-submit" onclick="submitSuggestion()">${t('submit')}</button>
          <div class="sm-hint" id="sg-hint">${t('hint')}</div>
        </div>
      </div>
      <div id="suggest-success-view" style="display:none">
        <div class="sm-success">
          <div class="sm-success-icon">🌿</div>
          <div class="sm-success-title" id="sg-ok-title">${t('successTitle')}</div>
          <div class="sm-success-sub" id="sg-ok-sub">${t('successSub')}</div>
        </div>
      </div>
    </div>
  `;

  var wrap = document.createElement('div');
  wrap.id = 'suggest-widget';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
}

function openSuggest() {
  _suggestOpen = true;
  refreshSuggestLang();
  document.getElementById('suggest-form-view').style.display = '';
  document.getElementById('suggest-success-view').style.display = 'none';
  ['sg-customer','sg-email','sg-name'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.classList.remove('error');
  });
  document.getElementById('suggest-overlay').classList.add('open');
  document.getElementById('suggest-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function() { var n = document.getElementById('sg-customer'); if (n) n.focus(); }, 250);
}

function closeSuggest() {
  _suggestOpen = false;
  document.getElementById('suggest-overlay').classList.remove('open');
  document.getElementById('suggest-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function refreshSuggestLang() {
  var l = LANG || 'fr';
  var T = {
    btn:           {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
    title:         {fr:'Suggérer un produit', sv:'Föreslå en produkt', en:'Suggest a product'},
    sub:           {fr:'Un produit suédois introuvable ici ? Dites-le nous, on fera le maximum pour le sourcer.', sv:'Hittar du inte det du söker? Berätta för oss, vi gör vårt bästa för att hitta det!', en:"Can't find a Swedish product here? Tell us and we'll do our best to source it."},
    yourInfoTitle: {fr:'Vos coordonnées', sv:'Dina uppgifter', en:'Your details'},
    customerLabel: {fr:'Votre prénom & nom *', sv:'Ditt namn *', en:'Your name *'},
    customerPh:    {fr:'Marie Dupont', sv:'Anna Svensson', en:'Jane Smith'},
    emailLabel:    {fr:'Votre email *', sv:'Din e-post *', en:'Your email *'},
    emailPh:       {fr:'marie@exemple.fr', sv:'anna@exempel.se', en:'jane@example.com'},
    productTitle:  {fr:'Le produit recherché', sv:'Produkten du söker', en:'The product you want'},
    nameLabel:     {fr:'Nom du produit *', sv:'Produktnamn *', en:'Product name *'},
    namePh:        {fr:'Ex: Lingonberry jam, Knäckebröd…', sv:'T.ex. Lingonsylt, Knäckebröd…', en:'E.g. Lingonberry jam, Knäckebröd…'},
    descLabel:     {fr:'Description (optionnel)', sv:'Beskrivning (valfritt)', en:'Description (optional)'},
    descPh:        {fr:'Pourquoi ce produit ? Où l\'avez-vous découvert ?', sv:'Varför vill du ha den? Var hittade du den?', en:'Why this product? Where did you discover it?'},
    urlLabel:      {fr:'Lien où vous l\'avez vu (optionnel)', sv:'Länk där du såg den (valfritt)', en:'Link where you saw it (optional)'},
    submit:        {fr:'Envoyer ma suggestion →', sv:'Skicka mitt förslag →', en:'Send my suggestion →'},
    hint:          {fr:'Nous lisons chaque suggestion avec attention.', sv:'Vi läser varje förslag noggrant.', en:'We read every suggestion carefully.'},
    successTitle:  {fr:'Merci pour votre suggestion !', sv:'Tack för ditt förslag!', en:'Thanks for your suggestion!'},
    successSub:    {fr:'Nous en prenons note et vous recontacterons dès que ce produit est disponible.', sv:'Vi noterar det och återkommer till dig så snart produkten finns tillgänglig.', en:"We've noted it and will get back to you as soon as the product is available."},
  };
  function _t(k) { return T[k][l] || T[k].fr; }
  var els = {
    'suggest-btn-label': _t('btn'),
    'sg-title':          _t('title'),
    'sg-sub':            _t('sub'),
    'sg-your-info-title':_t('yourInfoTitle'),
    'sg-product-title':  _t('productTitle'),
    'sg-desc-lbl':       _t('descLabel'),
    'sg-url-lbl':        _t('urlLabel'),
    'sg-submit':         _t('submit'),
    'sg-hint':           _t('hint'),
    'sg-ok-title':       _t('successTitle'),
    'sg-ok-sub':         _t('successSub'),
  };
  Object.keys(els).forEach(function(id) {
    var el = document.getElementById(id); if (el) el.textContent = els[id];
  });
  var lbl = function(id, key) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = _t(key).replace('*','<span class="req">*</span>');
  };
  lbl('sg-customer-lbl', 'customerLabel');
  lbl('sg-email-lbl',    'emailLabel');
  lbl('sg-name-lbl',     'nameLabel');
  var ph = function(id, key) {
    var el = document.getElementById(id); if (el) el.placeholder = T[key][l] || T[key].fr;
  };
  ph('sg-customer', 'customerPh');
  ph('sg-email',    'emailPh');
  ph('sg-name',     'namePh');
  ph('sg-desc',     'descPh');
}

async function submitSuggestion() {
  var l = LANG || 'fr';
  var customerEl = document.getElementById('sg-customer');
  var emailEl    = document.getElementById('sg-email');
  var nameEl     = document.getElementById('sg-name');
  var descEl     = document.getElementById('sg-desc');
  var urlEl      = document.getElementById('sg-url');
  var btn        = document.getElementById('sg-submit');
  var customer   = customerEl ? customerEl.value.trim() : '';
  var email      = emailEl    ? emailEl.value.trim()    : '';
  var name       = nameEl     ? nameEl.value.trim()     : '';
  var T = {
    errCustomer:{fr:'Merci d\'indiquer votre prénom et nom.', sv:'Ange ditt namn.', en:'Please enter your name.'},
    errEmail:   {fr:'Merci d\'indiquer votre adresse email.', sv:'Ange din e-postadress.', en:'Please enter your email address.'},
    errName:    {fr:'Merci d\'indiquer le nom du produit.', sv:'Ange ett produktnamn.', en:'Please enter the product name.'},
    errSend:    {fr:'Erreur lors de l\'envoi. Réessayez.', sv:'Det gick inte att skicka. Försök igen.', en:'Could not send. Please try again.'},
  };
  function _t(k) { return T[k][l] || T[k].fr; }
  [customerEl, emailEl, nameEl].forEach(function(el){ if(el) el.classList.remove('error'); });
  if (!customer) { customerEl && customerEl.classList.add('error'); showToast(_t('errCustomer')); customerEl && customerEl.focus(); return; }
  if (!email)    { emailEl    && emailEl.classList.add('error');    showToast(_t('errEmail'));    emailEl    && emailEl.focus();    return; }
  if (!name)     { nameEl     && nameEl.classList.add('error');     showToast(_t('errName'));     nameEl     && nameEl.focus();     return; }
  if (btn) btn.disabled = true;
  try {
    var res = await fetch(SD_API_URL + '/api/product-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customer,
        product_name:  name,
        description:   descEl ? descEl.value.trim() : '',
        source_url:    urlEl  ? urlEl.value.trim()  : '',
        customer_email:email,
        lang: l,
      }),
    });
    if (!res.ok) throw new Error('error');
    document.getElementById('suggest-form-view').style.display = 'none';
    document.getElementById('suggest-success-view').style.display = '';
    if (customerEl) customerEl.value = '';
    if (nameEl)     nameEl.value     = '';
    if (descEl)     descEl.value     = '';
    if (urlEl)      urlEl.value      = '';
    if (emailEl)    emailEl.value    = '';
    setTimeout(closeSuggest, 3800);
  } catch(e) {
    showToast(_t('errSend'));
    if (btn) btn.disabled = false;
  }
}
