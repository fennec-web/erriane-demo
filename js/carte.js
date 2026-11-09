/* Erriane Foods — La carte des particuliers, et les rubriques des deux côtés.
   Le menu vient du client, reçu le 15 octobre 2026 (transcription fidèle dans
   clients/erriane/sources/menu-particuliers-2026-10.md). Les noms et les prix
   sont les siens, tels qu'il les a écrits. Les prix sont TTC.

   Ce fichier est chargé après data.js. Les plats se modifient dans l'espace
   traiteur, onglet Catalogue : le navigateur ne range que les changements
   (`erri_plats`), et le code reste la référence, exactement comme pour les
   coffrets (`erri_cofs`). */

/* ---------- Les rubriques ----------
   Une rubrique a une clé stable (`cat`) et un nom affiché. Renommer change le
   nom, jamais la clé : les plats et les coffrets restent rangés au même endroit
   quand le traiteur corrige une faute. */

var RUBRIQUES_ENT_DEFAUT = [
  {cat: 'Pause café', id: 'pauses-cafe', nom: 'Pauses café', surtitre: 'Service 1',
   intro: 'Du café en thermos au service Nespresso avec porcelaine, nos pauses café s\'adaptent à votre budget et à vos événements.'},
  {cat: 'Coffret repas', id: 'dejeuners', nom: 'Déjeuners d\'affaires', surtitre: 'Service 2',
   intro: 'Coffrets repas pour vos réunions, séminaires et journées de formation.'},
  {cat: 'Prestation', id: 'bases-de-vie', nom: 'Bases de vie & gestion de cantines', surtitre: 'Service 3',
   intro: 'Pour vos chantiers isolés et la gestion quotidienne de vos cantines d\'entreprise. Planification, livraison et suivi assurés.'},
  {cat: 'Réception', id: 'receptions', nom: 'Réceptions & événements', surtitre: 'Service 4',
   intro: 'Méchoui, buffets et grandes tablées pour vos séminaires, vos fêtes d\'entreprise et vos réceptions.'}
];

var RUBRIQUES_PLATS_DEFAUT = [
  'Entrées froides', 'Entrées chaudes',
  'Plats de résistance, viande rouge', 'Plats de résistance, viande blanche',
  'Pâtes', 'Desserts'
].map(function(n){ return {cat: n, nom: n}; });

/* ---------- Les plats du client ---------- */
var DEFAULT_PLATS = [
  {id:'m-cesar', cat:'Entrées froides', nom:'Salade César', prix:600, img:'menu/salade-cesar.jpg'},
  {id:'m-variee', cat:'Entrées froides', nom:'Salade variée', prix:400, img:'menu/salade-variee.jpg'},
  {id:'m-parisienne', cat:'Entrées froides', nom:'Salade Parisienne', prix:450, img:'menu/salade-parisienne.jpg'},
  {id:'m-oeufs', cat:'Entrées froides', nom:'Œufs durs à la mayonnaise', prix:300, img:'menu/oeufs-durs-mayonnaise.jpg'},
  {id:'m-laitue', cat:'Entrées froides', nom:'Cœur de laitue', prix:250, img:'menu/coeur-de-laitue.jpg'},

  {id:'m-gratin-poulet', cat:'Entrées chaudes', nom:'Gratin au poulet', prix:500, img:'menu/gratins.jpg'},
  {id:'m-gratin-viande', cat:'Entrées chaudes', nom:'Gratin à la viande hachée', prix:600, img:'menu/gratins.jpg'},
  {id:'m-bourek-3f', cat:'Entrées chaudes', nom:'Bourek au 3 fromages (duo)', prix:300, img:'menu/bourek-01.jpg'},
  {id:'m-bourek-poulet', cat:'Entrées chaudes', nom:'Bourek au poulet (duo)', prix:350, img:'menu/bourek-02.jpg'},
  {id:'m-bourek-viande', cat:'Entrées chaudes', nom:'Bourek à la viande hachée (duo)', prix:400, img:'menu/bourek-01.jpg'},

  {id:'m-roti-veau', cat:'Plats de résistance, viande rouge', nom:'Rôti de veau', prix:1300, img:'menu/roti-veau.jpg'},
  {id:'m-saute-veau', cat:'Plats de résistance, viande rouge', nom:'Sauté de veau', prix:1500, img:'menu/saute-veau.jpg'},
  {id:'m-emince-veau', cat:'Plats de résistance, viande rouge', nom:'Émincé de veau à la crème', prix:1400, img:'menu/emince-veau.jpg'},
  {id:'m-mechoui', cat:'Plats de résistance, viande rouge', nom:'Méchoui d\'agneau (1/2 épaule)', prix:3000, img:'menu/mechoui.jpg', phare:true},

  {id:'m-supreme', cat:'Plats de résistance, viande blanche', nom:'Suprême de poulet aux champignons frais', prix:1000, img:'menu/supreme-poulet.jpg'},
  {id:'m-escalope', cat:'Plats de résistance, viande blanche', nom:'Escalope de dinde grillée', prix:800, img:'menu/escalope-dinde.jpg'},
  {id:'m-cuisse', cat:'Plats de résistance, viande blanche', nom:'Cuisse de poulet farcie à la mozzarella', prix:900, img:'menu/cuisse-poulet-mozzarella.jpg'},
  {id:'m-roti-dinde', cat:'Plats de résistance, viande blanche', nom:'Rôti de dinde', prix:1000, img:'menu/roti-dinde.jpg'},

  {id:'m-spaghetti', cat:'Pâtes', nom:'Spaghetti bolognaise', prix:700, img:'menu/spaghetti-bolognaise.jpg'},
  {id:'m-tagliatelles', cat:'Pâtes', nom:'Tagliatelles au poulet', prix:700, img:'menu/tagliatelles-poulet.jpg'},
  {id:'m-lasagnes', cat:'Pâtes', nom:'Lasagnes à la viande hachée', prix:700, img:'menu/lasagnes.jpg'},
  {id:'m-penne', cat:'Pâtes', nom:'Pennés Arrabiatta', prix:600, img:'menu/penne-arrabiatta.jpg'},

  {id:'m-mousse', cat:'Desserts', nom:'Mousse au chocolat noir', prix:250, img:'menu/mousse-chocolat.jpg'},
  {id:'m-fondant', cat:'Desserts', nom:'Fondant au chocolat', prix:300, img:'menu/fondant-chocolat.jpg'},
  {id:'m-tiramisu', cat:'Desserts', nom:'Tiramisu', prix:350, img:'menu/tiramisu.jpg'}
];

/* ---------- Les changements du traiteur ---------- */
var CLE_PLATS = 'erri_plats';
var platsChanges = load(CLE_PLATS, null) || {};
if(Array.isArray(platsChanges)) platsChanges = {};
function enregistrerPlats(){ save(CLE_PLATS, platsChanges); }

/* Une photo se range en {src, legende}. Les anciennes, écrites en texte seul,
   restent lisibles : on les convertit à la lecture, sans migration. */
function photoDe(p){
  if(typeof p === 'string') return {src: p, legende: ''};
  return {src: (p && p.src) || '', legende: (p && p.legende) || ''};
}
function photosDe(item){
  var l = (item.photos || []).map(photoDe).filter(function(p){ return p.src; });
  if(l.length) return l;
  return item.img ? [{src: item.img, legende: ''}] : [];
}

function platModifie(d){
  var p = JSON.parse(JSON.stringify(d));
  var o = platsChanges[d.id];
  if(o){
    ['prix', 'nom', 'desc', 'cat', 'img', 'portion', 'allergenes', 'phare'].forEach(function(k){
      if(k in o) p[k] = o[k];
    });
    if('photos' in o) p.photos = o.photos || [];
  }
  p.cache = !!o && o.cache === true;
  return p;
}

var TOUS_PLATS = [];
var PLATS = [];
function reconstruirePlats(){
  var tous = DEFAULT_PLATS.map(platModifie);
  (platsChanges.__perso || []).filter(function(p){ return p && p.id; }).forEach(function(p){
    tous.push(platModifie(p));
  });
  if(Array.isArray(platsChanges.__ordre)){
    var rang = {};
    platsChanges.__ordre.forEach(function(id, i){ rang[id] = i; });
    tous.sort(function(a, b){
      var ra = a.id in rang ? rang[a.id] : 10000 + tous.indexOf(a);
      var rb = b.id in rang ? rang[b.id] : 10000 + tous.indexOf(b);
      return ra - rb;
    });
  }
  TOUS_PLATS = tous;
  PLATS = tous.filter(function(p){ return !p.cache; });
}
reconstruirePlats();

/* ---------- Les rubriques, côté données ---------- */
function rubriquesEntreprise(){
  var l = cofsChanges.__rubriques;
  return Array.isArray(l) && l.length ? l : RUBRIQUES_ENT_DEFAUT.map(function(r){
    return JSON.parse(JSON.stringify(r));
  });
}
function rubriquesPlats(){
  var l = platsChanges.__rubriques;
  return Array.isArray(l) && l.length ? l : RUBRIQUES_PLATS_DEFAUT.map(function(r){
    return {cat: r.cat, nom: r.nom};
  });
}
function tousLesPlats(){
  return TOUS_PLATS;
}
function platDe(id){
  return TOUS_PLATS.filter(function(p){ return p.id === id; })[0] || null;
}
