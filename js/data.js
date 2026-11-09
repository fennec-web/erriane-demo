/* Erriane Foods — Données du site.
   Un seul endroit à modifier pour changer un pack, un prix ou une option.
   Les pages lisent ce fichier pour afficher le catalogue. */

var TEL_MOBILE = '0770 37 19 09';
var TEL_FIXE = '023 70 18 06';
/* WhatsApp ne fonctionne que sur le mobile, jamais sur le fixe. */
var TEL_WHATSAPP = '213770371909';
var CONTACT_EMAIL = 'contact@erriane.com';
var CONTACT_ADRESSE = '11, Ferme Pons, 16050 Kouba, Alger';

/* ---------- Options de composition ---------- */
var GARNITURES = ['Riz', 'Pommes de terre', 'Salade verte', 'Pâtes', 'Légumes sautés', 'Boulgour', 'Haricots verts', 'Semoule'];
var ENTREES_FROIDES = ['Salade variée', 'Crudités de saison', 'Œufs durs mayonnaise'];
var ENTREES_CHAUDES = ['Potage de légumes', 'Crème de volaille', 'Soufflé', 'Mini pizza'];
var ENTREES_FROIDES_IMP = ['Salade de poulpe', 'Salade de thon', 'Blanc de seiche'];
var ENTREES_CHAUDES_IMP = ['Gratin au poulet', 'Brick tunisien', 'Boureks à la viande hachée'];
var ENTREES_CHAUDES_POISSON = ['Gratin aux fruits de mer', 'Brick au thon', 'Boureks aux crevettes'];
var VIANDES_BLANCHES = ['Cuisse de poulet rôtie', 'Escalope de dinde grillée'];
var VIANDES_ROUGES = ['Boulettes hachées à l\'italienne', 'Méchoui d\'agneau', 'Filet de veau grillé', 'Brochettes royales'];
var POISSONS = ['Daurade au four', 'Merlan en friture', 'Espadon grillé', 'Brochettes de thon'];
var DESSERTS = ['Fruit : pomme', 'Fruit : orange', 'Fruit : banane', 'Yaourt', 'Pâtisserie du jour'];
var BOISSONS = ['Soda', 'Jus d\'orange', 'Jus multifruits'];
var LIVREURS = ['Rachid', 'Sofiane', 'Mounir'];

/* ---------- Catalogue ----------
   cible : toujours 'entreprise'. Les particuliers ont leur propre page et leur
           propre carte depuis le 26/10/2026 (voir js/menu.js) : le catalogue
           des coffrets ne sert plus qu'à l'espace entreprises, et les plats de
           la carte des particuliers ne passent pas par ici. Le champ est gardé
           pour que le filtre de `catalogue.js` reste le même le jour où un pack
           reviendrait des deux côtés.
   prix  : en DA TTC, le prix payé. Le traiteur travaille en TTC depuis le
           9 novembre 2026 : aucun écran ne nomme la taxe (voir ttcDe).
           null = tarif sur demande (renvoie vers WhatsApp) : le bouton du pack
           ouvre alors WhatsApp au lieu du panier, et la carte affiche
           « Sur demande ». Six packs sont chiffrés aujourd'hui (les six
           coffrets repas), sept ne le sont pas encore : les pauses café, le
           Lunch Bag et les trois prestations sur devis.
   pres  : la présentation longue, montrée quand on ouvre le pack. Elle est
           écrite à partir de la composition donnée par le client, rien de plus.
   photos: les vues du pack, dans l'ordre. Elles vivent dans img/ et sont
           préfixées par photoPack(). Un pack sans photo n'affiche pas d'album. */
var DEFAULT_COFFRETS = [
  /* --- Entreprises : pauses café --- */
  /* Les trois pauses café n'ont pas de photo du pack : aucun des deux tournages
     ne montre de café, de thé, de thermos ni de gobelets. Celle qui traînait
     (packs/pause-cafe-1.jpg) était un recadrage d'une image de la démo, pas une
     photo du client. On montre donc ce qu'on a de vrai : les pièces sucrées et
     salées de sa collation, reçues le 26 octobre 2026. Décision de Massyl le
     même jour : « on fait avec ce qu'on a, ensuite je lui demanderai ». À
     remplacer par la vraie table dès qu'il l'envoie. */
  {id:'pausb', cible:'entreprise', nom:'Pause Café Basique', prix:null, img:'packs/vignettes/pause-cafe-sucres.jpg', cat:'Pause café',
   d:"Café en thermos, thé à la menthe, 2 viennoiseries minis, 2 sucrés minis, jus en bouteille, eau minérale, gobelets carton, sucre en stick.",
   compo:["Café en thermos et thé à la menthe","2 viennoiseries minis et 2 sucrés minis","Jus en bouteille + eau minérale","Gobelets carton, sucre en stick"],
   pres:"La pause café simple et complète : café en thermos et thé à la menthe, deux viennoiseries miniatures, deux pièces sucrées, jus en bouteille et eau minérale. Les gobelets en carton et le sucre en stick sont fournis.",
   photos:['packs/pause-cafe-sucres.jpg']},
  {id:'pauss', cible:'entreprise', nom:'Pause Café Standard', prix:null, img:'packs/vignettes/pause-cafe-sales.jpg', cat:'Pause café',
   d:"Café en thermos, thé à la menthe, 2 viennoiseries, 2 sucrés, 2 salés minis, jus, eau, gobelets, sucre.",
   compo:["Café en thermos et thé à la menthe","2 viennoiseries, 2 sucrés et 2 salés minis","Jus + eau minérale","Gobelets, sucre"],
   pres:"La pause café qui tient jusqu'au déjeuner : café en thermos et thé à la menthe, deux viennoiseries, deux pièces sucrées et deux pièces salées miniatures, jus et eau minérale. Gobelets et sucre fournis.",
   photos:['packs/pause-cafe-sales.jpg','packs/pause-cafe-sucres.jpg']},
  {id:'pausp', cible:'entreprise', nom:'Pause Café Premium', prix:null, img:'packs/vignettes/pause-cafe-roules.jpg', cat:'Pause café',
   d:"Café Nespresso, thé, 2 viennoiseries, 3 sucrés, 3 salés, pur jus, eau pétillante, porcelaine, serveur inclus.",
   compo:["Café Nespresso et thé","2 viennoiseries, 3 sucrés et 3 salés","Pur jus + eau pétillante","Service en porcelaine, serveur inclus"],
   pres:"La pause café servie : café Nespresso et thé, deux viennoiseries, trois pièces sucrées et trois pièces salées, pur jus et eau pétillante. Le service se fait en porcelaine, avec un serveur sur place.",
   photos:['packs/pause-cafe-roules.jpg','packs/pause-cafe-bagels.jpg','packs/pause-cafe-sucres.jpg']},
  /* --- Coffrets repas (les deux publics) --- */
  {id:'lunch', cible:'entreprise', nom:'Le Lunch Bag', prix:null, img:'packs/vignettes/lunch-bag-1.jpg', cat:'Coffret repas',
   d:"Le sac repas pratique : sandwich pain aux céréales, viande froide, laitue, fromage, sauce. Fruit, soda ou jus, eau minérale. Accessoires inclus.",
   compo:["Sandwich pain aux céréales, viande froide, laitue, fromage, sauce","Fruit","Soda ou jus en bouteille + eau minérale","Serviette, lingette rince-doigt","Cure-dent, dosettes sel & poivre noir"],
   pres:"Le repas à emporter, prêt à distribuer. Un sandwich en pain aux céréales garni de viande froide, laitue, fromage et sauce, un fruit, une boisson et de l'eau minérale. Les accessoires sont dans le sac : serviette, lingette rince-doigt, cure-dent, sel et poivre.",
   /* Les quatre vues de septembre montraient un plateau chaud (œuf, brocoli,
      pommes de terre), pas un sac repas : la photo contredisait la description.
      Remplacées le 26 octobre 2026 par trois vues du vrai sac, reçues le 15/10.
      Les anciennes (lunch-1 à -4) restent dans img/packs pour ne pas casser un
      catalogue enregistré dans un navigateur, mais sortent du choix de l'espace. */
   photos:['packs/lunch-bag-1.jpg','packs/lunch-bag-2.jpg','packs/lunch-bag-3.jpg']},
  {id:'basique', cible:'entreprise', nom:'Coffret Basique', prix:1000, img:'packs/vignettes/basique-1.jpg', cat:'Coffret repas',
   /* Les six présentations des coffrets repas suivent l'offre de prix 2025 du
      client, la dernière qui donne à la fois les crans et un exemple complet
      pour chacun. L'exemple est annoncé comme un exemple : le traiteur compose
      selon la saison et les produits. Les seuils de livraison offerte sont ceux
      de la même offre. */
   pres:"Le déjeuner complet au tarif le plus juste : une entrée froide ou chaude, un plat de résistance avec deux garnitures, un fruit de saison ou un yaourt, et une boisson. À titre d'exemple, ce que le traiteur cite pour ce cran dans son offre de prix : salade variée, suprême de poulet à la Mexicaine, fruit de saison. Le pain, les couverts complets et les accessoires sont dans le coffret. La livraison est offerte à partir de vingt coffrets par commande.",
   photos:['packs/basique-1.jpg','packs/basique-2.jpg','packs/basique-3.jpg','packs/basique-4.jpg'],
   d:"Entrée froide ou chaude + plat de résistance avec 2 garnitures + dessert + boisson.",
   compo:["Entrée froide ou chaude : salade variée, crudités, œufs mayonnaise, potage, mini pizza…","Plat de résistance : viande blanche ou rouge + 2 garnitures","Fruit de saison ou yaourt","Pain + couverts complets + serviette","Soda ou jus + eau minérale","Lingette, cure-dent, sel & poivre"],
   choices:{entryType:'choice', entryFroides:ENTREES_FROIDES, entryChaudes:ENTREES_CHAUDES,
    meatType:'choice', viandesBlanches:VIANDES_BLANCHES, viandesRouges:VIANDES_ROUGES,
    garnitures:GARNITURES, maxGarnitures:2}},
  {id:'standard', cible:'entreprise', nom:'Coffret Standard', prix:1200, img:'packs/vignettes/standard-1.jpg', cat:'Coffret repas', flag:'Le plus commandé',
   pres:"Un cran au-dessus du Basique : une garniture de plus. Le convive choisit son entrée, froide ou chaude, puis le plat de résistance avec trois garnitures. À titre d'exemple, ce que le traiteur compose pour ce cran : salade variée, cuisse de poulet basquaise, fruit de saison. Le pain, les couverts complets et les accessoires suivent, comme dans tous les coffrets repas. La livraison est offerte à partir de dix coffrets par commande.",
   photos:['packs/standard-1.jpg','packs/standard-2.jpg','packs/standard-3.jpg','packs/standard-4.jpg'],
   d:"Entrée froide ou chaude + plat de résistance avec 3 garnitures + dessert + boisson.",
   compo:["Entrée froide ou chaude au choix","Plat de résistance : viande blanche ou rouge + 3 garnitures","Fruit de saison ou yaourt","Pain + couverts complets + serviette","Soda ou jus + eau minérale","Lingette, cure-dent, sel & poivre"],
   choices:{entryType:'choice', entryFroides:ENTREES_FROIDES, entryChaudes:ENTREES_CHAUDES,
    meatType:'choice', viandesBlanches:VIANDES_BLANCHES, viandesRouges:VIANDES_ROUGES,
    garnitures:GARNITURES, maxGarnitures:3}},
  {id:'premium', cible:'entreprise', nom:'Coffret Premium', prix:1600, img:'packs/vignettes/premium-1.jpg', cat:'Coffret repas',
   pres:"Le déjeuner d'affaires dans sa version complète : une entrée froide, une entrée chaude, puis le plat de résistance avec trois garnitures. Le dessert se choisit entre fruit de saison et pâtisserie. À titre d'exemple, ce que le traiteur compose pour ce cran : salade composée, omelette aux champignons, suprême de poulet Tandoori, deux fruits de saison. La boisson et les accessoires sont inclus. La livraison est offerte à partir de huit coffrets par commande.",
   photos:['packs/premium-1.jpg','packs/premium-2.jpg','packs/premium-3.jpg','packs/premium-4.jpg'],
   d:"Entrée froide + entrée chaude + plat avec 3 garnitures + pâtisserie + boisson.",
   compo:["Entrée froide : salade variée, crudités de saison…","Entrée chaude : potage, crème de volaille, soufflé, mini pizza…","Plat de résistance + 3 garnitures","Fruit de saison ou pâtisserie","Pain + couverts + serviette","Soda ou jus + eau minérale + accessoires"],
   choices:{entryFroides:ENTREES_FROIDES, entryChaudes:ENTREES_CHAUDES,
    meatType:'choice', viandesBlanches:VIANDES_BLANCHES, viandesRouges:VIANDES_ROUGES,
    garnitures:GARNITURES, maxGarnitures:3,
    dessert:['Fruit de saison', 'Pâtisserie']}},
  /* Les deux derniers échelons de la gamme, tels que le client les a nommés le
     15/10/2026 : « Coffret excellence », « Coffret VIP viande », « Coffret VIP
     poisson ». Les noms et les prix sont ceux de son offre de prix 2025, la
     dernière qui en donne, et son dernier message reprend exactement ces noms.
     Le « Coffret VIP » vide de septembre a été fusionné avec VIP viande : c'était
     le même produit, nommé trop tôt. */
  /* La carte montre une vraie boîte du traiteur depuis le 26 octobre 2026, à la
     place de c-prestige.jpg (une assiette vide avec deux couverts, qui ne disait
     rien du coffret). Pas d'album en revanche : la photo est carrée et la colonne
     de gauche de la fenêtre est très haute, si bien qu'une seule vue y était
     découpée en bandeau vertical, illisible. Il faut une vue en portrait pour ça. */
  {id:'excellente', cible:'entreprise', nom:'Coffret Excellence', prix:2000, img:'packs/vignettes/excellence-1.jpg', cat:'Coffret repas',
   d:"Entrée froide + entrée chaude + plat de résistance + dessert + boisson.",
   compo:["Entrée froide : salade tunisienne par exemple","Entrée chaude : deux boureks à la viande hachée par exemple","Plat de résistance : rôti de veau par exemple","Dessert : tarte aux amandes par exemple","Soda ou jus + eau minérale","Pain + couverts complets + serviette + accessoires"],
   /* La composition vient de l'offre de prix 2025 du client, qui donne un
      exemple complet par coffret. On la présente comme un exemple, pas comme
      une promesse : le traiteur compose selon la saison. */
   pres:"Le coffret des grandes occasions : une entrée froide, une entrée chaude, un plat de résistance, un dessert et une boisson. À titre d'exemple, ce que le traiteur a composé pour ce cran : salade tunisienne, deux boureks à la viande hachée, rôti de veau, tarte aux amandes, soda ou jus et eau minérale. Le pain, les couverts complets et les accessoires sont dans le coffret. La livraison est offerte à partir de cinq coffrets par commande."},
  {id:'privv', cible:'entreprise', nom:'Coffret VIP viande', prix:3500, img:'packs/vignettes/privv-1.jpg', cat:'Coffret repas',
   /* Pas de phrase d'exemple ici, contrairement aux autres crans : les photos de
      ce coffret montrent le méchoui servi avec sa salade et ses garnitures, alors
      que l'exemple de l'offre 2025 parle d'un filet de veau Stroganov et d'un
      gâteau au chocolat. Les deux ne vont pas ensemble à l'écran, et ce sont les
      photos du client qui montrent ce qu'il sert (Massyl, 26 octobre 2026). */
   pres:"Le haut de la gamme viande : entrées en version améliorée, puis un plat qui réunit le méchoui d'agneau, le filet de veau grillé et les brochettes royales, servis avec trois garnitures. Le dessert se choisit entre fruit de saison et pâtisserie. La livraison est offerte.",
   photos:['packs/privv-1.jpg','packs/privv-2.jpg','packs/privv-3.jpg','packs/privv-4.jpg'],
   d:"Entrées améliorées + méchoui d'agneau, filet de veau, brochettes royales + 3 garnitures + dessert.",
   compo:["Entrée froide améliorée + entrée chaude améliorée","Plat amélioré : méchoui d'agneau, filet de veau grillé, brochettes royales… + 3 garnitures","Fruit de saison ou pâtisserie","Pain + couverts + serviette","Soda ou jus + eau minérale + accessoires"],
   choices:{entryFroides:ENTREES_FROIDES_IMP, entryChaudes:ENTREES_CHAUDES_IMP,
    meatType:'fixed_rouge', viandesRouges:['Méchoui d\'agneau', 'Filet de veau grillé', 'Brochettes royales'],
    garnitures:GARNITURES, maxGarnitures:3,
    dessert:['Fruit de saison', 'Pâtisserie']}},
  {id:'privp', cible:'entreprise', nom:'Coffret VIP poisson', prix:4000, img:'packs/vignettes/vip-poisson-1.jpg', cat:'Coffret repas',
   photos:['packs/vip-poisson-1.jpg'],
   pres:"Le haut de la gamme poisson : entrées en version améliorée, avec salade de poulpe, salade de thon ou blanc de seiche en entrée froide, gratin de fruits de mer, brick au thon ou boureks aux crevettes en entrée chaude. Le plat suit en daurade au four, espadon grillé, merlan ou brochettes de thon, avec trois garnitures. À titre d'exemple, ce que le traiteur a servi pour ce cran : salade au thon, gratin aux fruits de mer, daurade au four et deux fruits. La livraison est offerte.",
   d:"Entrées améliorées poisson + daurade, espadon, brochettes de thon + 3 garnitures + dessert.",
   compo:["Entrée froide améliorée : salade de poulpe, salade de thon, blanc de seiche…","Entrée chaude : gratin de fruits de mer, brick au thon, boureks aux crevettes…","Plat au poisson : daurade au four, merlan, espadon grillé, brochettes de thon… + 3 garnitures","Fruit ou pâtisserie","Soda ou jus + eau minérale + accessoires"],
   choices:{entryFroides:ENTREES_FROIDES_IMP, entryChaudes:ENTREES_CHAUDES_POISSON,
    meatType:'fixed_poisson', viandesRouges:POISSONS,
    garnitures:GARNITURES, maxGarnitures:3,
    dessert:['Fruit de saison', 'Pâtisserie']}},
  /* --- Prestations sur devis --- */
  {id:'basedevie', cible:'entreprise', nom:'Base de vie & cantine', prix:null, img:'packs/vignettes/basedevie-1.jpg', cat:'Prestation',
   d:"Pour vos chantiers isolés et la gestion quotidienne de vos cantines. Planification, livraison et suivi assurés.",
   compo:["Menu planifié selon vos équipes et votre budget","Livraison sur site, aux heures convenues","Suivi de consommation et facturation mensuelle"],
   pres:"Pour les chantiers isolés et les cantines qui tournent tous les jours. Le menu se planifie avec vous, selon les équipes et le budget. La livraison se fait sur site aux heures convenues, et la consommation est suivie pour la facturation mensuelle.",
   photos:['packs/basedevie-1.jpg','packs/basedevie-2.jpg','packs/basedevie-3.jpg','packs/basedevie-4.jpg']},
  {id:'mechoui', cible:'entreprise', nom:'Méchoui entier', prix:null, img:'packs/vignettes/mechoui-1.jpg', cat:'Réception',
   d:"Agneau ou chevreau entier, accompagné de salade, riz, boulgour, chekhchouka, pommes risolées ou légumes sautés. Pour vos mariages, anniversaires, fêtes privées, séminaires, fêtes d'entreprise et réceptions.",
   compo:["Agneau ou chevreau entier","Salade, riz, boulgour, chekhchouka","Pommes risolées ou légumes sautés","Service sur place possible"],
   pres:"Pour vos mariages, vos anniversaires, vos fêtes privées, vos séminaires, vos fêtes d'entreprise et vos réceptions. Un agneau ou un chevreau entier, découpé et servi avec la salade, le riz, le boulgour, la chekhchouka, et les pommes risolées ou les légumes sautés. Le service sur place est possible, à préciser au moment de la commande.",
   photos:['packs/mechoui-1.jpg','packs/mechoui-2.jpg','packs/mechoui-3.jpg','packs/mechoui-4.jpg','packs/mechoui-5.jpg']},
  {id:'buffet', cible:'entreprise', nom:'Buffet', prix:null, img:'packs/vignettes/buffet-1.jpg', cat:'Réception',
   d:"Pour vos mariages, anniversaires, fêtes privées, séminaires, fêtes d'entreprise et réceptions. Menu personnalisé selon vos envies et votre budget.",
   compo:["Menu composé avec vous","Entrées, plats, desserts","Service et personnel sur demande"],
   pres:"Pour les mariages, les anniversaires, les fêtes privées, les séminaires, les fêtes d'entreprise et les réceptions. Le menu se compose avec vous, entrées, plats et desserts, selon le nombre de convives et le budget. Le service et le personnel peuvent être inclus sur demande.",
   photos:['packs/buffet-1.jpg','packs/buffet-2.jpg','packs/buffet-3.jpg','packs/buffet-4.jpg']}
];

/* ---------- Petits utilitaires ---------- */
/* Neutralise une valeur avant de l'écrire dans la page. Les guillemets comptent
   aussi : un nom d'établissement entre dans un attribut alt, title ou onclick. */
function esc(t){
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
/* Un montant ne se coupe pas en fin de ligne : « 21 182 DA » doit rester d'un
   bloc, sinon la colonne se casse et le « DA » part seul a la ligne. */
function fmt(n){
  return (n.toLocaleString('fr-FR') + ' DA').replace(/[   ]/g, ' ');
}
/* Le meme montant pour un texte qui part sur WhatsApp : la, des espaces
   ordinaires suffisent. */
function sansInsecables(t){ return String(t).replace(/[  ]/g, ' '); }
function load(k, d){ try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function cofImg(c){ return c.imgData || ('img/' + (c.img || 'c-standard.jpg')); }
/* Les vues d'un pack. Le chemin est écrit sans « img/ » dans les données, comme
   pour l'image de la carte : une seule convention à retenir. */
function photoPack(p){ return 'img/' + p; }
function findCof(id){ return COFFRETS.filter(function(c){ return c.id === id; })[0] || null; }
function findCofByNom(nom){ return COFFRETS.filter(function(c){ return c.nom === nom; })[0] || null; }
function waLink(texte){ return 'https://wa.me/' + TEL_WHATSAPP + '?text=' + encodeURIComponent(sansInsecables(texte)); }
/* Le numéro d'un client vers un lien WhatsApp. Les numéros sont saisis à
   l'algérienne (0550 11 22 33) : on garde les chiffres, on retire le zéro de
   tête et on met l'indicatif du pays devant. */
function waClient(tel){
  var n = String(tel || '').replace(/\D/g, '');
  if(n.charAt(0) === '0') n = n.substring(1);
  return 'https://wa.me/213' + n;
}

/* ---------- L'argent ----------
   Le traiteur travaille en TTC : les prix qu'il donne, et que le site affiche,
   sont les prix payés. Aucun écran ne nomme la taxe, et aucun calcul ne
   l'ajoute. Décision de Massyl le 9 novembre 2026.

   Les deux fonctions restent, à l'identique, pour ne pas toucher à tous les
   appels d'un coup : elles ne calculent plus rien. Si un jour le client repasse
   en hors taxes, c'est ici et nulle part ailleurs. */
var TAUX_TVA = 0;
function tvaDe(montant){ return 0; }
function ttcDe(montant){ return montant || 0; }

/* ---------- Le traiteur ----------
   Ses mentions légales, recopiées de ses propres offres de prix de 2025. Rien ne
   les affiche aujourd'hui : elles ne servaient qu'au pied de la facture, retirée
   le 01/10/2026. Elles restent ici parce qu'elles viennent de ses vrais
   documents et serviront au devis et aux mentions du site. Le téléphone,
   l'adresse et l'email viennent des constantes du haut, pour qu'une correction
   n'ait qu'un seul endroit à faire. */
var ENTREPRISE = {
  raison: 'Eurl ERRIANE foods',
  capital: '200 000,00 DA',
  rc: '16/00 0990918 B 12',
  nif: '001216099091871',
  ai: '16184857053',
  nis: '001216180259938',
  rib: '01100605700018005410',
  banque: 'CNEP BANQUE LES VERGERS'
};

/* ---------- État persistant ---------- */
var USER = load('erri_user', null);
var LINES = load('erri_lines', []);
var ORDERS = load('erri_orders', null) || [];
var PAYMENTS = load('erri_pays', null) || [];

/* Le catalogue des coffrets est écrit ici, dans le code, et c'est lui qui fait foi :
   une correction de prix y arrive donc toujours, même chez un visiteur déjà venu.
   Le navigateur ne garde qu'une chose : ce que le traiteur a changé lui-même depuis
   l'onglet Catalogue de son espace, rangé par identifiant de coffret.

   Trois sortes de clés se rencontrent dans erri_cofs :
     un identifiant de coffret   ce qu'il a changé sur ce coffret : prix, nom,
                                 rubrique, description, photo, ou cache
     __ordre                     la liste des identifiants, dans l'ordre voulu
     __perso                     les coffrets qu'il a créés lui-même
   Les deux tirets bas sont là pour qu'un identifiant de coffret ne puisse jamais
   tomber sur une de ces deux clés. Pour tout remettre d'aplomb, il suffit
   d'effacer erri_cofs : le site repart sur le catalogue du code. C'est ce que fait
   le bouton « Revenir au catalogue du site ».

   Une visite antérieure, elle, enregistrait le catalogue entier. Cette ancienne
   forme n'a rien de plus que le catalogue du code : on l'oublie. C'est ce qui fait
   qu'un navigateur qui gardait l'ancienne copie voit enfin les présentations, les
   photos et les coffrets ajoutés depuis. */
var CLE_CATALOGUE = 'erri_cofs';
var cofsChanges = load(CLE_CATALOGUE, null) || {};
if(Array.isArray(cofsChanges)){
  cofsChanges = {};
  save(CLE_CATALOGUE, cofsChanges);
}
function enregistrerCatalogue(){ save(CLE_CATALOGUE, cofsChanges); }

/* Un coffret du code, avec ce que le traiteur a changé par-dessus. Le test porte
   sur la présence de la clé, pas sur sa valeur : un prix mis à null veut dire
   « Sur demande », et doit donc s'appliquer comme les autres. */
function coffretModifie(d){
  var c = JSON.parse(JSON.stringify(d));
  var o = cofsChanges[d.id];
  if(!o) return c;
  ['prix', 'nom', 'd', 'cat', 'img', 'pres'].forEach(function(k){
    if(k in o) c[k] = o[k];
  });
  if('compo' in o) c.compo = o.compo || [];
  if('photos' in o) c.photos = o.photos || [];
  if(o.choices) c.choices = o.choices;
  if(o.imgData) c.imgData = o.imgData;
  c.cache = o.cache === true;
  return c;
}

/* Le catalogue dans l'ordre voulu : les coffrets du code, puis ceux que le
   traiteur a créés, et par-dessus l'ordre qu'il a réglé. Un coffret qui n'a pas
   de rang garde sa place à la suite : un ordre enregistré avant l'ajout d'un
   coffret reste donc utilisable.

   Les coffrets créés ici passent par `coffretModifie` comme ceux du code : sans
   ça, les retouches faites après leur création (prix, nom, photos) s'écriraient
   sans jamais être relues, et le traiteur croirait avoir enregistré. */
function reconstruireCatalogue(){
  var tous = DEFAULT_COFFRETS.map(coffretModifie)
    .concat((cofsChanges.__perso || []).map(coffretModifie));
  var ordre = cofsChanges.__ordre;
  if(Array.isArray(ordre) && ordre.length){
    var rang = {};
    ordre.forEach(function(id, i){ rang[id] = i; });
    tous.forEach(function(c, i){ if(!(c.id in rang)) rang[c.id] = ordre.length + i; });
    tous.sort(function(a, b){ return rang[a.id] - rang[b.id]; });
  }
  TOUS_COFFRETS = tous;
  /* Le site ne voit que les coffrets montrés. Le traiteur, lui, les voit tous :
     c'est ce qui lui permet de remontrer un coffret qu'il avait caché. */
  COFFRETS = tous.filter(function(c){ return !c.cache; });
}

var TOUS_COFFRETS = [];
var COFFRETS = [];
reconstruireCatalogue();

/* ---------- L'espace de la page ----------
   Depuis le 30/09/2026, le site n'a plus qu'un espace marchand : celui des
   entreprises, avec des comptes, un panier et des commandes suivies. Le
   visiteur qui cherche un repas pour lui est envoyé sur la boutique Yassir
   d'Erriane, qui vend à l'assiette et livre. Il n'y a donc plus de page
   `particuliers.html`.

   `index.html` reste en data-espace="accueil" : c'est l'aiguillage, il ne vend
   rien et ne doit pas se comporter comme la page entreprises.

   Reste en place, mais endormi : le mode « particulier » et `estParticulier()`,
   parce que le chemin sans compte qui partait sur le WhatsApp du traiteur est
   tissé dans `panier.js`. Aucune page ne le déclenche plus. À retirer le jour où
   le panier passera à Supabase, pas avant : le toucher aujourd'hui risquerait de
   casser le parcours entreprises, qui est celui qui tourne. */
var ESPACE = (document.body && document.body.getAttribute('data-espace')) || 'entreprise';
function estParticulier(){ return ESPACE === 'particulier'; }

/* Comment le traiteur parle de ses commandes. Il ne « confirme » pas : il
   valide une commande recue. Le client, lui, lit autre chose : voir
   ST_LABEL_CLIENT juste en dessous. */
var ST_LABEL = {attente:'En attente', confirmee:'Validée', annulee:'Annulée', reportee:'Autre date proposée'};

/* Les mêmes états, dits au client. Le traiteur parle de « commande confirmée »
   dans son espace ; le client, lui, lit ce qui se passe pour lui : sa commande
   est validée et le traiteur s'en occupe. Un seul état, deux façons de le dire,
   et un seul endroit pour les changer. */
var ST_LABEL_CLIENT = {
  attente:'En attente',
  confirmee:'Validée et en cours de traitement',
  annulee:'Annulée',
  reportee:'Autre date proposée'
};

/* Ce qu'un client doit, et ce qu'il a payé. Les deux sont en dinars sonnants,
   donc TTC : le client règle la facture, et les prix du site sont déjà TTC. Un
   versement se compare donc directement aux commandes validées. */
function dueFor(email){
  return ORDERS.filter(function(o){ return o.client.email === email && o.st === 'confirmee'; })
    .reduce(function(t, o){ return t + ttcDe(o.total); }, 0);
}
function paidFor(email){
  return PAYMENTS.filter(function(x){ return x.email === email && x.st === 'enc'; })
    .reduce(function(t, x){ return t + x.montant; }, 0);
}
function balFor(email){ return dueFor(email) - paidFor(email); }
/* Les comptes connus sur cet appareil, pour la fenêtre de connexion et pour les
   écrans de travail du traiteur. Il n'y a pas encore de base : la liste se
   fabrique à partir des commandes passées, plus les clients que le traiteur a
   inscrits lui-même (voir CLIENTS plus bas).

   Les commandes passent en premier : ce que le client a écrit de sa main fait
   foi sur ce que le traiteur a recopié au téléphone.

   Une commande passée avant le 30/09/2026 par un particulier n'a pas d'email :
   le côté particuliers ne demandait aucun compte. Ces commandes dorment encore
   dans le navigateur du traiteur. Sans ce garde, elles fabriqueraient un faux
   compte, avec un nom d'établissement vide, proposé à la connexion. Les
   commandes d'aujourd'hui ont toutes un email, mais le garde reste. */
function clientsList(){
  var seen = {}, out = [];
  function ajouter(c){
    if(!c || !c.email) return;
    var cle = String(c.email).toLowerCase();
    if(seen[cle]) return;
    seen[cle] = 1;
    out.push(c);
  }
  ORDERS.forEach(function(o){ ajouter(o.client); });
  CLIENTS.forEach(ajouter);
  return out;
}

/* ---------- La fiche d'un client ----------
   Ce que le traiteur sait d'un client en plus de ses commandes. L'identité, elle,
   continue de se déduire des commandes (clientsList) tant qu'il n'y a pas de
   base. Les mentions légales qu'on y rangeait pour la facture ne sont plus
   demandées depuis le 01/10/2026. */
var CLIENTS = load('erri_clients', []);
function enregistrerClients(){ save('erri_clients', CLIENTS); }
/* L'email identifie le client. On le compare sans tenir compte de la casse :
   « Amel@Merinal.dz » et « amel@merinal.dz » sont la même personne. Sans ça, le
   traiteur qui inscrit deux fois le même client en changeant une majuscule lui
   fabrique une deuxième fiche, et les deux moitiés de son dossier se séparent. */
function ficheClient(email){
  if(!email) return null;
  var e = String(email).toLowerCase();
  return CLIENTS.filter(function(c){ return String(c.email).toLowerCase() === e; })[0] || null;
}
/* Crée la fiche au premier besoin : dès que le traiteur écrit une information
   sur un client, la fiche se crée toute seule. */
function assurerFiche(email, etab, nom){
  if(!email) return null;
  var f = ficheClient(email);
  if(!f){ f = {email:email, etab:etab || '', nom:nom || ''}; CLIENTS.push(f); enregistrerClients(); }
  return f;
}
function majMentions(email, champ, valeur, etab, nom){
  var f = assurerFiche(email, etab, nom);
  if(!f) return;
  f[champ] = (valeur || '').trim();
  enregistrerClients();
}

/* Inscrire un client depuis l'espace traiteur. C'est le geste qui remplace
   l'inscription en ligne pour ceux qui ne sont pas à l'aise avec : beaucoup de
   clients d'Erriane commandent par téléphone, et le traiteur tient leurs comptes
   lui-même.
   L'email identifie le client : réinscrire le même met à jour sa fiche au lieu
   d'en créer une deuxième. On ne se fie pas à la casse, « Amel@X.dz » et
   « amel@x.dz » sont la même personne. */
function enregistrerClientFiche(etab, nom, tel, email){
  email = (email || '').trim();
  var f = ficheClient(email);
  if(!f){
    f = {email: email, etab: '', nom: '', tel: ''};
    CLIENTS.push(f);
  }
  f.etab = (etab || '').trim();
  f.nom = (nom || '').trim();
  f.tel = (tel || '').trim();
  enregistrerClients();
  return f;
}

/* ---------- Les versements ---------- */
function enregistrerPaiements(){ save('erri_pays', PAYMENTS); }
/* Ce qui est dû, ce qui est encaissé, ce qui reste. Un chèque en attente
   d'encaissement ne réduit pas le solde : l'argent n'est pas arrivé. */
function soldeClient(email){ return balFor(email); }

/* ---------- Les bons de commande ----------
   Le client d'une entreprise joint parfois son bon de commande. Son nom est
   rangé sur la commande ; son contenu vit à part, sous `erri_bdc`, rangé par
   référence de commande. Deux raisons à cette séparation : la mémoire du
   navigateur est petite, et une commande doit s'enregistrer même si la pièce
   jointe, elle, ne rentre pas. La lecture se fait ici parce que l'espace
   traiteur en a besoin, et l'écriture dans panier.js, du côté du client. */
function bonDeCommande(ref){
  var bons = load('erri_bdc', null) || {};
  return bons[ref] || null;
}
