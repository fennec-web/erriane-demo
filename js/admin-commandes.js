/* Erriane Foods — Espace traiteur, onglet Commandes.
   La liste, la fiche d'une commande, la composition que le traiteur décide pour
   chaque ligne, et la feuille de production qu'il emporte en cuisine. */

/* ---------- Les filtres ---------- */
function majFiltre(champ, valeur){
  ADM[champ] = valeur;
  rendreCommandes();
}
function viderFiltres(){
  ADM.fStatut = 'tous'; ADM.du = ''; ADM.au = ''; ADM.q = ''; ADM.fLivreur = '';
  var s = document.getElementById('f-statut'); if(s) s.value = 'tous';
  var d = document.getElementById('f-du'); if(d) d.value = '';
  var a = document.getElementById('f-au'); if(a) a.value = '';
  var q = document.getElementById('f-q'); if(q) q.value = '';
  var l = document.getElementById('f-livreur'); if(l) l.value = '';
  rendreCommandes();
}

/* La liste des livreurs du filtre se remplit comme celle du catalogue : écrite
   par le script, donc elle suit ce que le traiteur inscrit dans l'onglet
   Livreurs sans qu'on ait deux listes à tenir. */
function remplirFiltreLivreurs(){
  var sel = document.getElementById('f-livreur');
  if(!sel) return;
  var garde = sel.value;
  sel.innerHTML = '<option value="">Tous les livreurs</option>' +
    '<option value="__aucun">Sans livreur</option>' +
    listeLivreurs().map(function(n){
      return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    }).join('');
  if(garde && [].some.call(sel.options, function(o){ return o.value === garde; })) sel.value = garde;
}

/* ---------- La liste ----------
   data-libelle porte le nom de la colonne. Sur un téléphone, le tableau se
   change en fiches (voir admin.css) et l'étiquette suit chaque valeur : sans
   elle, une fiche ne dit plus à quoi correspond un montant. */
function ligneCommande(o){
  var c = o.client || {};
  var nb = o.lignes.reduce(function(t, l){ return t + l.qty; }, 0);
  return '<tr>' +
    '<td data-libelle="Référence"><b>' + esc(o.ref) + '</b></td>' +
    '<td data-libelle="Client">' + esc(nomClient(o)) + (c.nom && c.etab ? '<span class="adm-sous">' + esc(c.nom) + '</span>' : '') + '</td>' +
    '<td data-libelle="Livraison">' + frDate(o.date) + '<span class="adm-sous">' + esc(o.heure) + '</span></td>' +
    '<td data-libelle="Lieu">' + esc(o.lieu) + '</td>' +
    '<td data-libelle="Unités">' + nb + '<span class="adm-sous">' + o.lignes.length + ' ligne' + (o.lignes.length > 1 ? 's' : '') + '</span></td>' +
    '<td data-libelle="Total"><b>' + fmt(ttcDe(o.total)) + '</b><span class="adm-sous">HT ' + fmt(o.total) + '</span></td>' +
    '<td data-libelle="Statut"><span class="etat etat--' + o.st + '">' + esc(ST_LABEL[o.st] || o.st) + '</span></td>' +
    '<td data-libelle="Livreur">' + esc((o.prep && o.prep.livreur) || 'non affecté') + '</td>' +
    '<td data-libelle=""><button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ouvrirDetails(\'' + esc(o.ref) + '\')">Détails</button></td>' +
    '</tr>';
}

function rendreCommandes(){
  remplirFiltreLivreurs();
  var c = chiffres();
  var zone = document.getElementById('adm-chiffres');
  if(zone) zone.innerHTML =
    blocChiffre(c.attente, 'En attente', true) +
    blocChiffre(c.confirmee, 'Validées') +
    blocChiffre(fmt(c.ttc), 'Facturé TTC') +
    blocChiffre(fmt(c.tva), 'dont TVA');

  var l = commandesFiltrees();
  var liste = document.getElementById('adm-liste');
  if(liste) liste.innerHTML = l.length
    ? '<div class="adm-tableau adm-tableau--fiches"><table class="adm-table"><thead><tr>' +
        '<th>Référence</th><th>Client</th><th>Livraison</th><th>Lieu</th>' +
        '<th>Unités</th><th>Total</th><th>Statut</th><th>Livreur</th><th></th>' +
      '</tr></thead><tbody>' + l.map(ligneCommande).join('') + '</tbody></table></div>'
    : '<div class="adm-vide">Aucune commande ne correspond à cette sélection.</div>';

  var compte = document.getElementById('adm-compte');
  if(compte) compte.textContent =
    l.length + (l.length > 1 ? ' commandes affichées' : ' commande affichée') +
    ' sur ' + ORDERS.length + '. Sélection : ' + libelleePlage() + '.';

  var resume = document.getElementById('feuille-resume');
  if(resume) resume.textContent = libelleePlage();

  rendreFeuille();
}

/* ---------- La fiche d'une commande ---------- */
function ligneFiche(libelle, valeur){
  return '<div><span>' + esc(libelle) + '</span><b>' + esc(valeur || 'non renseigné') + '</b></div>';
}
/* Une ligne de la commande, avec ce que le traiteur décide de servir. Ces cinq
   champs disent au client ce qu'il va manger, et à la cuisine quoi préparer :
   entrée, plat, garnitures, dessert, boisson.

   Chaque champ SUGGÈRE les valeurs du coffret sans les imposer : on tape trois
   lettres, la liste propose, et on peut toujours écrire autre chose. Le traiteur
   compose selon la saison et les produits, une liste fermée deviendrait fausse au
   premier changement (Massyl, 29 octobre 2026).

   L'exemple dans le champ montre comment écrire une répartition, parce qu'un
   client qui commande dix coffrets ne prend pas dix fois la même chose :
   « 6 poulet, 4 veau ». C'est ce texte que la feuille de cuisine imprime. */
function champsCompo(o, l, i){
  var c = findCof(l.cofId) || {};
  var ch = c.choices || {};
  function liste(){
    var vus = {}, out = [];
    for(var k = 0; k < arguments.length; k++){
      (arguments[k] || []).forEach(function(x){
        if(!vus[x]){ vus[x] = 1; out.push(x); }
      });
    }
    return out;
  }
  function champ(cle, libelle, suggestions, exemple){
    var id = 'dl-' + String(o.ref).replace(/[^a-z0-9]/gi, '') + '-' + i + '-' + cle;
    return '<input type="text" list="' + id + '" value="' + esc(l[cle] || '') +
      '" placeholder="' + esc(l[cle] ? libelle : exemple) +
      '" aria-label="' + esc(libelle) + ' pour ' + esc(l.nom) + '"' +
      ' onchange="majLigne(\'' + esc(o.ref) + '\',' + i + ',\'' + cle + '\',this.value)">' +
      '<datalist id="' + id + '">' + suggestions.map(function(x){
        return '<option value="' + esc(x) + '"></option>';
      }).join('') + '</datalist>';
  }
  return '<div class="adm-compo">' +
    '<div class="adm-compo__tete"><b>' + l.qty + ' &times; ' + esc(l.nom) + '</b>' +
      '<span>' + fmt(l.qty * l.pu) + '</span></div>' +
    '<div class="adm-compo__champs">' +
      champ('entree', 'Entrée', liste(ch.entryFroides, ch.entryChaudes), 'Entrée') +
      champ('viande', 'Plat', liste(ch.viandesBlanches, ch.viandesRouges), '6 poulet, 4 veau') +
      champ('garnitures', 'Garnitures', liste(ch.garnitures), '2 riz, 8 frites') +
      champ('dessert', 'Dessert', liste(ch.dessert, DESSERTS), '5 fruits, 5 pâtisseries') +
      champ('boisson', 'Boisson', liste(BOISSONS), 'Boisson') +
    '</div></div>';
}
/* Le bon de commande que le client a joint. Son nom est toujours là ; le
   fichier lui-même n'est ouvrable que si le navigateur a pu le garder, ce qui
   arrive tant qu'il reste léger (voir panier.js). Le téléchargement plutôt
   qu'un nouvel onglet : un navigateur refuse d'ouvrir une pièce jointe posée
   dans l'adresse de la page. */
function blocBonDeCommande(o){
  var b = bonDeCommande(o.ref);
  var action = (b && b.data)
    ? '<a class="bouton bouton--secondaire bouton--petit" download="' + esc(b.nom) + '" href="' + esc(b.data) + '">Télécharger le bon</a>'
    : '<span class="adm-sous">Fichier non conservé sur cet appareil : demandez-le au client.</span>';
  return '<div class="adm-actions"><div>' +
    '<b>Bon de commande</b><span class="adm-sous">' + esc(o.bdc) + '</span></div>' + action +
    '</div>';
}
function corpsDetails(o){
  var c = o.client || {};
  return '<h2 style="margin:0 0 4px">Commande ' + esc(o.ref) + '</h2>' +
    '<p style="margin:0 0 var(--espace-4)"><span class="etat etat--' + o.st + '">' +
      esc(ST_LABEL[o.st] || o.st) + '</span></p>' +

    '<div class="adm-fiche">' +
      ligneFiche('Établissement', c.etab || 'Particulier') +
      ligneFiche('Contact', c.nom) +
      ligneFiche('Téléphone', o.tel || c.tel) +
      ligneFiche('Email', c.email) +
      ligneFiche('Livraison', frDate(o.date) + ' à ' + o.heure) +
      ligneFiche('Lieu', o.lieu) +
      ligneFiche('Livreur', (o.prep && o.prep.livreur) || 'non affecté') +
    '</div>' +
    (o.note ? '<p style="margin:0 0 var(--espace-3)"><b>Note du client :</b> ' + esc(o.note) + '</p>' : '') +
    (o.rep ? '<p style="margin:0 0 var(--espace-3)"><b>Autre date proposée :</b> ' + frDate(o.rep) + '</p>' : '') +
    (o.bdc ? blocBonDeCommande(o) : '') +

    '<h3 class="adm-titre">Ce qui est servi</h3>' +
    '<p class="adm-aide">Pour la cuisine et la feuille de production. Le client ne voit rien de ce que vous écrivez ici.</p>' +
    o.lignes.map(function(l, i){ return champsCompo(o, l, i); }).join('') +

    '<div class="adm-totaux">' +
      '<div><span>Total HT</span><span>' + fmt(o.total) + '</span></div>' +
      '<div><span>TVA 19 %</span><span>' + fmt(tvaDe(o.total)) + '</span></div>' +
      '<div><span>Total TTC</span><span>' + fmt(ttcDe(o.total)) + '</span></div>' +
    '</div>' +

    '<div class="adm-actions">' +
      '<button type="button" class="bouton bouton--accent bouton--petit" onclick="changerStatut(\'' + esc(o.ref) + '\', \'confirmee\')">Valider la commande</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="changerStatut(\'' + esc(o.ref) + '\', \'attente\')">Remettre en attente</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="changerStatut(\'' + esc(o.ref) + '\', \'annulee\')">Annuler</button>' +
    '</div>' +

    '<div class="adm-actions">' +
      '<div class="adm-actions__groupe">' +
        '<div><label for="det-rep">Proposer une autre date</label>' +
        '<input type="date" id="det-rep" value="' + (o.rep || '') + '"></div>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="proposerDate(\'' + esc(o.ref) + '\')">Proposer cette date</button>' +
      '</div>' +
    '</div>' +

    '<div class="adm-actions">' +
      '<div class="adm-actions__groupe">' +
        '<div><label for="det-livreur">Livreur</label>' +
        '<input type="text" id="det-livreur" list="det-livreurs" value="' + esc((o.prep && o.prep.livreur) || '') + '" placeholder="Nom du livreur">' +
        '<datalist id="det-livreurs">' + listeLivreurs().map(function(n){
          return '<option value="' + esc(n) + '"></option>';
        }).join('') + '</datalist></div>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="affecterLivreur(\'' + esc(o.ref) + '\')">Affecter ce livreur</button>' +
      '</div>' +
    '</div>' +

    (o.tel || c.tel
      ? '<div class="adm-actions"><a class="bouton bouton--whatsapp bouton--petit" href="' +
        waClient(o.tel || c.tel) + '?text=' + encodeURIComponent(sansInsecables(messageClient(o))) +
        '" target="_blank" rel="noopener">Prévenir le client sur WhatsApp</a></div>'
      : '');
}

/* Le message que le traiteur envoie au client quand il fait avancer sa
   commande. Il part sur le WhatsApp du client, pas sur le sien. */
function messageClient(o){
  var l = o.lignes.map(function(x){ return x.qty + ' x ' + x.nom; }).join(', ');
  var debut = 'Bonjour, votre commande ' + o.ref + ' chez Erriane Foods';
  if(o.st === 'confirmee') debut += ' est validée et en cours de traitement.';
  else if(o.st === 'reportee') debut += ' est reportée au ' + frDate(o.rep) + '.';
  else if(o.st === 'annulee') debut += ' est annulée.';
  else debut += ' est de nouveau en attente.';
  return debut + ' ' + l + '. Livraison le ' + frDate(o.date) + ' à ' + o.heure +
    ', ' + o.lieu + '. Total TTC : ' + fmt(ttcDe(o.total)) + '.';
}

function ouvrirDetails(ref){
  poserModale('ov-det',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-det\')" aria-label="Fermer">&times;</button>' +
      '<div id="det-corps"></div>' +
    '</div>');
  document.getElementById('ov-det').setAttribute('onclick', "if(event.target===this)closeOv('ov-det')");
  var o = laCommande(ref);
  if(!o) return;
  document.getElementById('det-corps').innerHTML = corpsDetails(o);
  openOv('ov-det');
}
/* La fenêtre se redessine sur place, sinon elle se ferme et se rouvre à chaque
   clic et l'écran saute. */
function redessinerDetails(ref){
  var o = laCommande(ref);
  var corps = document.getElementById('det-corps');
  if(o && corps) corps.innerHTML = corpsDetails(o);
}

/* ---------- Faire avancer une commande ---------- */
function changerStatut(ref, st){
  var o = laCommande(ref);
  if(!o) return;
  /* On ne propose pas une autre date sans date : le client recevrait un
     message sans rendez-vous. */
  if(st === 'reportee' && !o.rep){ toast('Choisissez une date avant de la proposer.'); return; }
  o.st = st;
  if(st !== 'reportee') o.rep = null;
  enregistrerCommandes();
  toast('Commande ' + esc(o.ref) + ' : ' + esc(ST_LABEL[st]).toLowerCase() + '.');
  rendreCommandes();
  rendrePaiements();
  redessinerDetails(ref);
}
function proposerDate(ref){
  var o = laCommande(ref);
  var champ = document.getElementById('det-rep');
  if(!o || !champ) return;
  if(!champ.value){ toast('Choisissez une date avant de la proposer.'); return; }
  o.rep = champ.value;
  o.st = 'reportee';
  enregistrerCommandes();
  toast('Autre date proposée au client : ' + frDate(o.rep) + '.');
  rendreCommandes();
  rendrePaiements();
  redessinerDetails(ref);
}
function affecterLivreur(ref){
  var o = laCommande(ref);
  var champ = document.getElementById('det-livreur');
  if(!o || !champ) return;
  var nom = champ.value.trim();
  if(!o.prep) o.prep = {livreur:''};
  o.prep.livreur = nom;
  ajouterLivreur(nom);
  enregistrerCommandes();
  toast(nom ? 'Livreur affecté : ' + esc(nom) + '.' : 'Livreur retiré.');
  rendreCommandes();
  redessinerDetails(ref);
}

/* ---------- La composition d'une ligne ----------
   La fenêtre n'est pas redessinée : le traiteur remplit trois champs à la suite
   et doit rester où il en est. */
function majLigne(ref, i, champ, valeur){
  var o = laCommande(ref);
  if(!o || !o.lignes[i]) return;
  o.lignes[i][champ] = (valeur || '').trim();
  enregistrerCommandes();
  rendreFeuille();
  toast('Composition enregistrée pour ' + esc(o.lignes[i].nom) + '.');
}
/* ---------- La feuille de production ----------

   Elle circule dans la cuisine : elle ne porte que ce que la cuisine a besoin
   de savoir. Pas de nom de contact, pas de téléphone, pas d'email, pas
   d'adresse. Elle suit la sélection de l'écran, et ne garde que les commandes
   validées. */
function blocFeuille(o){
  var lignes = o.lignes.map(function(l){
    var compo = [['Entrée', l.entree], ['Plat', l.viande], ['Garnitures', l.garnitures],
                 ['Dessert', l.dessert], ['Boisson', l.boisson]]
      .filter(function(x){ return x[1]; })
      .map(function(x){ return '<b>' + esc(x[0]) + '</b> ' + esc(x[1]); })
      .join(' &middot; ');
    return '<li>' + l.qty + ' &times; ' + esc(l.nom) +
      (compo ? '<span class="feuille__compo">' + compo + '</span>' : '') + '</li>';
  }).join('');
  return '<div class="feuille__bloc">' +
    '<h3>' + esc(etiquetteFeuille(o)) + ' <span>' + esc(o.heure) +
    ((o.prep && o.prep.livreur) ? ' &middot; livreur ' + esc(o.prep.livreur) : ' &middot; livreur à affecter') +
    '</span></h3>' +
    '<ul>' + lignes + '</ul>' +
    '</div>';
}
function rendreFeuille(){
  var zone = document.getElementById('feuille-corps');
  if(!zone) return;

  var validees = commandesFiltrees().filter(function(o){ return o.st === 'confirmee'; });
  var parJour = {}, total = 0;
  validees.forEach(function(o){
    if(!parJour[o.date]) parJour[o.date] = [];
    parJour[o.date].push(o);
    o.lignes.forEach(function(l){ total += l.qty; });
  });
  var jours = Object.keys(parJour).sort();

  var corps = jours.map(function(j){
    var duJour = parJour[j].reduce(function(t, o){
      return t + o.lignes.reduce(function(s, l){ return s + l.qty; }, 0);
    }, 0);
    return '<h2 class="feuille__jour">' + frDate(j) +
      '<span>' + duJour + ' unités</span></h2>' +
      parJour[j].map(blocFeuille).join('');
  }).join('');

  zone.innerHTML =
    '<div class="feuille__tete">' +
      '<h2>Feuille de production</h2>' +
      '<span>' + esc(ADM.du || ADM.au ? libelleePlage() : 'toutes les commandes validées') + '</span>' +
    '</div>' +
    (jours.length
      ? corps + '<div class="feuille__total"><span>Unités à préparer</span><b>' + total + '</b></div>'
      : '<p style="margin:0;color:var(--couleur-texte-2)">Aucune commande validée dans cette sélection.</p>');
}
