/* Erriane Foods — Espace traiteur, onglet Catalogue.
   Le traiteur tient lui-même ce qu'il vend : il ajoute un plat, change son
   prix, choisit sa photo, le monte ou le descend dans la liste, le cache, et
   supprime ce qu'il a créé. Ce qu'il fait ici se range dans son navigateur
   (`erri_cofs`, voir data.js) et s'empile sur le catalogue écrit dans le code :
   la page du site, elle, ne change pas tant qu'il ne recharge pas.
   Le compte du traiteur, avec mot de passe, arrivera avec la base de données :
   à ce moment-là, ces changements le suivront au lieu de rester sur l'appareil. */

/* Les quatre rubriques du site. Ce sont les quatre sections de la page
   Entreprises : une cinquième rubrique n'aurait aucune section où s'afficher et
   le coffret deviendrait invisible. Une seule liste, ici, pour les deux
   endroits qui en ont besoin. */
var CAT_RUBRIQUES = ['Coffret repas', 'Pause café', 'Prestation', 'Réception'];

/* Ce que le traiteur est en train de modifier dans la fenêtre. La photo de la
   carte et les photos de présentation se choisissent avant d'enregistrer, donc
   elles vivent à part du coffret. `photos` reste à null tant qu'il n'y a pas
   touché : un pack qu'on ne change pas sur ce point garde celles du code. */
var CAT_EDITION = {id: null, img: null, photos: null};

/* Les photos de présentation, celles de l'album qu'on voit en ouvrant le pack.
   Quatre au maximum. Un pack peut n'en avoir qu'une : le site n'affiche que les
   emplacements remplis, et pas d'album du tout s'il n'y en a aucune. */
var CAT_PHOTOS_MAX = 4;

/* ---------- Lire et écrire ---------- */

/* Le coffret tel que le site le voit pour l'instant, caché compris : c'est la
   liste complète que le traiteur a sous les yeux. */
function coffretDe(id){
  return TOUS_COFFRETS.filter(function(c){ return c.id === id; })[0] || null;
}
function estCree(id){
  return (cofsChanges.__perso || []).some(function(p){ return p.id === id; });
}
/* Un changement se range par coffret. On garde ce qui était déjà là : modifier
   un prix ne doit pas effacer la photo choisie avant. */
function majCoffret(id, champs){
  var o = cofsChanges[id] || {};
  Object.keys(champs).forEach(function(k){ o[k] = champs[k]; });
  cofsChanges[id] = o;
  enregistrerCatalogue();
  reconstruireCatalogue();
}
function nombreModifies(){
  return Object.keys(cofsChanges).filter(function(k){ return k.indexOf('__') !== 0; }).length;
}

/* ---------- Le prix ---------- */
/* Un prix vide remet le coffret « sur demande » : le bouton du site ouvre alors
   WhatsApp au lieu du panier. Les prix s'écrivent hors taxes, comme sur les
   offres du client ; la TVA s'ajoute dans le panier. */
function changerPrix(id, valeur){
  var c = coffretDe(id);
  if(!c) return;
  var v = String(valeur).trim();
  var prix = v === '' ? null : Math.round(Number(v));
  if(prix !== null && (!isFinite(prix) || prix <= 0)){
    toast('Le prix doit être un nombre supérieur à zéro. Laissez vide pour « sur demande ».');
    rendreCatalogue();
    return;
  }
  majCoffret(id, {prix: prix});
  toast(prix === null
    ? '« ' + esc(c.nom) + ' » repasse sur demande.'
    : '« ' + esc(c.nom) + ' » : ' + fmt(prix) + ' hors taxes.');
  rendreCatalogue();
}

/* ---------- L'ordre ---------- */
/* On déplace le coffret dans la liste affichée, puis on enregistre la liste
   entière : c'est elle qui fait l'ordre du site. */
function deplacerCoffret(id, pas){
  var ids = TOUS_COFFRETS.map(function(c){ return c.id; });
  var i = ids.indexOf(id), j = i + pas;
  if(i < 0 || j < 0 || j >= ids.length) return;
  ids[i] = ids[j];
  ids[j] = id;
  cofsChanges.__ordre = ids;
  enregistrerCatalogue();
  reconstruireCatalogue();
  rendreCatalogue();
}
function monterCoffret(id){ deplacerCoffret(id, -1); }
function descendreCoffret(id){ deplacerCoffret(id, 1); }

/* ---------- Cacher, montrer, supprimer ---------- */
function basculerCache(id){
  var c = coffretDe(id);
  if(!c) return;
  majCoffret(id, {cache: !c.cache});
  toast(c.cache
    ? '« ' + esc(c.nom) + ' » ne s\'affiche plus sur le site.'
    : '« ' + esc(c.nom) + ' » s\'affiche de nouveau sur le site.');
  rendreCatalogue();
}
/* Un coffret du code ne se supprime pas : il se cache, et le bouton « Revenir au
   catalogue du site » le fait revenir. Seul ce que le traiteur a créé ici peut
   disparaître pour de bon. */
function supprimerCoffret(id){
  var c = coffretDe(id);
  if(!c || !estCree(id)) return;
  confirmerAction('Supprimer « ' + c.nom + ' » ? Il disparaît du site.', 'Supprimer', function(){
    cofsChanges.__perso = (cofsChanges.__perso || []).filter(function(p){ return p.id !== id; });
    delete cofsChanges[id];
    if(Array.isArray(cofsChanges.__ordre)){
      cofsChanges.__ordre = cofsChanges.__ordre.filter(function(x){ return x !== id; });
    }
    enregistrerCatalogue();
    reconstruireCatalogue();
    rendreCatalogue();
    toast('« ' + esc(c.nom) + ' » supprimé.');
  });
}

/* ---------- Ajouter ---------- */
function ajouterCoffret(){
  var nom = (document.getElementById('cat-nom').value || '').trim(),
      brut = (document.getElementById('cat-prix').value || '').trim(),
      rubrique = document.getElementById('cat-cat');
  if(!nom){
    montrerErreur('cat-err', true);
    return;
  }
  var prix = brut === '' ? null : Math.round(Number(brut));
  if(prix !== null && (!isFinite(prix) || prix <= 0)){
    toast('Le prix doit être un nombre supérieur à zéro. Laissez vide pour « sur demande ».');
    return;
  }
  montrerErreur('cat-err', false);
  var id = 'perso-' + Date.now();
  cofsChanges.__perso = (cofsChanges.__perso || []).concat([{
    id: id,
    cible: 'entreprise',
    nom: nom,
    prix: prix,
    cat: (rubrique && rubrique.value) || CAT_RUBRIQUES[0],
    /* Pas de photo choisie : la carte montre l'image de fond du site en
       attendant. La fenêtre s'ouvre juste après pour qu'il en mette une. */
    img: '',
    d: '',
    compo: [],
    pres: '',
    photos: []
  }]);
  enregistrerCatalogue();
  reconstruireCatalogue();
  rendreCatalogue();
  document.getElementById('cat-nom').value = '';
  document.getElementById('cat-prix').value = '';
  toast('« ' + esc(nom) + ' » ajouté. Choisissez sa photo et sa phrase.');
  ouvrirEdition(id);
}

/* ---------- La fenêtre de modification ---------- */
function champModif(id, libelle, valeur, type){
  return '<div><label for="' + id + '">' + esc(libelle) + '</label>' +
    '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(valeur) + '"></div>';
}
function optionsRubriques(choisie){
  return CAT_RUBRIQUES.map(function(r){
    return '<option' + (r === choisie ? ' selected' : '') + '>' + esc(r) + '</option>';
  }).join('');
}
function grillePhotos(c){
  var choisi = CAT_EDITION.img !== null ? CAT_EDITION.img : c.img;
  return mediaVignettes().map(function(m){
    return '<button type="button" class="cat-photo' + (m.valeur === choisi ? ' on' : '') + '"' +
      ' onclick="choisirPhoto(\'' + m.valeur + '\')" title="' + esc(m.nom) + '">' +
      '<img src="' + esc(cheminVu('img/' + m.valeur)) + '" alt="" loading="lazy"></button>';
  }).join('');
}
function choisirPhoto(valeur){
  CAT_EDITION.img = valeur;
  var zone = document.getElementById('cat-e-photos');
  var c = coffretDe(CAT_EDITION.id);
  if(zone && c) zone.innerHTML = grillePhotos(c);
}

/* ---------- Les photos de présentation ----------
   Celles de l'album, qu'on voit en ouvrant le pack sur le site. Quatre
   emplacements, et il choisit lesquels : un pack peut n'en montrer qu'une. Ce
   sont les mêmes photos que les vignettes, en plus grand. */
function listePhotosPack(){
  return MEDIA_PHOTOS.map(function(i){ return 'packs/' + i; });
}
/* Le nom du fichier ne dit rien à personne : « lunch 1 » se lit mieux que
   « lunch-1.jpg », et l'aperçu à côté montre de quoi il s'agit. */
function nomPhoto(v){
  return v.replace('packs/', '').replace(/\.[a-z0-9]+$/i, '').replace(/-/g, ' ');
}
function vuesDepart(c){
  return CAT_EDITION.photos !== null ? CAT_EDITION.photos : (c.photos || []);
}
function lignesVues(c){
  var pris = vuesDepart(c);
  var t = '';
  for(var i = 0; i < CAT_PHOTOS_MAX; i++){
    var valeur = pris[i] || '';
    var choix = '<option value=""' + (valeur ? '' : ' selected') + '>Aucune</option>' +
      listePhotosPack().map(function(v){
        return '<option value="' + esc(v) + '"' + (v === valeur ? ' selected' : '') + '>' +
          esc(nomPhoto(v)) + '</option>';
      }).join('');
    t += '<div class="cat-vue">' +
      '<span class="cat-vue__rang">Photo ' + (i + 1) + '</span>' +
      '<select onchange="changerVue(' + i + ', this.value)">' + choix + '</select>' +
      '<span class="cat-vue__vue">' +
        (valeur ? '<img src="' + esc(cheminVu('img/' + valeur)) + '" alt="">' : '') +
      '</span>' +
    '</div>';
  }
  return t;
}
/* Les emplacements vides sont gardés en place tant qu'on est dans la fenêtre :
   celui qui remplit la photo 3 puis la photo 1 ne voit rien sauter sous ses
   doigts. Ils sont retirés à l'enregistrement, pour que le site affiche un
   album sans trou. */
function changerVue(rang, valeur){
  var c = coffretDe(CAT_EDITION.id);
  if(!c) return;
  var v = vuesDepart(c).slice();
  while(v.length < CAT_PHOTOS_MAX) v.push('');
  v[rang] = valeur;
  CAT_EDITION.photos = v;
  var zone = document.getElementById('cat-e-vues');
  if(zone) zone.innerHTML = lignesVues(c);
}
function ouvrirEdition(id){
  var c = coffretDe(id);
  if(!c) return;
  CAT_EDITION = {id: id, img: null, photos: null};
  poserModale('ov-cat',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-cat\')" aria-label="Fermer">&times;</button>' +
      '<h3 class="adm-titre">' + esc(c.nom) + '</h3>' +
      '<div class="adm-actions">' +
        champModif('cat-e-nom', 'Nom du coffret', c.nom) +
        champModif('cat-e-prix', 'Prix hors taxes (DA)', c.prix === null ? '' : c.prix, 'number') +
        '<div><label for="cat-e-cat">Rubrique</label>' +
          '<select id="cat-e-cat">' + optionsRubriques(c.cat) + '</select></div>' +
      '</div>' +
      '<div class="adm-actions">' +
        '<div><label for="cat-e-d">Ce qu\'il contient, en une phrase</label>' +
          '<textarea id="cat-e-d" rows="3">' + esc(c.d || '') + '</textarea>' +
          '<span class="adm-aide">Cette phrase s\'affiche sur la carte du site et dans le panier.</span></div>' +
      '</div>' +
      '<h3 class="adm-titre">La photo de la carte</h3>' +
      '<p class="adm-aide">Cliquez une photo pour la choisir. Sans choix, la carte garde celle du site.</p>' +
      '<div class="cat-photos" id="cat-e-photos">' + grillePhotos(c) + '</div>' +
      '<h3 class="adm-titre">Les photos de présentation</h3>' +
      '<p class="adm-aide">Celles que le client voit en ouvrant le pack, quatre au maximum. ' +
        'Une seule remplie : une seule s\'affiche. Aucune : pas d\'album du tout.</p>' +
      '<div id="cat-e-vues">' + lignesVues(c) + '</div>' +
      '<div class="adm-actions">' +
        '<button type="button" class="bouton bouton--accent" onclick="enregistrerEdition()">Enregistrer</button>' +
        '<button type="button" class="bouton bouton--secondaire" onclick="closeOv(\'ov-cat\')">Fermer sans enregistrer</button>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-cat').setAttribute('onclick', "if(event.target===this)closeOv('ov-cat')");
  openOv('ov-cat');
}
function enregistrerEdition(){
  var id = CAT_EDITION.id;
  var c = coffretDe(id);
  if(!c) return;
  var nom = (document.getElementById('cat-e-nom').value || '').trim(),
      brut = (document.getElementById('cat-e-prix').value || '').trim(),
      cat = document.getElementById('cat-e-cat').value,
      d = (document.getElementById('cat-e-d').value || '').trim();
  if(!nom){ toast('Le coffret a besoin d\'un nom.'); return; }
  var prix = brut === '' ? null : Math.round(Number(brut));
  if(prix !== null && (!isFinite(prix) || prix <= 0)){
    toast('Le prix doit être un nombre supérieur à zéro. Laissez vide pour « sur demande ».');
    return;
  }
  var champs = {nom: nom, prix: prix, cat: cat, d: d};
  if(CAT_EDITION.img !== null) champs.img = CAT_EDITION.img;
  /* Les emplacements laissés vides ne partent pas dans le site : un album ne
     doit pas avoir de trou. Tout vider est un choix, et il s'enregistre. */
  if(CAT_EDITION.photos !== null){
    champs.photos = CAT_EDITION.photos.filter(function(x){ return !!x; });
  }
  majCoffret(id, champs);
  closeOv('ov-cat');
  rendreCatalogue();
  toast('« ' + esc(nom) + ' » enregistré.');
}

/* ---------- Tout remettre comme dans le code ---------- */
function reinitialiserCatalogue(){
  var n = nombreModifies() + (cofsChanges.__perso || []).length;
  if(!n && !Array.isArray(cofsChanges.__ordre)){
    toast('Le catalogue est déjà celui du site.');
    return;
  }
  confirmerAction('Revenir au catalogue du site ? Les prix, les photos, l\'ordre et les ajouts de ce navigateur seront perdus.',
    'Revenir au catalogue', function(){
      cofsChanges = {};
      enregistrerCatalogue();
      reconstruireCatalogue();
      rendreCatalogue();
      toast('Catalogue du site rétabli.');
    });
}

/* ---------- L'écran ---------- */
function resumeCatalogue(){
  var total = TOUS_COFFRETS.length;
  var caches = TOUS_COFFRETS.filter(function(c){ return c.cache; }).length;
  var crees = (cofsChanges.__perso || []).length;
  var modifs = nombreModifies();
  var bouts = [];
  if(caches) bouts.push(caches + (caches > 1 ? ' cachés' : ' caché'));
  if(crees) bouts.push(crees + (crees > 1 ? ' créés ici' : ' créé ici'));
  if(modifs) bouts.push(modifs + (modifs > 1 ? ' modifiés' : ' modifié'));
  var phrase = total + (total > 1 ? ' coffrets' : ' coffret') + ' au catalogue';
  if(!bouts.length) return phrase + ', tous conformes au site.';
  if(bouts.length === 1) return phrase + ', dont ' + bouts[0] + '.';
  return phrase + ', dont ' + bouts.slice(0, -1).join(', ') + ' et ' + bouts[bouts.length - 1] + '.';
}

function ligneCatalogue(c, i, tous){
  var cree = estCree(c.id);
  var prix = c.prix === null || c.prix === undefined
    ? '<span class="cat-ligne__demande">Sur demande</span>'
    : fmt(c.prix) + ' <small>hors taxes</small>';
  return '<div class="cat-ligne' + (c.cache ? ' cat-ligne--cache' : '') + '">' +
    '<img class="cat-ligne__vue" src="' + esc(cheminVu(cofImg(c))) + '" alt="" loading="lazy">' +
    '<div class="cat-ligne__nom">' +
      '<b>' + esc(c.nom) + '</b>' +
      '<span class="adm-sous">' + esc(c.cat) + (cree ? ' · créé ici' : '') + (c.cache ? ' · caché' : '') + '</span>' +
    '</div>' +
    '<div class="cat-ligne__prix">' +
      '<label for="catp-' + esc(c.id) + '">Prix HT</label>' +
      '<div class="cat-ligne__duo">' +
        '<input type="number" id="catp-' + esc(c.id) + '" min="0" step="50"' +
          ' value="' + (c.prix === null || c.prix === undefined ? '' : esc(c.prix)) + '"' +
          ' placeholder="Sur demande"' +
          ' onchange="changerPrix(\'' + esc(c.id) + '\', this.value)">' +
        '<span class="cat-ligne__vu">' + prix + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="cat-ligne__actes">' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="monterCoffret(\'' + esc(c.id) + '\')"' +
        (i === 0 ? ' disabled' : '') + ' title="Monter dans la liste">Monter</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="descendreCoffret(\'' + esc(c.id) + '\')"' +
        (i === tous.length - 1 ? ' disabled' : '') + ' title="Descendre dans la liste">Descendre</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ouvrirEdition(\'' + esc(c.id) + '\')">Modifier</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="basculerCache(\'' + esc(c.id) + '\')">' +
        (c.cache ? 'Montrer' : 'Cacher') + '</button>' +
      (cree
        ? '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="supprimerCoffret(\'' + esc(c.id) + '\')">Supprimer</button>'
        : '') +
    '</div>' +
  '</div>';
}

function rendreCatalogue(){
  var liste = document.getElementById('cat-liste');
  if(!liste) return;

  /* La liste des rubriques se pose une fois. Elle est écrite par le script et
     non dans la page : une seule liste à corriger le jour où une rubrique
     change, et les deux menus suivent. */
  var sel = document.getElementById('cat-cat');
  if(sel && !sel.options.length) sel.innerHTML = optionsRubriques(CAT_RUBRIQUES[0]);

  var resume = document.getElementById('cat-resume');
  if(resume) resume.textContent = resumeCatalogue();

  liste.innerHTML = TOUS_COFFRETS.map(ligneCatalogue).join('');
}

document.addEventListener('DOMContentLoaded', rendreCatalogue);
