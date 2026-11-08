/* Erriane Foods — Espace traiteur, socle.
   Ce fichier porte ce qui sert à tous les onglets : l'état de l'écran, la
   recherche d'une commande, les chiffres du haut et les filtres. Le contenu de
   chaque onglet est dans son propre fichier (admin-commandes.js,
   admin-clients.js, admin-livreurs.js, admin-catalogue.js, admin-paiements.js,
   admin-medias.js) pour qu'aucun ne
   devienne illisible. L'onglet Facturation a été retiré le 1er octobre 2026 :
   le traiteur a déjà son logiciel pour ça.

   En attendant Supabase, l'accès est direct et les données vivent dans le
   navigateur, comme partout ailleurs sur ce site. Le compte du traiteur, avec
   mot de passe, arrivera avec la base de données. */

var ADM = {
  onglet: 'commandes',
  /* Filtres de la liste des commandes. La plage du/au est vide par défaut :
     le traiteur voit tout, puis il resserre. Le filtre des livreurs sert aussi
     à l'onglet Livreurs, qui y renvoie pour montrer une tournée. `__aucun`
     veut dire « les commandes validées que personne n'a prises ». */
  fStatut: 'tous',
  du: '',
  au: '',
  fLivreur: '',
  q: ''
};

var PANNEAUX = ['commandes', 'clients', 'livreurs', 'catalogue', 'paiements', 'medias'];

/* ---------- Trouver et enregistrer ---------- */
function laCommande(ref){
  return ORDERS.filter(function(o){ return o.ref === ref; })[0] || null;
}
function enregistrerCommandes(){
  save('erri_orders', ORDERS);
}

/* Un texte qui entre dans un attribut onclick (un nom d'établissement, un email,
   un nom de livreur) peut porter une apostrophe : il faut l'échapper pour le
   JavaScript, puis pour le HTML. Même geste que dans la fenêtre de connexion
   (js/compte.js). Deux onglets s'en servent, donc il vit ici. */
function argJs(txt){
  return esc(String(txt === undefined || txt === null ? '' : txt).replace(/'/g, "\\'"));
}

/* ---------- Les livreurs ----------
   Aucun nom n'est écrit d'avance. La liste se remplit avec les noms que le
   traiteur saisit lui-même, et se garde dans le navigateur. Elle sert à deux
   choses : lui proposer les noms qu'il a déjà écrits, et lui montrer ce que
   chacun a à livrer (onglet Livreurs, js/admin-livreurs.js). */
function listeLivreurs(){ return load('erri_livreurs', []); }
function enregistrerLivreurs(l){ save('erri_livreurs', l.sort()); }
function ajouterLivreur(nom){
  nom = (nom || '').trim();
  if(!nom) return;
  var l = listeLivreurs();
  if(l.indexOf(nom) < 0){ l.push(nom); enregistrerLivreurs(l); }
}
/* Corriger un nom ne doit pas séparer ses livraisons en deux : les commandes qui
   portaient l'ancien suivent. Sans ça, le traiteur qui corrige « Sofianne » en
   « Sofiane » perdrait de vue les tournées déjà affectées. */
function renommerLivreur(ancien, nouveau){
  nouveau = (nouveau || '').trim();
  if(!nouveau || nouveau === ancien) return false;
  var l = listeLivreurs();
  var i = l.indexOf(ancien);
  if(i >= 0){
    /* Le nom existe déjà : on réunit les deux, on n'en garde qu'un. */
    if(l.indexOf(nouveau) >= 0) l.splice(i, 1);
    else l[i] = nouveau;
  } else if(l.indexOf(nouveau) < 0){
    /* L'ancien n'était pas dans la liste (il en a été retiré, ou il n'a été écrit
       que sur une commande) : le nouveau y entre, puisque ses commandes le
       portent. Un nom corrigé doit rester visible. */
    l.push(nouveau);
  }
  enregistrerLivreurs(l);
  var touchees = 0;
  ORDERS.forEach(function(o){
    if(o.prep && o.prep.livreur === ancien){ o.prep.livreur = nouveau; touchees++; }
  });
  if(touchees) enregistrerCommandes();
  return true;
}
function retirerLivreur(nom){
  enregistrerLivreurs(listeLivreurs().filter(function(n){ return n !== nom; }));
}

/* ---------- Les chiffres du haut ----------
   Ils portent sur toutes les commandes, jamais sur la sélection : ce sont des
   repères, pas le résultat d'un filtre. */
function chiffres(){
  var conf = ORDERS.filter(function(o){ return o.st === 'confirmee'; });
  var ht = conf.reduce(function(t, o){ return t + (o.total || 0); }, 0);
  return {
    attente: ORDERS.filter(function(o){ return o.st === 'attente'; }).length,
    confirmee: conf.length,
    ht: ht,
    tva: tvaDe(ht),
    ttc: ttcDe(ht)
  };
}
function blocChiffre(valeur, libelle, accent){
  return '<div class="adm-chiffre' + (accent ? ' adm-chiffre--accent' : '') + '">' +
    '<b>' + valeur + '</b><span>' + esc(libelle) + '</span></div>';
}

/* ---------- La sélection des commandes ----------
   Trois filtres qui se cumulent : le statut, une plage de jours, et une
   recherche libre. Une plage vide veut dire « toutes les dates ». */
function dansLaPlage(date){
  if(ADM.du && date < ADM.du) return false;
  if(ADM.au && date > ADM.au) return false;
  return true;
}
function commandesFiltrees(){
  return ORDERS.filter(function(o){
    if(ADM.fStatut !== 'tous' && o.st !== ADM.fStatut) return false;
    if(!dansLaPlage(o.date)) return false;
    if(ADM.fLivreur){
      var lv = (o.prep && o.prep.livreur) || '';
      if(ADM.fLivreur === '__aucun'){ if(lv) return false; }
      else if(lv !== ADM.fLivreur) return false;
    }
    if(ADM.q){
      var c = o.client || {};
      /* Le livreur compte dans la recherche : « Sofiane » doit retrouver sa
         tournée, et c'est aussi ce que fait le bouton de l'onglet Livreurs. */
      var txt = [o.ref, c.etab, c.nom, c.email, o.tel, o.lieu, (o.prep && o.prep.livreur) || '']
        .join(' ').toLowerCase();
      if(txt.indexOf(ADM.q.toLowerCase()) < 0) return false;
    }
    return true;
  }).sort(function(a, b){
    return String(a.date + a.heure).localeCompare(String(b.date + b.heure));
  });
}
/* Le libellé de la plage, dit en français, pour l'en-tête de la feuille. */
function libelleePlage(){
  if(ADM.du && ADM.au) return ADM.du === ADM.au ? frDate(ADM.du) : 'du ' + frDate(ADM.du) + ' au ' + frDate(ADM.au);
  if(ADM.du) return 'à partir du ' + frDate(ADM.du);
  if(ADM.au) return 'jusqu\'au ' + frDate(ADM.au);
  return 'toutes dates';
}
/* Le cachet du client, pour les écrans de travail du traiteur : l'établissement
   quand il y en a un, le nom de la personne sinon. */
function nomClient(o){
  var c = o.client || {};
  return c.etab || c.nom || 'Particulier';
}
/* Sur la feuille de production, on ne met que l'établissement, jamais un nom de
   personne. Un particulier n'a pas d'établissement : son bloc dit
   « Particulier » et se repère à son heure de livraison, comme les autres.
   Rien à ajouter ici sans en parler à Massyl : sa règle est que la feuille qui
   circule en cuisine ne porte aucune donnée du client. */
function etiquetteFeuille(o){
  var c = o.client || {};
  return c.etab || 'Particulier';
}

/* ---------- Imprimer ----------
   Un seul document s'imprime à la fois. On pose sur la page ce qu'on imprime,
   on laisse le navigateur faire, puis on retire la marque. Sans elle, un
   Ctrl+P imprimerait l'écran tel quel. */
function imprimer(type){
  document.body.setAttribute('data-impression', type);
  window.print();
}
window.addEventListener('afterprint', function(){
  document.body.removeAttribute('data-impression');
});

/* ---------- Navigation entre les panneaux ---------- */
function ongletAdmin(id){
  ADM.onglet = id;
  document.body.removeAttribute('data-impression');
  PANNEAUX.forEach(function(x){
    var p = document.getElementById('panneau-' + x);
    if(p) p.hidden = (x !== id);
  });
  var boutons = document.querySelectorAll('.adm-onglet');
  for(var i = 0; i < boutons.length; i++){
    boutons[i].classList.toggle('on', boutons[i].getAttribute('data-onglet') === id);
  }
  if(id === 'commandes') rendreCommandes();
  if(id === 'clients') rendreClients();
  if(id === 'livreurs') rendreLivreurs();
  if(id === 'catalogue') rendreCatalogue();
  if(id === 'paiements') rendrePaiements();
  if(id === 'medias') rendreMedias();
}

/* ---------- Démarrage ---------- */
document.addEventListener('DOMContentLoaded', function(){
  poserToast();
  rendreCommandes();
  rendreClients();
  rendreLivreurs();
  rendreCatalogue();
  rendrePaiements();
  rendreMedias();

  /* admin/?onglet=paiements ouvre directement un onglet : le traiteur peut s'en
     faire un raccourci sur son téléphone. */
  var demande = (location.search.match(/[?&]onglet=([a-z]+)/) || [])[1];
  if(demande && PANNEAUX.indexOf(demande) >= 0) ongletAdmin(demande);
});
