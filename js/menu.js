/* Erriane Foods — La carte des particuliers.
   Le menu vient du client, reçu le 15 octobre 2026 (transcription fidèle dans
   clients/erriane/sources/menu-particuliers-2026-10.md). Les noms et les prix
   sont les siens, tels qu'il les a écrits.

   Deux choses à savoir avant de toucher à ce fichier :
   - Les prix de la carte sont TTC, comme ceux des coffrets. Aucune mention de
     taxe n'apparaît, et le total du panier est la somme des lignes.
   - Un particulier n'a pas de compte : le panier vit librement, et la commande
     part sur le WhatsApp du traiteur en confirmant (voir panier.js).

   Le méchoui est le produit phare demandé par le client, pour les particuliers
   comme pour les entreprises : il a son bandeau en haut de page, et il reste
   aussi dans sa rubrique, comme sur la carte papier. */


/* ---------- Les rubriques et la galerie ----------
   Massyl a demandé, le 27 octobre 2026, une carte « segmentée comme sur le site
   Yassir » : des rubriques cliquables, et une galerie de plats avec leur photo,
   plutôt que vingt-cinq lignes à la suite, qui laissaient un grand vide entre le
   nom et le prix. On affiche donc une seule rubrique à la fois, « Tout » par
   défaut, et la galerie se redessine sans recharger la page. */
var RUBRIQUE = -1;   /* -1 = toutes les rubriques */

function carteGalerie(p){
  return '<article class="plat-card' + (p.img ? '' : ' plat-card--sans-photo') + '">' +
    (p.img
      ? '<img class="plat-card__img" src="img/' + p.img + '" alt="' + esc(p.nom) + '" loading="lazy">'
      : '<span class="plat-card__img plat-card__img--vide" aria-hidden="true"></span>') +
    '<div class="plat-card__corps">' +
      '<h3>' + esc(p.nom) +
        (p.phare ? ' <span class="plat-card__flag">Produit phare</span>' : '') +
      '</h3>' +
      (p.desc ? '<p class="plat-card__desc">' + esc(p.desc) + '</p>' : '') +
      (p.portion ? '<p class="plat-card__portion">' + esc(p.portion) + '</p>' : '') +
      '<span class="plat-card__prix">' + fmt(p.prix) + '</span>' +
      '<button type="button" class="bouton bouton--accent" onclick="ouvrirQuantitePlat(\'' + p.id + '\')">Commander</button>' +
    '</div>' +
  '</article>';
}

function rubriquesHtml(){
  function puce(i, libelle){
    var on = RUBRIQUE === i;
    return '<button type="button" class="puce' + (on ? ' on' : '') + '" data-i="' + i + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
      ' onclick="choisirRubrique(' + i + ')">' + esc(libelle) + '</button>';
  }
  return '<nav class="carte-nav" aria-label="Rubriques de la carte">' +
    puce(-1, 'Tout') +
    rubriquesPlats().map(function(r, i){ return puce(i, r.nom); }).join('') +
  '</nav>';
}

function platsAffiches(){
  if(RUBRIQUE === -1) return PLATS.slice();
  var r = rubriquesPlats()[RUBRIQUE];
  return PLATS.filter(function(p){ return r && p.cat === r.cat; });
}

function rendreGalerie(){
  var zone = document.getElementById('galerie');
  if(!zone) return;
  var plats = platsAffiches();
  zone.innerHTML = '<div class="galerie">' + plats.map(carteGalerie).join('') + '</div>';
}

function choisirRubrique(i){
  RUBRIQUE = i;
  var puces = document.querySelectorAll('#menu .puce');
  for(var k = 0; k < puces.length; k++){
    var on = Number(puces[k].getAttribute('data-i')) === i;
    puces[k].classList.toggle('on', on);
    puces[k].setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  rendreGalerie();
}

/* ---------- Le choix de la quantité ----------
   Même philosophie que les coffrets : le bouton de la carte ne remplit pas le
   panier dans le dos du client, il ouvre la fenêtre où il choisit la quantité,
   voit le total, ajoute au panier ou continue ses achats. Un plat n'a pas de
   diaporama : il n'y a qu'une vue et qu'une décision, la quantité. */
var PLAT_COURANT = null;

function poserModalePlat(){
  poserModale('ov-plat',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-plat\')" aria-label="Fermer">&times;</button>' +
      '<div class="pres__album pres__album--seule" id="pl-album">' +
        '<div class="pres__pistes" id="pl-pistes"></div>' +
        '<button type="button" class="pres__fleche pres__fleche--prec" onclick="plAller(-1)" aria-label="Vue précédente">&#8249;</button>' +
        '<button type="button" class="pres__fleche pres__fleche--suiv" onclick="plAller(1)" aria-label="Vue suivante">&#8250;</button>' +
        '<span class="pres__compteur" id="pl-compteur"></span>' +
        '<div class="pres__points" id="pl-points"></div>' +
        '<p class="pres__legende" id="pl-legende"></p>' +
      '</div>' +
      '<h3 id="pl-nom"></h3>' +
      '<div class="compo__prix" id="pl-prix"></div>' +
      '<p class="pres__desc" id="pl-desc"></p>' +
      '<p class="plat-portion" id="pl-portion"></p>' +
      '<div class="cmd__qty">' +
        '<label for="pl-qty">Quantité</label>' +
        '<div class="cmd__qty-reglages">' +
          '<button type="button" class="qty-btn" onclick="qtyPlat(-10)" aria-label="Dix de moins">&minus;10</button>' +
          '<button type="button" class="qty-btn" onclick="qtyPlat(-1)" aria-label="Un de moins">&minus;</button>' +
          '<input type="number" id="pl-qty" min="1" value="1" oninput="majTotalPlat()">' +
          '<button type="button" class="qty-btn" onclick="qtyPlat(1)" aria-label="Un de plus">+</button>' +
          '<button type="button" class="qty-btn" onclick="qtyPlat(10)" aria-label="Dix de plus">+10</button>' +
        '</div>' +
      '</div>' +
      '<div class="cmd__total"><span>Total</span><b id="pl-total"></b></div>' +
      '<p class="msg-err" id="pl-err">Indiquez une quantité supérieure à zéro.</p>' +
      '<div class="pres__acts">' +
        '<button type="button" class="bouton bouton--accent bouton--large" onclick="ajouterPlatAuPanier()">Ajouter au panier</button>' +
      '</div>' +
      '<button type="button" class="lien-discret" onclick="closeOv(\'ov-plat\')">Continuer mes achats</button>' +
    '</div>');
  document.getElementById('ov-plat').setAttribute('onclick', "if(event.target===this)closeOv('ov-plat')");
}

/* Les vues d'un plat, avec leur légende. Un plat sans photo n'affiche pas
   d'album : mieux vaut rien qu'une image qui ne le représente pas. */
var PLAT_PHOTOS = [], PLAT_I = 0;
function plPeindre(){
  var pistes = document.getElementById('pl-pistes');
  if(pistes) pistes.style.transform = 'translateX(' + (-PLAT_I * 100) + '%)';
  var compteur = document.getElementById('pl-compteur');
  if(compteur) compteur.textContent = PLAT_PHOTOS.length ? (PLAT_I + 1) + ' / ' + PLAT_PHOTOS.length : '';
  var points = document.getElementById('pl-points');
  if(points){
    for(var i = 0; i < points.children.length; i++){
      points.children[i].className = 'pres__point' + (i === PLAT_I ? ' on' : '');
    }
  }
  var legende = document.getElementById('pl-legende');
  if(legende){
    var texte = (PLAT_PHOTOS[PLAT_I] && PLAT_PHOTOS[PLAT_I].legende) || '';
    legende.textContent = texte;
    voir(legende, !!texte);
  }
}
function plAller(d){
  if(PLAT_PHOTOS.length < 2) return;
  PLAT_I = (PLAT_I + d + PLAT_PHOTOS.length) % PLAT_PHOTOS.length;
  plPeindre();
}
function plAllerA(i){
  PLAT_I = i;
  plPeindre();
}

function ouvrirQuantitePlat(id){
  var p = platDe(id);
  if(!p) return;
  PLAT_COURANT = id;
  poserModalePlat();
  PLAT_PHOTOS = photosDe(p).map(function(x){
    return {src: 'img/' + x.src, legende: x.legende || ''};
  });
  PLAT_I = 0;
  var album = document.getElementById('pl-album');
  if(PLAT_PHOTOS.length){
    document.getElementById('pl-pistes').innerHTML = PLAT_PHOTOS.map(function(x, i){
      return '<img class="pres__photo" src="' + x.src + '" alt="' + esc(x.legende || (p.nom + ', vue ' + (i + 1))) + '"' +
        (i ? ' loading="lazy"' : '') + '>';
    }).join('');
    document.getElementById('pl-points').innerHTML = PLAT_PHOTOS.map(function(x, i){
      return '<button type="button" class="pres__point' + (i ? '' : ' on') + '" onclick="plAllerA(' + i + ')"' +
        ' aria-label="Vue ' + (i + 1) + '"></button>';
    }).join('');
    album.className = 'pres__album' + (PLAT_PHOTOS.length > 1 ? '' : ' pres__album--seule');
    voir(album, true);
    plPeindre();
  } else {
    document.getElementById('pl-pistes').innerHTML = '';
    document.getElementById('pl-points').innerHTML = '';
    voir(album, false);
  }
  document.getElementById('pl-nom').textContent = p.nom;
  document.getElementById('pl-prix').textContent = fmt(p.prix);
  /* La phrase et la portion n'apparaissent que si le client les a données :
     un bloc vide sous le prix ferait croire à un oubli. */
  document.getElementById('pl-desc').textContent = p.desc || '';
  voir(document.getElementById('pl-desc'), !!p.desc);
  document.getElementById('pl-portion').textContent = p.portion || '';
  voir(document.getElementById('pl-portion'), !!p.portion);
  document.getElementById('pl-qty').value = 1;
  montrerErreur('pl-err', false);
  majTotalPlat();
  openOv('ov-plat');
}

function qtyPlat(d){
  var el = document.getElementById('pl-qty');
  el.value = Math.max(1, (parseInt(el.value, 10) || 0) + d);
  majTotalPlat();
}

function majTotalPlat(){
  var p = platDe(PLAT_COURANT);
  if(!p) return;
  var q = parseInt(document.getElementById('pl-qty').value, 10) || 0;
  document.getElementById('pl-total').textContent = fmt(Math.max(0, q) * p.prix);
}

/* Même plat déjà au panier : on additionne les quantités au lieu de créer une
   deuxième ligne. Ensuite on ouvre le panier, comme après un coffret. */
function ajouterPlatAuPanier(){
  var p = platDe(PLAT_COURANT);
  if(!p) return;
  var q = parseInt(document.getElementById('pl-qty').value, 10) || 0;
  if(q < 1){ montrerErreur('pl-err', true); return; }
  montrerErreur('pl-err', false);
  var ligne = LINES.filter(function(l){ return l.cofId === p.id; })[0];
  if(ligne) ligne.qty += q;
  else LINES.push({cofId: p.id, nom: p.nom, qty: q, pu: p.prix, entree: '', viande: '', garnitures: ''});
  enregistrerPanier();
  closeOv('ov-plat');
  PLAT_COURANT = null;
  toast(q + ' &times; ' + esc(p.nom) + ' ajouté au panier');
  ouvrirPanier();
}

/* ---------- Le produit phare ---------- */
function rendrePhare(){
  var zone = document.getElementById('phare');
  var p = platDe('m-mechoui');
  if(!zone || !p) return;
  zone.innerHTML =
    '<div class="phare">' +
      '<img class="phare__img" src="img/' + p.img + '" alt="' + esc(p.nom) + '">' +
      '<div class="phare__texte">' +
        '<div class="surtitre">Le produit phare</div>' +
        '<h2>' + esc(p.nom) + '</h2>' +
        '<p class="phare__prix">' + fmt(p.prix) + '</p>' +
        '<button type="button" class="bouton bouton--accent" onclick="ouvrirQuantitePlat(\'' + p.id + '\')">Commander</button>' +
      '</div>' +
    '</div>';
}

/* ---------- La carte ---------- */
function rendreMenu(){
  var zone = document.getElementById('menu');
  if(!zone) return;
  zone.innerHTML = '<section class="section"><div class="contenu">' +
    rubriquesHtml() + '<div id="galerie"></div>' +
  '</div></section>';
  rendreGalerie();
}

document.addEventListener('DOMContentLoaded', function(){
  poserToast();
  renderBadgePanier();
  rendrePhare();
  rendreMenu();
});
