/* Erriane Foods — La carte des particuliers.
   Le menu vient du client, reçu le 15 octobre 2026 (transcription fidèle dans
   clients/erriane/sources/menu-particuliers-2026-10.md). Les noms et les prix
   sont les siens, tels qu'il les a écrits.

   Deux choses à savoir avant de toucher à ce fichier :
   - On ne sait pas encore si ces prix sont hors taxes ou TTC. La page n'affiche
     donc aucune mention de taxe et le total du panier s'arrête à la somme. Le
     jour où le client répond, c'est `ecrireTotaux` et `messageWhatsApp`
     (js/panier.js) qu'on règle, pas cette page.
   - Un particulier n'a pas de compte : le panier vit librement, et la commande
     part sur le WhatsApp du traiteur en confirmant (voir panier.js).

   Le méchoui est le produit phare demandé par le client, pour les particuliers
   comme pour les entreprises : il a son bandeau en haut de page, et il reste
   aussi dans sa rubrique, comme sur la carte papier. */

var MENU_PARTICULIERS = [
  { cat: 'Entrées froides', plats: [
    { id: 'm-cesar',      nom: 'Salade César',                 prix: 600, img: 'menu/salade-cesar.jpg' },
    { id: 'm-variee',     nom: 'Salade variée',                prix: 400, img: 'menu/salade-variee.jpg' },
    { id: 'm-parisienne', nom: 'Salade Parisienne',            prix: 450, img: 'menu/salade-parisienne.jpg' },
    { id: 'm-oeufs',      nom: 'Œufs durs à la mayonnaise',    prix: 300, img: 'menu/oeufs-durs-mayonnaise.jpg' },
    { id: 'm-laitue',     nom: 'Cœur de laitue',               prix: 250, img: 'menu/coeur-de-laitue.jpg' }
  ]},
  { cat: 'Entrées chaudes', plats: [
    /* Une seule photo pour les deux gratins, et une pour le bourek à la viande
       faute de troisième vue. À remplacer quand le client en envoie. */
    { id: 'm-gratin-poulet',  nom: 'Gratin au poulet',                prix: 500, img: 'menu/gratins.jpg' },
    { id: 'm-gratin-viande',  nom: 'Gratin à la viande hachée',       prix: 600, img: 'menu/gratins.jpg' },
    { id: 'm-bourek-3f',      nom: 'Bourek au 3 fromages (duo)',      prix: 300, img: 'menu/bourek-01.jpg' },
    { id: 'm-bourek-poulet',  nom: 'Bourek au poulet (duo)',          prix: 350, img: 'menu/bourek-02.jpg' },
    { id: 'm-bourek-viande',  nom: 'Bourek à la viande hachée (duo)', prix: 400, img: 'menu/bourek-01.jpg' }
  ]},
  { cat: 'Plats de résistance, viande rouge', plats: [
    { id: 'm-roti-veau',   nom: 'Rôti de veau',              prix: 1300, img: 'menu/roti-veau.jpg' },
    { id: 'm-saute-veau',  nom: 'Sauté de veau',             prix: 1500, img: 'menu/saute-veau.jpg' },
    /* Le plat est resté sans photo jusqu'au 27 octobre : le fichier du client
       s'appelait « Émincé de veau en sauce » et n'avait jamais été rangé, alors
       qu'il était bien dans le dossier qu'il a envoyé (Massyl l'a fait
       remarquer). Tous les plats de la carte ont donc leur propre vue. */
    { id: 'm-emince-veau', nom: 'Émincé de veau à la crème', prix: 1400, img: 'menu/emince-veau.jpg' },
    { id: 'm-mechoui',     nom: 'Méchoui d\'agneau (1/2 épaule)', prix: 3000, img: 'menu/mechoui.jpg', phare: true }
  ]},
  { cat: 'Plats de résistance, viande blanche', plats: [
    { id: 'm-supreme',   nom: 'Suprême de poulet aux champignons frais', prix: 1000, img: 'menu/supreme-poulet.jpg' },
    { id: 'm-escalope',  nom: 'Escalope de dinde grillée',               prix: 800,  img: 'menu/escalope-dinde.jpg' },
    { id: 'm-cuisse',    nom: 'Cuisse de poulet farcie à la mozzarella', prix: 900,  img: 'menu/cuisse-poulet-mozzarella.jpg' },
    { id: 'm-roti-dinde', nom: 'Rôti de dinde',                          prix: 1000, img: 'menu/roti-dinde.jpg' }
  ]},
  { cat: 'Pâtes', plats: [
    { id: 'm-spaghetti',    nom: 'Spaghetti bolognaise',    prix: 700, img: 'menu/spaghetti-bolognaise.jpg' },
    { id: 'm-tagliatelles', nom: 'Tagliatelles au poulet',  prix: 700, img: 'menu/tagliatelles-poulet.jpg' },
    { id: 'm-lasagnes',     nom: 'Lasagnes à la viande hachée', prix: 700, img: 'menu/lasagnes.jpg' },
    { id: 'm-penne',        nom: 'Pennés Arrabiatta',       prix: 600, img: 'menu/penne-arrabiatta.jpg' }
  ]},
  { cat: 'Desserts', plats: [
    { id: 'm-mousse',    nom: 'Mousse au chocolat noir', prix: 250, img: 'menu/mousse-chocolat.jpg' },
    { id: 'm-fondant',   nom: 'Fondant au chocolat',     prix: 300, img: 'menu/fondant-chocolat.jpg' },
    { id: 'm-tiramisu',  nom: 'Tiramisu',                prix: 350, img: 'menu/tiramisu.jpg' }
  ]}
];

function platDe(id){
  var trouve = null;
  MENU_PARTICULIERS.forEach(function(s){
    s.plats.forEach(function(p){ if(p.id === id) trouve = p; });
  });
  return trouve;
}

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
    MENU_PARTICULIERS.map(function(s, i){ return puce(i, s.cat); }).join('') +
  '</nav>';
}

function platsAffiches(){
  if(RUBRIQUE === -1){
    var tous = [];
    MENU_PARTICULIERS.forEach(function(s){ tous = tous.concat(s.plats); });
    return tous;
  }
  return MENU_PARTICULIERS[RUBRIQUE] ? MENU_PARTICULIERS[RUBRIQUE].plats : [];
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
      '<div id="pl-vue"></div>' +
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

function ouvrirQuantitePlat(id){
  var p = platDe(id);
  if(!p) return;
  PLAT_COURANT = id;
  poserModalePlat();
  var vue = document.getElementById('pl-vue');
  vue.innerHTML = p.img
    ? '<img class="plat-vue" src="img/' + p.img + '" alt="' + esc(p.nom) + '">'
    : '';
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
