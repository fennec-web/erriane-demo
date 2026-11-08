/* Erriane Foods — Espace traiteur, onglet Médias.
   Les deux bandes du site : celle du haut de la page Entreprises et celle qui
   reste sur le côté. Le traiteur choisit un fichier déjà posé sur le site, ou
   n'en met aucun : la bande ne s'affiche alors pas du tout, et le site garde son
   apparence. Il n'y a rien à téléverser, donc rien qui puisse échouer : tant que
   la base de données n'est pas là, c'est ce qui tient debout.

   Le jour où une vidéo est déposée dans img/media/, on l'écrit dans
   `MEDIA_VIDEOS` (js/media.js) : elle apparaît ici dans la liste. */

var CLE_MEDIA = CLE_MEDIA_BANDES;

/* Les quatre réglages, lus par la même fonction que le site (media.js) : ce que
   le traiteur voit ici est donc exactement ce que le client voit. */
function mediaReglages(){
  return bandesReglages();
}
/* Chaque changement s'enregistre aussitôt : le traiteur voit ce qu'il fait, et
   il n'y a pas de bouton « Enregistrer » à oublier. */
function enregistrerMedia(champs, redessiner){
  var m = load(CLE_MEDIA, null) || {};
  Object.keys(champs).forEach(function(k){ m[k] = champs[k]; });
  save(CLE_MEDIA, m);
  if(redessiner !== false) rendreMedias();
  return m;
}

/* ---------- Les listes de fichiers ---------- */
/* Une valeur gardée mais absente du site (fichier renommé ou retiré) est
   montrée comme telle : le traiteur doit voir que sa bande ne s'affiche plus,
   au lieu de retomber sans rien dire sur « aucune ». */
function optionMedia(valeur, libelleVide, ou){
  var liste = mediaBandes(ou);
  var connu = liste.some(function(m){ return m.valeur === valeur; });
  var vide = '<option value=""' + (valeur ? '' : ' selected') + '>' + esc(libelleVide) + '</option>';
  var absente = valeur && !connu
    ? '<option value="' + esc(valeur) + '" selected>' + esc(valeur) + ' (absent du site)</option>'
    : '';
  return vide + absente + liste.map(function(m){
    return '<option value="' + esc(m.valeur) + '"' + (m.valeur === valeur ? ' selected' : '') + '>' + esc(m.nom) + '</option>';
  }).join('');
}
function optionPhoto(valeur, libelleVide){
  var liste = mediaVignettes();
  var connu = liste.some(function(m){ return m.valeur === valeur; });
  var vide = '<option value=""' + (valeur ? '' : ' selected') + '>' + esc(libelleVide) + '</option>';
  var absente = valeur && !connu
    ? '<option value="' + esc(valeur) + '" selected>' + esc(valeur) + ' (absent du site)</option>'
    : '';
  return vide + absente + liste.map(function(m){
    return '<option value="' + esc(m.valeur) + '"' + (m.valeur === valeur ? ' selected' : '') + '>' + esc(m.nom) + '</option>';
  }).join('');
}

/* ---------- L'aperçu ----------
   Le chemin part de la page : cette vue vit dans admin/, donc un cran plus bas
   que le site. Sans le « ../ », le navigateur cherche le média dans admin/img/
   et n'affiche rien. */
var DOSSIER_VU = '../img/';

/* Les données du site écrivent leurs chemins depuis la racine (« img/... »).
   L'espace traiteur vit dans admin/, un cran plus bas : on remet le bon préfixe
   au moment de l'affichage. Les photos gardées dans le navigateur (imgData) ne
   sont pas touchées : ce sont déjà des adresses complètes. */
function cheminVu(chemin){ return String(chemin || '').replace(/^img\//, DOSSIER_VU); }

/* L'aperçu a la forme de sa bande : large pour celle du haut, vertical pour
   celle du côté. Sans ça, le traiteur jugerait une vidéo verticale dans un cadre
   couché, et la trouverait mauvaise pour de mauvaises raisons. */
function apercuMedia(src, poster, forme){
  var cadre = 'med-apercu' + (forme === 'cote' ? ' med-apercu--vertical' : '');
  if(!src) return '<div class="' + cadre + ' med-apercu--vide">Rien pour l\'instant.</div>';
  var chemin = DOSSIER_VU + src;
  if(mediaEstVideo(src)){
    return '<div class="' + cadre + '"><video src="' + esc(chemin) + '"' +
      (poster ? ' poster="' + esc(DOSSIER_VU + poster) + '"' : '') +
      ' muted loop playsinline autoplay preload="metadata"></video></div>';
  }
  return '<div class="' + cadre + '"><img src="' + esc(chemin) + '" alt=""></div>';
}
/* Ce que le client verra, dit en français : c'est la seule chose que le
   traiteur ne peut pas deviner depuis son écran. */
function phraseHaut(m){
  if(!m.haut) return 'La bande du haut ne s\'affiche pas : la page Entreprises garde son fond d\'encre.';
  var quoi = mediaEstVideo(m.haut) ? 'cette vidéo, en boucle et sans son' : 'cette photo, en grand';
  return 'La page Entreprises s\'ouvre sur ' + quoi + ', avec le titre par-dessus.';
}
function phraseCote(m){
  if(!m.cote) return 'La bande latérale ne s\'affiche pas.';
  return 'La bande latérale se pose à gauche, à mi-hauteur, quand la bande du haut a quitté ' +
    'l\'écran : les deux ne se recouvrent donc jamais. Elle ne s\'affiche pas sur un téléphone ' +
    'ni sur un petit écran, faute de place à côté du texte.';
}

/* ---------- Les gestes ---------- */
function choisirMediaHaut(valeur){
  enregistrerMedia({haut: valeur});
  /* Une photo n'a pas besoin d'image d'attente : on l'oublie pour ne pas
     trimballer un réglage qui ne sert à rien. */
  if(!mediaEstVideo(valeur)) enregistrerMedia({hautPoster: ''});
  toast(valeur ? 'Bande du haut enregistrée.' : 'Bande du haut retirée.');
}
function choisirPoster(valeur){
  enregistrerMedia({hautPoster: valeur});
  toast(valeur ? 'Image d\'attente enregistrée.' : 'Image d\'attente retirée.');
}
function choisirMediaCote(valeur){
  enregistrerMedia({cote: valeur});
  toast(valeur ? 'Bande latérale enregistrée.' : 'Bande latérale retirée.');
}
/* Le texte se garde sans redessiner : l'écran se réécrirait sous les doigts du
   traiteur, et il perdrait sa phrase au milieu. */
function changerTexteCote(valeur){
  enregistrerMedia({coteTexte: valeur}, false);
  toast('Phrase de la bande enregistrée.');
}

/* ---------- L'écran ---------- */
function rendreMedias(){
  var haut = document.getElementById('med-haut');
  var cote = document.getElementById('med-cote');
  if(!haut || !cote) return;
  var m = mediaReglages();

  haut.innerHTML =
    '<div class="med-bloc">' +
      '<div class="med-bloc__duo">' +
        '<div>' +
          '<div class="med-champ">' +
            '<label for="med-haut-src">Vidéo ou photo</label>' +
            '<select id="med-haut-src" onchange="choisirMediaHaut(this.value)">' +
              optionMedia(m.haut, 'Aucune : pas de bande en haut', 'haut') + '</select>' +
          '</div>' +
          '<div class="med-champ">' +
            '<label for="med-haut-poster">Image avant le démarrage</label>' +
            '<select id="med-haut-poster" onchange="choisirPoster(this.value)">' +
              optionPhoto(m.hautPoster, 'Aucune : le site met son propre fond') + '</select>' +
            '<p class="adm-aide">Utile seulement pour une vidéo : c\'est l\'image montrée pendant qu\'elle se charge.</p>' +
          '</div>' +
        '</div>' +
        apercuMedia(m.haut, m.hautPoster, 'haut') +
      '</div>' +
      '<p class="med-bloc__suite">' + phraseHaut(m) + '</p>' +
    '</div>';

  cote.innerHTML =
    '<div class="med-bloc">' +
      '<div class="med-bloc__duo">' +
        '<div>' +
          '<div class="med-champ">' +
            '<label for="med-cote-src">Vidéo ou photo verticale</label>' +
            '<select id="med-cote-src" onchange="choisirMediaCote(this.value)">' +
              optionMedia(m.cote, 'Aucune : pas de bande latérale', 'cote') + '</select>' +
          '</div>' +
          '<div class="med-champ">' +
            '<label for="med-cote-texte">Une phrase, si vous voulez</label>' +
            '<input type="text" id="med-cote-texte" maxlength="90" value="' + esc(m.coteTexte) + '"' +
              ' placeholder="Ex : Méchoui entier à emporter ce week-end"' +
              ' onchange="changerTexteCote(this.value)">' +
            '<p class="adm-aide">Elle s\'affiche sous le média. Laissez vide si la bande se suffit à elle-même.</p>' +
          '</div>' +
        '</div>' +
        apercuMedia(m.cote, '', 'cote') +
      '</div>' +
      '<p class="med-bloc__suite">' + phraseCote(m) + '</p>' +
    '</div>';
}

document.addEventListener('DOMContentLoaded', rendreMedias);
