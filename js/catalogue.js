/* Erriane Foods — Catalogue et commande.
   Affiche les packs sur les pages et ouvre la fenêtre d'un pack : sa
   présentation, ce qu'il contient, et le choix de la quantité, tout dans la même
   fenêtre. Un pack sans prix passe par WhatsApp : on ne montre pas un prix qu'on
   n'a pas.

   Une seule fenêtre et un seul bouton sur la carte, décidé par Massyl le
   2 octobre 2026. Avant, deux boutons ouvraient deux fenêtres dont l'une menait
   à l'autre : la présentation était belle, et le client qui appuyait sur
   « Commander » ne la voyait jamais. */

/* ---------- Affichage des packs ---------- */
function cartePack(c){
  /* Le prix de la carte est nu : « 1 000 DA / coffret » (Massyl, 2 octobre 2026).
     Le mot « hors taxes » reste là où le client paie vraiment : la ligne du total
     dans la fenêtre du coffret, le panier, la confirmation, le message WhatsApp
     et l'espace du traiteur. */
  var prix = c.prix
    ? '<div class="pack-card__prix">' + fmt(c.prix) + ' <small>/ coffret</small></div>'
    : '<div class="pack-card__prix pack-card__prix--demande">Sur demande</div>';

  /* Un coffret sans prix ne se commande pas : son bouton annonce qu'il montre le
     coffret, et la fenêtre porte alors « Demander un devis » vers WhatsApp. */
  var actions = c.prix
    ? '<button type="button" class="bouton bouton--accent" onclick="ouvrirComposition(\'' + c.id + '\')">Commander</button>'
    : '<button type="button" class="bouton bouton--secondaire" onclick="ouvrirComposition(\'' + c.id + '\')">Voir le coffret</button>';

  return '<article class="pack-card">' +
    (c.flag ? '<span class="pack-card__flag">' + esc(c.flag) + '</span>' : '') +
    '<img class="pack-card__img" src="' + cofImg(c) + '" alt="' + esc(c.nom) + '" loading="lazy">' +
    '<div class="pack-card__corps">' +
      '<h3>' + esc(c.nom) + '</h3>' +
      '<p class="pack-card__desc">' + esc(c.d) + '</p>' +
      prix +
      '<div class="pack-card__acts">' + actions + '</div>' +
    '</div></article>';
}

/* Remplit tous les conteneurs [data-packs] de la page.
   data-packs="entreprise" ne montre que les packs entreprise (et ceux des deux publics).
   data-cat="Pause café" restreint à une famille de packs, pour les sections. */
function renderPacks(){
  var conteneurs = document.querySelectorAll('[data-packs]');
  for(var i = 0; i < conteneurs.length; i++){
    var cible = conteneurs[i].getAttribute('data-packs');
    var cat = conteneurs[i].getAttribute('data-cat');
    var liste = COFFRETS.filter(function(c){
      if(cat && c.cat !== cat) return false;
      return cible === 'tous' || c.cible === cible || c.cible === 'les-deux';
    });
    conteneurs[i].innerHTML = liste.map(cartePack).join('');
  }
}

/* ---------- La fenêtre d'un pack ----------
   Le client ouvre un pack pour vérifier ce qu'il y a dedans avant de commander.
   Il y voit les vues réelles du pack, sa présentation, sa composition, et de quoi
   le commander : la quantité, le total et le bouton du panier. Ce qui défile est
   la partie haute ; la quantité et le bouton restent en bas, sous les yeux, même
   quand le texte est long. L'album est écrit à la main : pas de bibliothèque à
   télécharger, le site reste sans dépendance. */
var CP_PHOTOS = [], CP_I = 0, CP_GLISSE = false;

function poserModaleComposition(){
  poserModale('ov-composition',
    '<div class="ov__boite ov__boite--pack" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-composition\')" aria-label="Fermer">&times;</button>' +
      '<div class="pres">' +
        '<div class="pres__album" id="cp-album">' +
          '<div class="pres__pistes" id="cp-pistes"></div>' +
          '<button type="button" class="pres__fleche pres__fleche--prec" onclick="cpAller(-1)" aria-label="Vue précédente">&#8249;</button>' +
          '<button type="button" class="pres__fleche pres__fleche--suiv" onclick="cpAller(1)" aria-label="Vue suivante">&#8250;</button>' +
          '<span class="pres__compteur" id="cp-compteur"></span>' +
          '<div class="pres__points" id="cp-points"></div>' +
        '</div>' +
        '<div class="pres__texte">' +
          '<div class="pres__corps">' +
          '<h3 id="cp-nom"></h3>' +
          '<div class="compo__prix" id="cp-prix"></div>' +
          '<p class="pres__desc" id="cp-desc"></p>' +
          '<div id="cp-bloc-compo">' +
            '<h4 class="pres__titre">Ce qu\'il y a dedans</h4>' +
            '<ul class="compo__liste" id="cp-liste"></ul>' +
          '</div>' +
          '</div>' +

          /* Le bas de la fenêtre : ce qui ne défile pas, et ce sur quoi on
             appuie. Pas de prix répété ici, il est déjà en haut de la colonne. */
          '<div class="pres__achat">' +
            '<div class="cmd__qty" id="cp-qty">' +
              '<label for="q-qty">Nombre de coffrets</label>' +
              '<div class="cmd__qty-reglages">' +
                '<button type="button" class="qty-btn" onclick="qtyDelta(-10)" aria-label="Dix de moins">&minus;10</button>' +
                '<button type="button" class="qty-btn" onclick="qtyDelta(-1)" aria-label="Un de moins">&minus;</button>' +
                '<input type="number" id="q-qty" min="1" value="10" oninput="majTotalCmd()">' +
                '<button type="button" class="qty-btn" onclick="qtyDelta(1)" aria-label="Un de plus">+</button>' +
                '<button type="button" class="qty-btn" onclick="qtyDelta(10)" aria-label="Dix de plus">+10</button>' +
              '</div>' +
            '</div>' +
            '<div class="cmd__total" id="cp-total">' +
              '<span>Total hors taxes</span><b id="q-total"></b>' +
            '</div>' +
            '<p class="msg-err" id="q-err">Indiquez une quantité supérieure à zéro.</p>' +
            '<div class="pres__acts">' +
              '<button type="button" class="bouton bouton--accent bouton--large" id="cp-commander" onclick="ajouterAuPanier()">Ajouter au panier</button>' +
              '<a class="bouton bouton--accent bouton--large" id="cp-devis" target="_blank" rel="noopener">Demander un devis</a>' +
            '</div>' +
            '<button type="button" class="lien-discret" onclick="closeOv(\'ov-composition\')">Continuer mes achats</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-composition').setAttribute('onclick', "if(event.target===this)closeOv('ov-composition')");
  poserGlissement();
}

/* On glisse l'album du doigt, comme une galerie de téléphone. Une seule fois :
   la fenêtre n'est créée qu'au premier pack ouvert. */
function poserGlissement(){
  if(CP_GLISSE) return;
  var album = document.getElementById('cp-album');
  if(!album) return;
  CP_GLISSE = true;
  var depart = null;
  album.addEventListener('touchstart', function(e){ depart = e.touches[0].clientX; }, {passive:true});
  album.addEventListener('touchend', function(e){
    if(depart === null) return;
    var dx = e.changedTouches[0].clientX - depart;
    depart = null;
    if(Math.abs(dx) > 40) cpAller(dx < 0 ? 1 : -1);
  });
}

function cpAller(d){
  if(CP_PHOTOS.length < 2) return;
  CP_I = (CP_I + d + CP_PHOTOS.length) % CP_PHOTOS.length;
  cpPeindre();
}

function cpAllerA(i){
  CP_I = i;
  cpPeindre();
}

function cpPeindre(){
  document.getElementById('cp-pistes').style.transform = 'translateX(' + (-CP_I * 100) + '%)';
  document.getElementById('cp-compteur').textContent = (CP_I + 1) + ' / ' + CP_PHOTOS.length;
  var points = document.getElementById('cp-points').children;
  for(var i = 0; points && i < points.length; i++){
    points[i].className = 'pres__point' + (i === CP_I ? ' on' : '');
  }
}

function ouvrirComposition(id){
  var c = findCof(id);
  if(!c) return;
  poserModaleComposition();

  /* L'album d'abord. Un pack sans photo n'affiche pas d'album du tout : mieux
     vaut ne rien montrer qu'une image qui ne le représente pas. */
  CP_PHOTOS = (c.photos || []).map(photoPack);
  CP_I = 0;
  var album = document.getElementById('cp-album');
  var pistes = document.getElementById('cp-pistes');
  if(CP_PHOTOS.length){
    pistes.innerHTML = CP_PHOTOS.map(function(p, i){
      return '<img class="pres__photo" src="' + p + '" alt="' + esc(c.nom + ', vue ' + (i + 1)) + '"' +
        (i ? ' loading="lazy"' : '') + '>';
    }).join('');
    document.getElementById('cp-points').innerHTML = CP_PHOTOS.map(function(p, i){
      return '<button type="button" class="pres__point' + (i ? '' : ' on') + '" onclick="cpAllerA(' + i + ')"' +
        ' aria-label="Vue ' + (i + 1) + '"></button>';
    }).join('');
    album.className = 'pres__album' + (CP_PHOTOS.length > 1 ? '' : ' pres__album--seule');
    voir(album, true);
    pistes.style.transform = 'translateX(0)';
    document.getElementById('cp-compteur').textContent = '1 / ' + CP_PHOTOS.length;
  } else {
    pistes.innerHTML = '';
    document.getElementById('cp-points').innerHTML = '';
    voir(album, false);
  }
  /* Sans album, la fenêtre gardait sa moitié droite blanche et le texte se
     tassait à gauche (constaté sur le Coffret Excellence, 26 octobre 2026). La
     fenêtre se resserre donc et repasse sur une seule colonne. */
  document.querySelector('#ov-composition .ov__boite')
    .classList.toggle('ov__boite--sans-album', !CP_PHOTOS.length);

  document.getElementById('cp-nom').textContent = c.nom;
  /* La présentation annonce un prix, elle ne parle pas de taxes : le mot
     « hors taxes » alourdissait la ligne du prix (Massyl, 2 octobre 2026). La
     mention reste là où le client paie vraiment : la carte du coffret, le total
     de cette fenêtre, le panier et la confirmation. */
  document.getElementById('cp-prix').textContent = c.prix
    ? fmt(c.prix) + ' par coffret'
    : 'Tarif sur demande selon les quantités';
  /* On ne montre que ce qu'on sait. Sans composition écrite, la liste et la
     présentation n'ont rien à dire : la fenêtre garde le nom, la ligne de tarif
     et le bouton. C'est le cas des pauses café et du Lunch Bag, dont le client
     n'a pas encore donné la composition écrite. */
  var compo = c.compo || [];
  voir(document.getElementById('cp-desc'), !!c.pres);
  document.getElementById('cp-desc').textContent = c.pres || '';
  voir(document.getElementById('cp-bloc-compo'), compo.length > 0);
  document.getElementById('cp-liste').innerHTML = compo
    .map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');

  /* Un pack sans prix ne se commande pas : on demande un devis, et le bouton dit
     ce qu'il fait. La quantité et le total disparaissent alors avec lui : on ne
     propose pas un nombre de coffrets quand le prix n'est pas connu. */
  CMD_ID = c.prix ? id : null;
  voir(document.getElementById('cp-qty'), !!c.prix);
  voir(document.getElementById('cp-total'), !!c.prix);
  voir(document.getElementById('cp-commander'), !!c.prix);
  voir(document.getElementById('cp-devis'), !c.prix);
  /* L'adresse du devis se réécrit à chaque coffret, même quand le bouton reste
     caché : sans cela, le lien gardait le nom du coffret précédent, et la
     première fois qu'un pack sans prix s'ouvrait après un autre, le message
     partait avec le mauvais nom. */
  document.getElementById('cp-devis').href =
    waLink('Bonjour Erriane Foods, je souhaite un devis pour : ' + c.nom + '.');
  if(c.prix){
    /* Dix coffrets par défaut : c'est la quantité la plus fréquente chez le
       traiteur, et le client la corrige d'un geste. */
    document.getElementById('q-qty').value = 10;
    montrerErreur('q-err', false);
    majTotalCmd();
  }
  openOv('ov-composition');
}

/* ---------- Le choix de la quantité ----------
   Il vit dans la fenêtre du pack (voir plus haut). `CMD_ID` est le coffret en
   cours de commande ; il ne vaut rien pour un coffret sans prix, qui n'a ni
   quantité ni total. */
var CMD_ID = null;

function qtyDelta(d){
  var el = document.getElementById('q-qty');
  el.value = Math.max(1, (parseInt(el.value, 10) || 0) + d);
  majTotalCmd();
}

function majTotalCmd(){
  var c = findCof(CMD_ID);
  if(!c) return;
  var q = parseInt(document.getElementById('q-qty').value, 10) || 0;
  document.getElementById('q-total').textContent = fmt(q * c.prix);
}

/* Choisir une quantité ne demande aucun compte : le panier se remplit librement,
   et on ne demande qui que ce soit qu'au moment de confirmer la commande. */
function ajouterAuPanier(){
  var c = findCof(CMD_ID);
  if(!c) return;
  var q = parseInt(document.getElementById('q-qty').value, 10) || 0;
  if(q < 1){ montrerErreur('q-err', true); return; }
  montrerErreur('q-err', false);

  /* Même coffret déjà au panier : on additionne les quantités au lieu
     de créer une deuxième ligne. */
  var existante = LINES.filter(function(l){ return l.cofId === c.id; })[0];
  if(existante){
    existante.qty += q;
  } else {
    LINES.push({cofId:c.id, nom:c.nom, qty:q, pu:c.prix, entree:'', viande:'', garnitures:''});
  }
  enregistrerPanier();
  closeOv('ov-composition');
  CMD_ID = null;
  toast(q + ' &times; ' + esc(c.nom) + ' ajouté au panier');
  ouvrirPanier();
}

/* ---------- Démarrage ---------- */
document.addEventListener('DOMContentLoaded', function(){
  poserToast();
  renderPacks();
  renderCompte();

  /* Les flèches du clavier font défiler l'album, quand la présentation est
     ouverte. Échap la ferme, c'est déjà le rôle de ui.js. */
  document.addEventListener('keydown', function(e){
    var ov = document.getElementById('ov-composition');
    if(!ov || !ov.classList.contains('open')) return;
    if(e.key === 'ArrowLeft') cpAller(-1);
    else if(e.key === 'ArrowRight') cpAller(1);
  });
});
