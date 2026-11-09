/* Erriane Foods — Espace traiteur, onglet Catalogue.
   Deux côtés, comme le site : les coffrets de la page Entreprises et les plats
   de la page Particuliers. Chacun s'affiche en cartes, dans l'ordre où le client
   les voit, avec sa rubrique en titre. Le traiteur ajoute, modifie, déplace,
   cache et supprime ; il tient aussi la liste des rubriques.
   Ce qu'il fait se range dans son navigateur (`erri_cofs` pour les coffrets,
   `erri_plats` pour les plats) et s'empile sur le code, qui reste la référence.
   Chaque photo peut porter une légende, et un élément peut en avoir plusieurs :
   c'est l'album que le client voit en ouvrant la fiche. */

var CAT_PHOTOS_MAX = 6;
var CAT_EDITION = {side: null, id: null, img: null, photos: null};

/* ---------- Le côté, et ses données ---------- */
function coteDe(side){
  if(side === 'plat'){
    return {
      liste: TOUS_PLATS, changes: platsChanges, enregistrer: enregistrerPlats,
      reconstruire: reconstruirePlats, rubriques: rubriquesPlats()
    };
  }
  return {
    liste: TOUS_COFFRETS, changes: cofsChanges, enregistrer: enregistrerCatalogue,
    reconstruire: reconstruireCatalogue, rubriques: rubriquesEntreprise()
  };
}
function elementDe(side, id){
  return coteDe(side).liste.filter(function(x){ return x.id === id; })[0] || null;
}
function estCree(side, id){
  return (coteDe(side).changes.__perso || []).some(function(p){ return p.id === id; });
}
function nombreModifies(side){
  return Object.keys(coteDe(side).changes).filter(function(k){ return k.indexOf('__') !== 0; }).length;
}
/* Un changement se range par élément ; on garde ce qui était déjà là. */
function majElement(side, id, champs){
  var c = coteDe(side);
  var o = c.changes[id] || {};
  Object.keys(champs).forEach(function(k){ o[k] = champs[k]; });
  c.changes[id] = o;
  c.enregistrer();
  c.reconstruire();
  rendreCatalogue();
}

/* ---------- Les rubriques ---------- */
function rubriquesDe(side){
  return coteDe(side).rubriques || [];
}
/* La liste du code est recopiée dans le navigateur au premier changement :
   renommer ou retirer une rubrique ne touche jamais au code. */
function rubriquesModifiables(side){
  var c = coteDe(side);
  if(side === 'plat'){
    if(!Array.isArray(c.changes.__rubriques) || !c.changes.__rubriques.length){
      c.changes.__rubriques = rubriquesPlats().slice();
      c.enregistrer();
    }
    return c.changes.__rubriques;
  }
  if(!Array.isArray(c.changes.__rubriques) || !c.changes.__rubriques.length){
    c.changes.__rubriques = rubriquesEntreprise().map(function(r){
      return JSON.parse(JSON.stringify(r));
    });
    c.enregistrer();
  }
  return c.changes.__rubriques;
}
function ajouterRubrique(side){
  var champ = document.getElementById('cat-new-' + side);
  var nom = (champ ? champ.value : '').trim();
  if(!nom){ toast('Écrivez le nom de la rubrique.'); return; }
  var liste = rubriquesDe(side);
  if(liste.some(function(r){ return r.cat.toLowerCase() === nom.toLowerCase(); })){
    toast('Cette rubrique existe déjà.');
    return;
  }
  if(side === 'plat'){
    rubriquesModifiables('plat').push({cat: nom, nom: nom});
    enregistrerPlats();
  } else {
    rubriquesModifiables('pack').push({
      cat: nom, id: nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      nom: nom, surtitre: '', intro: ''
    });
    enregistrerCatalogue();
  }
  if(champ) champ.value = '';
  rendreCatalogue();
  toast('Rubrique « ' + esc(nom) + ' » ajoutée.');
}
function renommerRubrique(side, cat, nom){
  nom = (nom || '').trim();
  if(!nom){ toast('Une rubrique ne se vide pas.'); rendreCatalogue(); return; }
  var liste = rubriquesModifiables(side);
  var r = liste.filter(function(x){ return x.cat === cat; })[0];
  if(!r) return;
  r.nom = nom;
  if(side === 'plat') enregistrerPlats();
  else enregistrerCatalogue();
  rendreCatalogue();
}
/* Une rubrique qui contient encore quelque chose ne se retire pas : ses
   éléments deviendraient invisibles sur le site. */
function supprimerRubrique(side, cat){
  var c = coteDe(side);
  var dedans = c.liste.filter(function(x){ return x.cat === cat; }).length;
  if(dedans){
    toast('« ' + esc(cat) + ' » contient encore ' + dedans + ' élément' + (dedans > 1 ? 's' : '') +
      '. Déplacez-les ou cachez-les d\'abord.');
    return;
  }
  confirmerAction('Retirer la rubrique « ' + cat + ' » ?', 'Retirer', function(){
    var liste = rubriquesModifiables(side);
    var j = liste.map(function(x){ return x.cat; }).indexOf(cat);
    if(j >= 0) liste.splice(j, 1);
    if(side === 'plat') enregistrerPlats();
    else enregistrerCatalogue();
    rendreCatalogue();
    toast('Rubrique retirée.');
  });
}

/* ---------- L'ordre, le cache, la suppression ---------- */
function deplacerElement(side, id, pas){
  var c = coteDe(side);
  var ids = c.liste.map(function(x){ return x.id; });
  var i = ids.indexOf(id), j = i + pas;
  if(i < 0 || j < 0 || j >= ids.length) return;
  ids[i] = ids[j];
  ids[j] = id;
  c.changes.__ordre = ids;
  c.enregistrer();
  c.reconstruire();
  rendreCatalogue();
}
function basculerCache(side, id){
  var c = elementDe(side, id);
  if(!c) return;
  majElement(side, id, {cache: !c.cache});
  toast(c.cache ? '« ' + esc(c.nom) + ' » ne s\'affiche plus sur le site.'
                : '« ' + esc(c.nom) + ' » s\'affiche de nouveau sur le site.');
}
function supprimerElement(side, id){
  var c = elementDe(side, id);
  if(!c || !estCree(side, id)) return;
  confirmerAction('Supprimer « ' + c.nom + ' » ? Il disparaît du site.', 'Supprimer', function(){
    var ch = coteDe(side).changes;
    ch.__perso = (ch.__perso || []).filter(function(p){ return p.id !== id; });
    delete ch[id];
    if(Array.isArray(ch.__ordre)) ch.__ordre = ch.__ordre.filter(function(x){ return x !== id; });
    coteDe(side).enregistrer();
    coteDe(side).reconstruire();
    rendreCatalogue();
    toast('« ' + esc(c.nom) + ' » supprimé.');
  });
}

/* ---------- Ajouter ---------- */
function lirePrix(valeur){
  var v = String(valeur || '').trim();
  if(v === '') return null;
  var n = Math.round(Number(v));
  if(!isFinite(n) || n <= 0) return NaN;
  return n;
}
function ajouterCoffret(){
  var nom = (document.getElementById('cat-nom').value || '').trim();
  var prix = lirePrix(document.getElementById('cat-prix').value);
  var sel = document.getElementById('cat-cat');
  if(!nom){ montrerErreur('cat-err', true); return; }
  if(isNaN(prix)){ toast('Le prix doit être un nombre supérieur à zéro. Laissez vide pour « sur demande ».'); return; }
  montrerErreur('cat-err', false);
  var id = 'perso-' + Date.now();
  cofsChanges.__perso = (cofsChanges.__perso || []).concat([{
    id: id, cible: 'entreprise', nom: nom, prix: prix,
    cat: (sel && sel.value) || rubriquesDe('pack')[0].cat,
    img: '', d: '', compo: [], pres: '', photos: []
  }]);
  enregistrerCatalogue();
  reconstruireCatalogue();
  rendreCatalogue();
  document.getElementById('cat-nom').value = '';
  document.getElementById('cat-prix').value = '';
  toast('« ' + esc(nom) + ' » ajouté. Choisissez sa photo et sa phrase.');
  ouvrirEdition('pack', id);
}
function ajouterPlat(){
  var nom = (document.getElementById('plat-nom').value || '').trim();
  var prix = lirePrix(document.getElementById('plat-prix').value);
  var sel = document.getElementById('plat-cat');
  if(!nom){ montrerErreur('plat-err', true); return; }
  if(isNaN(prix) || prix === null){ toast('Indiquez le prix du plat.'); return; }
  montrerErreur('plat-err', false);
  var id = 'plat-perso-' + Date.now();
  platsChanges.__perso = (platsChanges.__perso || []).concat([{
    id: id, cat: (sel && sel.value) || rubriquesDe('plat')[0].cat,
    nom: nom, prix: prix, img: '', desc: '', portion: '', allergenes: '', photos: []
  }]);
  enregistrerPlats();
  reconstruirePlats();
  rendreCatalogue();
  document.getElementById('plat-nom').value = '';
  document.getElementById('plat-prix').value = '';
  toast('« ' + esc(nom) + ' » ajouté. Choisissez sa photo et sa phrase.');
  ouvrirEdition('plat', id);
}

/* ---------- Les photos disponibles ----------
   Deux listes : celles de la carte (des vignettes, légères) et celles de la
   fiche (les grandes vues). Un plat n'a qu'un dossier d'images, `menu/`. */
function photosPlats(){
  var vus = {}, out = [];
  TOUS_PLATS.forEach(function(p){
    if(p.img && !vus[p.img]){ vus[p.img] = 1; out.push(p.img); }
  });
  return out;
}
function photosCarte(side){
  if(side === 'plat') return photosPlats();
  return mediaVignettes().map(function(m){ return m.valeur; });
}
function photosAlbum(side){
  if(side === 'plat') return photosPlats();
  return MEDIA_PHOTOS.map(function(i){ return 'packs/' + i; });
}
/* Une valeur déjà choisie mais absente de la liste (une photo retirée du site,
   un ancien fond) reste proposée : elle ne doit pas disparaître sous les yeux du
   traiteur au moment où il ouvre la fiche. */
function avecValeur(liste, valeur){
  if(!valeur) return liste;
  return liste.indexOf(valeur) >= 0 ? liste : [valeur].concat(liste);
}
function nomPhoto(v){
  return v.replace(/^packs\/vignettes\//, '').replace(/^packs\//, '').replace(/^media\//, '')
    .replace(/^menu\//, '').replace(/\.[a-z0-9]+$/i, '').replace(/-/g, ' ');
}

/* ---------- La fenêtre de modification ---------- */
function champModif(id, libelle, valeur, type){
  return '<div><label for="' + id + '">' + esc(libelle) + '</label>' +
    '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(valeur === null || valeur === undefined ? '' : valeur) + '"></div>';
}
function optionsRubriques(choisie, side){
  return rubriquesDe(side).map(function(r){
    return '<option value="' + esc(r.cat) + '"' + (r.cat === choisie ? ' selected' : '') + '>' + esc(r.nom) + '</option>';
  }).join('');
}
function grillePhotoCarte(side, c){
  var choisi = CAT_EDITION.img !== null ? CAT_EDITION.img : c.img;
  return avecValeur(photosCarte(side), choisi).map(function(v){
    return '<button type="button" class="cat-photo' + (v === choisi ? ' on' : '') + '"' +
      ' onclick="choisirPhotoCarte(\'' + side + '\', \'' + argJs(v) + '\')" title="' + esc(nomPhoto(v)) + '">' +
      '<img src="' + esc(cheminVu('img/' + v)) + '" alt="" loading="lazy"></button>';
  }).join('');
}
function choisirPhotoCarte(side, valeur){
  CAT_EDITION.img = valeur;
  var c = elementDe(side, CAT_EDITION.id);
  var zone = document.getElementById('cat-e-photos');
  if(zone && c) zone.innerHTML = grillePhotoCarte(side, c);
}

/* ---------- L'album : des photos, chacune avec sa légende ---------- */
/* L'album de la fiche, sans le repli sur la photo de carte : ouvrir la fiche
   d'un pack qui n'a pas d'album ne doit pas en créer un en l'enregistrant. */
function vuesCourantes(side, c){
  if(CAT_EDITION.photos !== null) return CAT_EDITION.photos;
  return (c.photos || []).map(photoDe);
}
function lignesPhotos(side, c){
  var prises = vuesCourantes(side, c);
  var liste = photosAlbum(side);
  return prises.map(function(p, i){
    var choix = '<option value="">Aucune</option>' + avecValeur(liste, p.src).map(function(v){
      return '<option value="' + esc(v) + '"' + (v === p.src ? ' selected' : '') + '>' + esc(nomPhoto(v)) + '</option>';
    }).join('');
    return '<div class="cat-vue">' +
      '<span class="cat-vue__vue">' +
        (p.src ? '<img src="' + esc(cheminVu('img/' + p.src)) + '" alt="">' : '') +
      '</span>' +
      '<div class="cat-vue__champs">' +
        '<select onchange="changerVue(' + i + ', this.value)">' + choix + '</select>' +
        '<input type="text" value="' + esc(p.legende || '') + '" placeholder="Légende de la photo (facultatif)"' +
          ' onchange="changerLegende(' + i + ', this.value)">' +
      '</div>' +
      '<button type="button" class="lien-discret" onclick="retirerVue(' + i + ')">Retirer</button>' +
    '</div>';
  }).join('');
}
function redessinerPhotos(side){
  var c = elementDe(side, CAT_EDITION.id);
  var zone = document.getElementById('cat-e-vues');
  if(zone && c) zone.innerHTML = lignesPhotos(side, c);
}
function copieVues(side){
  var c = elementDe(side, CAT_EDITION.id);
  return (c ? vuesCourantes(side, c) : []).map(function(p){
    return {src: p.src, legende: p.legende || ''};
  });
}
function ajouterVue(){
  var side = CAT_EDITION.side;
  var v = copieVues(side);
  if(v.length >= CAT_PHOTOS_MAX){ toast('Six photos au maximum.'); return; }
  v.push({src: '', legende: ''});
  CAT_EDITION.photos = v;
  redessinerPhotos(side);
}
function changerVue(rang, valeur){
  var side = CAT_EDITION.side;
  var v = copieVues(side);
  if(!v[rang]) v[rang] = {src: '', legende: ''};
  v[rang].src = valeur;
  CAT_EDITION.photos = v;
  redessinerPhotos(side);
}
function changerLegende(rang, valeur){
  var side = CAT_EDITION.side;
  var v = copieVues(side);
  if(!v[rang]) v[rang] = {src: '', legende: ''};
  v[rang].legende = valeur;
  CAT_EDITION.photos = v;
}
function retirerVue(rang){
  var side = CAT_EDITION.side;
  var v = copieVues(side);
  v.splice(rang, 1);
  CAT_EDITION.photos = v;
  redessinerPhotos(side);
}

function ouvrirEdition(side, id){
  var c = elementDe(side, id);
  if(!c) return;
  CAT_EDITION = {side: side, id: id, img: null, photos: null};
  var estPlat = side === 'plat';
  var champs =
    '<div class="adm-actions">' +
      champModif('cat-e-nom', estPlat ? 'Nom du plat' : 'Nom du coffret', c.nom) +
      champModif('cat-e-prix', 'Prix (DA)', c.prix === null || c.prix === undefined ? '' : c.prix, 'number') +
      '<div><label for="cat-e-cat">Rubrique</label><select id="cat-e-cat">' + optionsRubriques(c.cat, side) + '</select></div>' +
    '</div>' +
    '<div class="adm-actions">' +
      '<div><label for="cat-e-d">' + (estPlat ? 'Description (facultatif)' : 'Ce qu\'il contient, en une phrase') + '</label>' +
        '<textarea id="cat-e-d" rows="3">' + esc((estPlat ? c.desc : c.d) || '') + '</textarea></div>' +
    '</div>';

  if(estPlat){
    champs += '<div class="adm-actions">' +
      champModif('cat-e-portion', 'Portion (facultatif)', c.portion || '') +
      champModif('cat-e-allergenes', 'Allergènes (facultatif)', c.allergenes || '') +
    '</div>';
  } else {
    champs += '<div class="adm-actions">' +
      '<div><label for="cat-e-pres">Présentation (facultatif)</label>' +
        '<textarea id="cat-e-pres" rows="4">' + esc(c.pres || '') + '</textarea></div>' +
      '<div><label for="cat-e-compo">Ce qu\'il y a dedans, une ligne par élément</label>' +
        '<textarea id="cat-e-compo" rows="5">' + esc((c.compo || []).join('\n')) + '</textarea></div>' +
    '</div>';
  }

  poserModale('ov-cat',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-cat\')" aria-label="Fermer">&times;</button>' +
      '<h3 class="adm-titre">' + esc(c.nom) + '</h3>' +
      champs +
      '<h3 class="adm-titre">La photo de la carte</h3>' +
      '<p class="adm-aide">Cliquez une photo pour la choisir.</p>' +
      '<div class="cat-photos" id="cat-e-photos">' + grillePhotoCarte(side, c) + '</div>' +
      '<h3 class="adm-titre">Les photos de la fiche</h3>' +
      '<p class="adm-aide">Celles que le client voit en ouvrant. Chacune peut porter une légende. ' +
        'Sans photo, la carte seule suffit.</p>' +
      '<div id="cat-e-vues">' + lignesPhotos(side, c) + '</div>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ajouterVue()">Ajouter une photo</button>' +
      '<div class="adm-actions">' +
        '<button type="button" class="bouton bouton--accent" onclick="enregistrerEdition()">Enregistrer</button>' +
        '<button type="button" class="bouton bouton--secondaire" onclick="closeOv(\'ov-cat\')">Fermer sans enregistrer</button>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-cat').setAttribute('onclick', "if(event.target===this)closeOv('ov-cat')");
  openOv('ov-cat');
}

function enregistrerEdition(){
  var side = CAT_EDITION.side, id = CAT_EDITION.id;
  var c = elementDe(side, id);
  if(!c) return;
  var nom = (document.getElementById('cat-e-nom').value || '').trim();
  var prix = lirePrix(document.getElementById('cat-e-prix').value);
  var cat = document.getElementById('cat-e-cat').value;
  if(!nom){ toast('Il faut un nom.'); return; }
  if(isNaN(prix)){ toast('Le prix doit être un nombre supérieur à zéro. Laissez vide pour « sur demande ».'); return; }
  var champs = {nom: nom, prix: prix, cat: cat};
  if(side === 'plat'){
    champs.desc = (document.getElementById('cat-e-d').value || '').trim();
    champs.portion = (document.getElementById('cat-e-portion').value || '').trim();
    champs.allergenes = (document.getElementById('cat-e-allergenes').value || '').trim();
  } else {
    champs.d = (document.getElementById('cat-e-d').value || '').trim();
    champs.pres = (document.getElementById('cat-e-pres').value || '').trim();
    champs.compo = (document.getElementById('cat-e-compo').value || '').split('\n')
      .map(function(x){ return x.trim(); }).filter(function(x){ return x; });
  }
  if(CAT_EDITION.img !== null) champs.img = CAT_EDITION.img;
  if(CAT_EDITION.photos !== null){
    champs.photos = CAT_EDITION.photos
      .filter(function(p){ return p && p.src; })
      .map(function(p){ return {src: p.src, legende: (p.legende || '').trim()}; });
  }
  majElement(side, id, champs);
  closeOv('ov-cat');
  toast('« ' + esc(nom) + ' » enregistré.');
}

/* ---------- Tout remettre comme dans le code ---------- */
function reinitialiserCatalogue(){
  var n = nombreModifies('pack') + nombreModifies('plat') +
    (cofsChanges.__perso || []).length + (platsChanges.__perso || []).length;
  if(!n && !Array.isArray(cofsChanges.__ordre) && !Array.isArray(platsChanges.__ordre)){
    toast('Le catalogue est déjà celui du site.');
    return;
  }
  confirmerAction('Revenir au catalogue du site ? Les prix, les photos, les rubriques, l\'ordre et les ajouts de ce navigateur seront perdus.',
    'Revenir au catalogue', function(){
      cofsChanges = {};
      platsChanges = {};
      enregistrerCatalogue();
      enregistrerPlats();
      reconstruireCatalogue();
      reconstruirePlats();
      rendreCatalogue();
      toast('Catalogue du site rétabli.');
    });
}

/* ---------- L'écran ---------- */
function resumeCatalogue(){
  var p = TOUS_COFFRETS.length, m = TOUS_PLATS.length;
  var caches = TOUS_COFFRETS.filter(function(c){ return c.cache; }).length +
    TOUS_PLATS.filter(function(c){ return c.cache; }).length;
  var crees = (cofsChanges.__perso || []).length + (platsChanges.__perso || []).length;
  var modifs = nombreModifies('pack') + nombreModifies('plat');
  var bouts = [];
  if(caches) bouts.push(caches + ' caché' + (caches > 1 ? 's' : ''));
  if(crees) bouts.push(crees + ' créé' + (crees > 1 ? 's' : '') + ' ici');
  if(modifs) bouts.push(modifs + ' modifié' + (modifs > 1 ? 's' : ''));
  var phrase = p + ' coffrets et ' + m + ' plats au catalogue';
  if(!bouts.length) return phrase + ', tous conformes au site.';
  return phrase + ', dont ' + bouts.join(', ') + '.';
}

function carteCatalogue(side, c){
  var i = coteDe(side).liste.indexOf(c);
  var n = coteDe(side).liste.length;
  var cree = estCree(side, c.id);
  var prix = c.prix === null || c.prix === undefined
    ? '<span class="cat-carte__demande">Sur demande</span>'
    : fmt(c.prix);
  return '<article class="cat-carte' + (c.cache ? ' cat-carte--cache' : '') + '">' +
    '<div class="cat-carte__vue">' +
      (c.img ? '<img src="' + esc(cheminVu('img/' + c.img)) + '" alt="" loading="lazy">' : '<span class="cat-carte__vide">Sans photo</span>') +
    '</div>' +
    '<div class="cat-carte__corps">' +
      '<b>' + esc(c.nom) + '</b>' +
      '<span class="adm-sous">' + esc(c.cat) + (cree ? ' · créé ici' : '') + (c.cache ? ' · caché' : '') + '</span>' +
      '<span class="cat-carte__prix">' + prix + '</span>' +
      '<div class="cat-carte__actes">' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ouvrirEdition(\'' + side + '\', \'' + argJs(c.id) + '\')">Modifier</button>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="deplacerElement(\'' + side + '\', \'' + argJs(c.id) + '\', -1)"' +
          (i === 0 ? ' disabled' : '') + ' title="Monter">↑</button>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="deplacerElement(\'' + side + '\', \'' + argJs(c.id) + '\', 1)"' +
          (i === n - 1 ? ' disabled' : '') + ' title="Descendre">↓</button>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="basculerCache(\'' + side + '\', \'' + argJs(c.id) + '\')">' +
          (c.cache ? 'Montrer' : 'Cacher') + '</button>' +
        (cree ? '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="supprimerElement(\'' + side + '\', \'' + argJs(c.id) + '\')">Supprimer</button>' : '') +
      '</div>' +
    '</div></article>';
}

function rendreCartes(side){
  var zone = document.getElementById(side === 'plat' ? 'cat-cartes-plats' : 'cat-cartes-entreprise');
  if(!zone) return;
  var liste = coteDe(side).liste;
  var rubs = rubriquesDe(side);
  var html = rubs.map(function(r){
    var dedans = liste.filter(function(x){ return x.cat === r.cat; });
    if(!dedans.length){
      return '<h3 class="cat-sous-titre">' + esc(r.nom) + ' <span class="adm-sous">vide</span></h3>';
    }
    return '<h3 class="cat-sous-titre">' + esc(r.nom) + ' <span class="adm-sous">' + dedans.length + '</span></h3>' +
      '<div class="cat-grille">' + dedans.map(function(x){ return carteCatalogue(side, x); }).join('') + '</div>';
  }).join('');
  /* Un élément rangé dans une rubrique retirée ne doit pas disparaître de
     l'écran : il apparaît à part, et le traiteur peut le reclasser. */
  var orphelins = liste.filter(function(x){
    return !rubs.some(function(r){ return r.cat === x.cat; });
  });
  if(orphelins.length){
    html += '<h3 class="cat-sous-titre">Sans rubrique <span class="adm-sous">' + orphelins.length + '</span></h3>' +
      '<div class="cat-grille">' + orphelins.map(function(x){ return carteCatalogue(side, x); }).join('') + '</div>';
  }
  zone.innerHTML = html;
}

function rendreRubriques(side){
  var zone = document.getElementById(side === 'plat' ? 'cat-rubriques-plats' : 'cat-rubriques-entreprise');
  if(!zone) return;
  zone.innerHTML = rubriquesDe(side).map(function(r){
    return '<div class="cat-rubrique">' +
      '<input type="text" value="' + esc(r.nom) + '" aria-label="Nom de la rubrique"' +
        ' onchange="renommerRubrique(\'' + side + '\', \'' + argJs(r.cat) + '\', this.value)">' +
      '<button type="button" class="lien-discret" onclick="supprimerRubrique(\'' + side + '\', \'' + argJs(r.cat) + '\')">Retirer</button>' +
    '</div>';
  }).join('') +
  '<div class="cat-rubrique cat-rubrique--ajout">' +
    '<input type="text" id="cat-new-' + side + '" placeholder="Nouvelle rubrique">' +
    '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ajouterRubrique(\'' + side + '\')">Ajouter la rubrique</button>' +
  '</div>';
}

function rendreCatalogue(){
  var resume = document.getElementById('cat-resume');
  if(resume) resume.textContent = resumeCatalogue();

  rendreRubriques('pack');
  rendreRubriques('plat');
  rendreCartes('pack');
  rendreCartes('plat');

  var selPack = document.getElementById('cat-cat');
  if(selPack) selPack.innerHTML = optionsRubriques(selPack.value, 'pack');
  var selPlat = document.getElementById('plat-cat');
  if(selPlat) selPlat.innerHTML = optionsRubriques(selPlat.value, 'plat');
}

document.addEventListener('DOMContentLoaded', rendreCatalogue);
