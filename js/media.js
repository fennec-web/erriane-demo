/* Erriane Foods — Les fichiers qu'on peut montrer dans une bande ou mettre en
   vignette. Liste écrite à la main : un navigateur n'a pas le droit de lire un
   dossier du site, donc il faut lui dire ce qui existe. Le jour où l'on dépose
   une vidéo dans img/media/, on ajoute son nom dans MEDIA_VIDEOS si elle est
   large, dans MEDIA_VIDEOS_VERTICALES si elle est tournée à la verticale : elle
   apparaît alors dans l'espace traiteur, onglet Médias, à la seule place qui
   convient à sa forme.

   Les chemins s'écrivent sans « img/ » devant, comme partout dans les données
   du site : une seule convention à retenir. */

/* Les vidéos déposées dans img/media/.
   Le client a fourni deux tournages, tous deux filmés au téléphone. Le méchoui
   est passé au format large pour la bande du haut ; l'atelier, filmé d'origine
   en 1080 par 1920, sert la bande latérale sans le moindre recadrage. Les deux
   durent une douzaine de secondes et pèsent un peu plus d'un méga chacune, sans
   leur son, qui ne servirait à rien.
   Le jour où le client en dépose une autre, on ajoute son nom ici, sur le
   modèle d'une ligne comme 'mechoui.mp4', et elle se choisit toute seule dans
   l'espace traiteur, à la seule place qui convient à sa forme. */
var MEDIA_VIDEOS = [
    'bandeau-large.mp4',
];

/* Les vidéos verticales, celles tournées pour un téléphone. Elles ne servent
   que la bande latérale : posées dans celle du haut, qui court sur toute la
   largeur, elles ne montreraient qu'un mince ruban au milieu de l'écran. */
var MEDIA_VIDEOS_VERTICALES = [
    'reel-catering.mp4',
];

/* Les images de img/media/ : l'image d'attente d'une vidéo, celle que le
   navigateur montre pendant que la vidéo se charge. */
var MEDIA_POSTERS = [
    'bandeau-large.jpg',
];
var MEDIA_POSTERS_VERTICAUX = [
    'reel-catering.jpg',
];

/* Les vignettes des packs : les petites images qui servent de photo de carte. */
var MEDIA_VIGNETTES = [
    'basedevie-1.jpg',
    'basedevie-2.jpg',
    'basedevie-3.jpg',
    'basedevie-4.jpg',
    'basique-1.jpg',
    'basique-2.jpg',
    'basique-3.jpg',
    'basique-4.jpg',
    'buffet-1.jpg',
    'buffet-2.jpg',
    'buffet-3.jpg',
    'buffet-4.jpg',
    'excellence-1.jpg',
    'lunch-bag-1.jpg',
    'lunch-bag-2.jpg',
    'lunch-bag-3.jpg',
    'mechoui-1.jpg',
    'mechoui-2.jpg',
    'mechoui-3.jpg',
    'mechoui-4.jpg',
    'mechoui-5.jpg',
    'pause-cafe-bagels.jpg',
    'pause-cafe-roules.jpg',
    'pause-cafe-sales.jpg',
    'pause-cafe-sucres.jpg',
    'premium-1.jpg',
    'premium-2.jpg',
    'premium-3.jpg',
    'premium-4.jpg',
    'privv-1.jpg',
    'privv-2.jpg',
    'privv-3.jpg',
    'privv-4.jpg',
    'standard-1.jpg',
    'standard-2.jpg',
    'standard-3.jpg',
    'standard-4.jpg',
    'vip-poisson-1.jpg',
];

/* Les vues en grand, celles des albums et des bandes. */
var MEDIA_PHOTOS = [
    'basedevie-1.jpg',
    'basedevie-2.jpg',
    'basedevie-3.jpg',
    'basedevie-4.jpg',
    'basique-1.jpg',
    'basique-2.jpg',
    'basique-3.jpg',
    'basique-4.jpg',
    'buffet-1.jpg',
    'buffet-2.jpg',
    'buffet-3.jpg',
    'buffet-4.jpg',
    'excellence-1.jpg',
    'lunch-bag-1.jpg',
    'lunch-bag-2.jpg',
    'lunch-bag-3.jpg',
    'mechoui-1.jpg',
    'mechoui-2.jpg',
    'mechoui-3.jpg',
    'mechoui-4.jpg',
    'mechoui-5.jpg',
    'pause-cafe-bagels.jpg',
    'pause-cafe-roules.jpg',
    'pause-cafe-sales.jpg',
    'pause-cafe-sucres.jpg',
    'premium-1.jpg',
    'premium-2.jpg',
    'premium-3.jpg',
    'premium-4.jpg',
    'privv-1.jpg',
    'privv-2.jpg',
    'privv-3.jpg',
    'privv-4.jpg',
    'standard-1.jpg',
    'standard-2.jpg',
    'standard-3.jpg',
    'standard-4.jpg',
    'vip-poisson-1.jpg',
];

/* Les images à la racine de img/ : les illustrations et les fonds de page. */
var MEDIA_FONDS = [
    'c-collation.jpg',
    'c-confort.jpg',
    'c-poisson.jpg',
    'c-prestige.jpg',
    'c-standard.jpg',
    'c-vip.jpg',
    'hero-buffet.jpg',
];

/* Ce qu'on peut mettre dans une bande : une vidéo, une vue en grand ou un fond.
   On ne propose pas les vignettes : une bande les agrandirait, et elles sont
   faites pour rester petites. */
function mediaBandes(ou){
  /* La bande latérale ne propose que des médias verticaux. Un fichier large y
     montrerait une bande étroite au milieu de son cadre, et une vidéo verticale
     dans la bande du haut ne montrerait qu'un ruban : chaque bande n'offre donc
     que ce qui a sa forme. */
  if(ou === 'cote'){
    return MEDIA_VIDEOS_VERTICALES.map(function(v){ return {valeur: 'media/' + v, nom: 'Vidéo verticale : ' + v}; })
      .concat(MEDIA_POSTERS_VERTICAUX.map(function(i){ return {valeur: 'media/' + i, nom: 'Image verticale : ' + i}; }));
  }
  return MEDIA_VIDEOS.map(function(v){ return {valeur: 'media/' + v, nom: 'Vidéo : ' + v}; })
    .concat(MEDIA_POSTERS.map(function(i){ return {valeur: 'media/' + i, nom: 'Image : ' + i}; }))
    .concat(MEDIA_PHOTOS.map(function(i){ return {valeur: 'packs/' + i, nom: 'Photo : ' + i}; }))
    .concat(MEDIA_FONDS.map(function(i){ return {valeur: i, nom: 'Fond : ' + i}; }));
}

/* Ce qu'on peut mettre en photo de carte : d'abord les vignettes, puis les
   fonds et les images de img/media/, qui sont déjà des images de la bonne
   taille. */
function mediaVignettes(){
  return MEDIA_VIGNETTES.map(function(i){ return {valeur: 'packs/vignettes/' + i, nom: 'Vignette : ' + i}; })
    .concat(MEDIA_POSTERS.map(function(i){ return {valeur: 'media/' + i, nom: 'Image : ' + i}; }))
    .concat(MEDIA_FONDS.map(function(i){ return {valeur: i, nom: 'Fond : ' + i}; }));
}

/* Le type se lit sur l'extension, il n'est pas rangé à part : un seul endroit à
   corriger si un jour on accepte autre chose que le mp4 et le webm. */
function mediaEstVideo(chemin){
  return /\.(mp4|webm|mov)$/i.test(chemin || '');
}

/* ---------- Ce que les bandes affichent ----------
   Deux bandes : celle du haut de la page Entreprises, celle du côté. Le traiteur
   les règle depuis son espace. Ce qui suit est lu par l'espace traiteur pour
   afficher l'état réel, et par le site pour poser les médias : une seule règle,
   donc aucun risque que l'écran du traiteur montre autre chose que le site.

   Tant qu'il n'a jamais rien réglé, les deux bandes montrent les vidéos du
   client, chacune dans sa forme : le méchoui en large en haut, l'atelier en
   vertical sur le côté. C'est le seul moyen qu'elles soient vues par tout le
   monde, puisque les réglages d'un navigateur ne valent que pour lui. Dès qu'il
   touche à l'onglet Médias, même pour dire « aucune », c'est son choix qui
   s'applique : une valeur vide enregistrée est un choix, une valeur absente
   n'en est pas un. */
var CLE_MEDIA_BANDES = 'erri_media';
var BANDE_HAUT_DEFAUT = 'media/bandeau-large.mp4';
var BANDE_HAUT_POSTER_DEFAUT = 'media/bandeau-large.jpg';
var BANDE_COTE_DEFAUT = 'media/reel-catering.mp4';

function bandesReglages(){
  var garde = load(CLE_MEDIA_BANDES, null);
  var m = garde || {};
  return {
    haut: ('haut' in m) ? (m.haut || '') : BANDE_HAUT_DEFAUT,
    hautPoster: ('hautPoster' in m) ? (m.hautPoster || '') : BANDE_HAUT_POSTER_DEFAUT,
    cote: ('cote' in m) ? (m.cote || '') : BANDE_COTE_DEFAUT,
    coteTexte: m.coteTexte || ''
  };
}
