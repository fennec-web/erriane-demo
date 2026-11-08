/* Erriane Foods — Espace traiteur, onglet Livreurs.
   Les noms se remplissent tout seuls quand le traiteur affecte un livreur à une
   commande. Cet écran sert à les tenir : inscrire un nom à l'avance, corriger
   une faute (les commandes déjà affectées suivent), retirer un nom qu'il
   n'utilise plus, et voir ce que chacun a à livrer.

   Ce qu'un livreur a à livrer, ce sont les commandes **validées** : une commande
   en attente n'est pas encore au camion, une commande reportée ou annulée non
   plus. Et la première ligne est celle qui compte le plus : les commandes
   validées que personne n'a prises. */

function unitesDe(o){
  return o.lignes.reduce(function(t, l){ return t + l.qty; }, 0);
}
function livraisonsDe(nom){
  var cherché = (nom || '').trim();
  return ORDERS.filter(function(o){
    return o.st === 'confirmee' && ((o.prep && o.prep.livreur) || '').trim() === cherché;
  }).sort(function(a, b){
    return String(a.date + a.heure).localeCompare(String(b.date + b.heure));
  });
}
/* Tous les noms à montrer : ceux de la liste, plus ceux que les commandes
   portent. Un nom retiré de la liste reste écrit sur ses commandes, et une
   tournée ne doit pas disparaître de cet écran parce qu'on a retiré le nom. */
function nomsLivreurs(){
  var vus = {}, out = [];
  function prendre(n){
    n = (n || '').trim();
    if(!n || vus[n]) return;
    vus[n] = 1;
    out.push(n);
  }
  listeLivreurs().forEach(prendre);
  ORDERS.forEach(function(o){ prendre((o.prep && o.prep.livreur) || ''); });
  return out.sort();
}

/* La prochaine livraison, dite en français, pour la ligne du tableau. */
function prochaineLivraison(l){
  if(!l.length) return '<span class="adm-sous">rien à livrer</span>';
  var o = l[0];
  return frDate(o.date) + '<span class="adm-sous">' + esc(o.heure) + ' · ' + esc(o.lieu) + '</span>';
}
/* Ce qui est déjà parti, et ce qui reste : un livreur qui a de la route derrière
   lui doit se voir aussi. */
function compteLivraisons(l){
  if(!l.length) return '0<span class="adm-sous">aucune commande validée</span>';
  var u = l.reduce(function(t, o){ return t + unitesDe(o); }, 0);
  return l.length + (l.length > 1 ? ' commandes' : ' commande') +
    '<span class="adm-sous">' + u + ' unités</span>';
}

/* Voir une tournée dans l'onglet Commandes : c'est là que vivent la fiche, la
   validation et la feuille de production, et le filtre par livreur y est posé
   (voir admin.js et la barre de filtres). */
function voirTournee(fLivreur, libelle){
  ADM.fLivreur = fLivreur;
  /* On montre les commandes validées, celles que la ligne du tableau compte :
     sinon le nombre annoncé et la liste affichée ne diraient pas la même chose. */
  ADM.fStatut = 'confirmee';
  var st = document.getElementById('f-statut');
  if(st) st.value = 'confirmee';
  ADM.q = '';
  var champ = document.getElementById('f-q');
  if(champ) champ.value = '';
  var sel = document.getElementById('f-livreur');
  if(sel) sel.value = fLivreur;
  ongletAdmin('commandes');
  toast(libelle + ' (commandes validées).');
}

function ligneLivreur(nom){
  var l = livraisonsDe(nom);
  /* Un nom qui n'est plus dans la liste garde sa ligne : ses commandes existent.
     Son bouton propose de le remettre, pas de le retirer une deuxième fois. */
  var declare = listeLivreurs().indexOf(nom) >= 0;
  return '<tr class="liv-ligne">' +
    '<td data-libelle="Livreur">' +
      '<input type="text" class="liv-nom" value="' + esc(nom) + '" aria-label="Nom du livreur"' +
        ' onchange="corrigerNomLivreur(\'' + argJs(nom) + '\', this.value)">' +
      (declare ? '' : '<span class="adm-sous">retiré de la liste</span>') +
    '</td>' +
    '<td data-libelle="À livrer">' + compteLivraisons(l) + '</td>' +
    '<td data-libelle="Prochaine">' + prochaineLivraison(l) + '</td>' +
    '<td data-libelle="" class="adm-actions-cellule">' +
      (l.length
        ? '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
          ' onclick="voirTournee(\'' + argJs(nom) + '\', \'Tournée de ' + argJs(nom) + '\')">Sa tournée</button>'
        : '') +
      (declare
        ? '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
          ' onclick="retirerLivreurDeLaListe(\'' + argJs(nom) + '\')">Retirer</button>'
        : '<button type="button" class="bouton bouton--accent bouton--petit"' +
          ' onclick="remettreLivreur(\'' + argJs(nom) + '\')">Remettre dans la liste</button>') +
    '</td>' +
  '</tr>';
}

function rendreLivreurs(){
  var liste = document.getElementById('liv-liste');
  if(!liste) return;
  var noms = nomsLivreurs();
  var ligne = '';
  var sansLivreur = livraisonsDe('');
  if(sansLivreur.length){
    ligne =
      '<tr class="liv-ligne liv-ligne--nu">' +
        '<td data-libelle="Livreur"><b>Sans livreur</b>' +
          '<span class="adm-sous">à affecter depuis la fiche d\'une commande</span></td>' +
        '<td data-libelle="À livrer">' + compteLivraisons(sansLivreur) + '</td>' +
        '<td data-libelle="Prochaine">' + prochaineLivraison(sansLivreur) + '</td>' +
        '<td data-libelle="" class="adm-actions-cellule">' +
          '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
            ' onclick="voirTournee(\'__aucun\', \'Commandes sans livreur\')">Ces commandes</button>' +
        '</td>' +
      '</tr>';
  }
  liste.innerHTML = (noms.length || ligne)
    ? '<div class="adm-tableau adm-tableau--fiches"><table class="adm-table"><thead><tr>' +
        '<th>Livreur</th><th>À livrer</th><th>Prochaine</th><th></th>' +
      '</tr></thead><tbody>' + ligne + noms.map(ligneLivreur).join('') + '</tbody></table></div>'
    : '<div class="adm-vide">Aucun livreur pour le moment. Écrivez un nom ci-dessus, ou ' +
      'affectez un livreur depuis la fiche d\'une commande : son nom viendra ici.</div>';

  var compte = document.getElementById('liv-compte');
  if(compte){
    var aLivrer = ORDERS.filter(function(o){ return o.st === 'confirmee'; });
    compte.textContent = noms.length + (noms.length > 1 ? ' livreurs' : ' livreur') +
      '. ' + aLivrer.length + (aLivrer.length > 1 ? ' commandes validées' : ' commande validée') +
      (sansLivreur.length ? ', dont ' + sansLivreur.length + ' sans livreur' : '') + '.';
  }
}

/* ---------- Les gestes ---------- */
function ajouterLivreurALaListe(){
  var champ = document.getElementById('liv-nouveau');
  var nom = (champ ? champ.value : '').trim();
  if(!nom){ montrerErreur('liv-err', true); return; }
  montrerErreur('liv-err', false);
  ajouterLivreur(nom);
  if(champ) champ.value = '';
  rendreLivreurs();
  remplirFiltreLivreurs();
  toast('« ' + esc(nom) + ' » inscrit.');
}

function corrigerNomLivreur(ancien, valeur){
  var nouveau = (valeur || '').trim();
  if(!nouveau){
    /* Un champ vidé n'efface pas un livreur : ça retirerait son nom des
       commandes sans le dire. On remet l'ancien et on explique. */
    toast('Un livreur ne se vide pas : utilisez « Retirer ».');
    rendreLivreurs();
    return;
  }
  if(nouveau === ancien) return;
  var avait = livraisonsDe(ancien).length;
  if(!renommerLivreur(ancien, nouveau)){
    rendreLivreurs();
    return;
  }
  rendreLivreurs();
  remplirFiltreLivreurs();
  rendreCommandes();
  toast(avait
    ? '« ' + esc(ancien) + ' » devient « ' + esc(nouveau) + ' », et ses ' + avait +
      ' livraisons suivent.'
    : '« ' + esc(ancien) + ' » devient « ' + esc(nouveau) + ' ».');
}

/* Un nom retiré revient d'un clic, avec ses livraisons retrouvées : c'est le
   geste inverse, et il doit être aussi simple que le premier. */
function remettreLivreur(nom){
  ajouterLivreur(nom);
  rendreLivreurs();
  remplirFiltreLivreurs();
  toast('« ' + esc(nom) + ' » de nouveau dans la liste.');
}

/* Retirer un nom ne touche pas aux commandes : elles gardent le livreur écrit
   dessus. On le dit avant, parce que c'est ce qui surprend. */
function retirerLivreurDeLaListe(nom){
  var l = livraisonsDe(nom);
  var question = l.length
    ? nom + ' a ' + l.length + (l.length > 1 ? ' livraisons' : ' livraison') +
      ' à faire. Ses commandes garderont son nom, mais il ne sera plus proposé dans la liste. Retirer quand même ?'
    : 'Retirer ' + nom + ' de la liste des livreurs ?';
  confirmerAction(question, 'Retirer', function(){
    retirerLivreur(nom);
    rendreLivreurs();
    remplirFiltreLivreurs();
    rendreCommandes();
    toast('« ' + esc(nom) + ' » retiré de la liste.');
  });
}
