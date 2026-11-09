/* Erriane Foods — Espace traiteur, onglet Clients.
   Les comptes clients, et la commande que le traiteur pose lui-même.

   Beaucoup des clients d'Erriane commandent par téléphone et ne sont pas à
   l'aise avec une inscription en ligne : c'est le traiteur qui tient leurs
   comptes. Il inscrit un client ici, puis pose la commande qu'il a prise au
   téléphone. La commande a exactement la forme de celles du site (voir
   `commandeEnCours` dans panier.js) : le client la retrouve dans son espace, et
   le traiteur la traite comme les autres, avec la fiche, la feuille de
   production et les versements.

   En attendant Supabase, tout cela vit dans le navigateur du traiteur. Un client
   qui se connecte depuis son propre téléphone ne verra donc pas encore la
   commande : elle le suivra le jour où la base sera là. */

/* ---------- Lire les clients ---------- */
/* Les établissements d'abord : c'est le nom que le traiteur reconnaît. */
function clientsTries(){
  return clientsList().slice().sort(function(a, b){
    var x = String(a.etab || a.nom || a.email).toLowerCase();
    var y = String(b.etab || b.nom || b.email).toLowerCase();
    return x.localeCompare(y);
  });
}
function libelleClient(c){
  return c.etab || c.nom || c.email;
}
function commandesDe(email){
  var e = String(email || '').toLowerCase();
  return ORDERS.filter(function(o){
    return o.client && String(o.client.email || '').toLowerCase() === e;
  }).sort(function(a, b){
    return String(b.date + b.heure).localeCompare(String(a.date + a.heure));
  });
}
/* Ce qui est facturé ne compte que les commandes validées : une commande en
   attente n'est pas encore due. Même règle que l'onglet Paiements. */
function resumeClient(email){
  var l = commandesDe(email);
  var ht = l.filter(function(o){ return o.st === 'confirmee'; })
    .reduce(function(t, o){ return t + (o.total || 0); }, 0);
  return {nb: l.length, ht: ht, ttc: ttcDe(ht), solde: soldeClient(email)};
}
/* `argJs`, qui échappe un texte pour un attribut onclick, vit dans admin.js :
   l'onglet Livreurs s'en sert aussi. */

/* Renvoyer vers l'onglet Commandes, filtré sur ce client. Le traiteur y retrouve
   ce qu'il connaît déjà : la fiche, la validation, la feuille de production. Une
   deuxième fenêtre par-dessus n'aurait rien montré de plus. */
function voirCommandesClient(email, libelle){
  document.getElementById('f-q').value = email;
  ADM.q = email;
  ongletAdmin('commandes');
  toast('Commandes de ' + esc(libelle) + '.');
}

/* ---------- Inscrire un client ---------- */
function ajouterClient(){
  var etab = (document.getElementById('cli-etab').value || '').trim(),
      nom = (document.getElementById('cli-nom').value || '').trim(),
      tel = (document.getElementById('cli-tel').value || '').trim(),
      email = (document.getElementById('cli-email').value || '').trim();
  if(!etab || !nom || tel.length < 8 || email.indexOf('@') < 1){
    montrerErreur('cli-err', true);
    return;
  }
  montrerErreur('cli-err', false);
  var deja = !!ficheClient(email);
  enregistrerClientFiche(etab, nom, tel, email);
  ['cli-etab', 'cli-nom', 'cli-tel', 'cli-email'].forEach(function(id){
    document.getElementById(id).value = '';
  });
  rendreClients();
  rendrePaiements();
  toast(deja
    ? 'La fiche de « ' + esc(etab) + ' » est à jour.'
    : '« ' + esc(etab) + ' » inscrit. Vous pouvez poser sa commande.');
}

/* ---------- La liste ---------- */
function ligneClient(c){
  var r = resumeClient(c.email);
  return '<tr>' +
    '<td data-libelle="Client"><b>' + esc(libelleClient(c)) + '</b>' +
      (c.etab && c.nom ? '<span class="adm-sous">' + esc(c.nom) + '</span>' : '') + '</td>' +
    '<td data-libelle="Contact">' + esc(c.tel || 'Téléphone non renseigné') +
      '<span class="adm-sous">' + esc(c.email) + '</span></td>' +
    '<td data-libelle="Commandes">' + r.nb + '</td>' +
    '<td data-libelle="Facturé"><b>' + fmt(r.ttc) + '</b></td>' +
    '<td data-libelle="Solde"><b class="' + (r.solde > 0 ? 'adm-solde--du' : 'adm-solde--ok') + '">' + fmt(r.solde) + '</b></td>' +
    '<td data-libelle="" class="adm-actions-cellule">' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
        ' onclick="voirCommandesClient(\'' + argJs(c.email) + '\', \'' + argJs(libelleClient(c)) + '\')">Ses commandes</button>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
        ' onclick="nouvelleCommande(\'' + argJs(c.email) + '\')">Nouvelle commande</button>' +
    '</td>' +
  '</tr>';
}

function rendreClients(){
  var liste = document.getElementById('cli-liste');
  if(!liste) return;
  var clients = clientsTries();

  liste.innerHTML = clients.length
    ? '<div class="adm-tableau adm-tableau--fiches"><table class="adm-table"><thead><tr>' +
        '<th>Client</th><th>Contact</th><th>Commandes</th><th>Facturé (validé)</th><th>Solde</th><th></th>' +
      '</tr></thead><tbody>' + clients.map(ligneClient).join('') + '</tbody></table></div>'
    : '<div class="adm-vide">Aucun client pour le moment. Inscrivez-en un ci-dessus.</div>';

  var compte = document.getElementById('cli-compte');
  if(compte){
    var sans = clients.filter(function(c){ return !commandesDe(c.email).length; }).length;
    compte.textContent = clients.length +
      (clients.length > 1 ? ' clients' : ' client') +
      (sans ? ', dont ' + sans + ' sans commande' : '') + '.';
  }
}

/* ---------- Poser une commande ----------
   Deux cas dans la même fenêtre : un client déjà connu, ou un client tout neuf
   dont le traiteur écrit les coordonnées au moment de commander. */
var CMD_CLI = [];
var CMD_EMAIL = '';

function ligneCmdVide(){ return {cofId: '', nom: '', qty: 0, pu: null}; }

function choixCoffret(l){
  return '<option value="">Choisissez un coffret</option>' + TOUS_COFFRETS.map(function(c){
    /* La liste porte aussi les coffrets que le site ne montre plus : un client
       peut très bien commander celui qui vient d'être retiré. L'étiquette le dit,
       sans quoi le traiteur croirait que le site le propose encore. */
    return '<option value="' + esc(c.id) + '"' + (c.id === l.cofId ? ' selected' : '') + '>' +
      esc(c.nom) + (c.cache ? ' (hors site)' : '') + '</option>';
  }).join('');
}

function rendreLignesCmd(){
  var zone = document.getElementById('cmd-lignes');
  if(!zone) return;
  zone.innerHTML = CMD_CLI.map(function(l, i){
    return '<div class="cmd-ligne">' +
      '<select onchange="majLigneCmd(' + i + ', \'cofId\', this.value)">' + choixCoffret(l) + '</select>' +
      '<input type="number" min="0" step="1" value="' + (l.qty || '') + '" placeholder="Qté"' +
        ' aria-label="Quantité" onchange="majLigneCmd(' + i + ', \'qty\', this.value)">' +
      '<input type="number" min="0" step="50" value="' + (l.pu === null ? '' : l.pu) + '" placeholder="Prix (DA)"' +
        ' aria-label="Prix unitaire" onchange="majLigneCmd(' + i + ', \'pu\', this.value)">' +
      '<span class="cmd-ligne__total" id="cmd-ligne-total-' + i + '">' + totalLigne(l) + '</span>' +
      '<button type="button" class="bouton bouton--secondaire bouton--petit"' +
        ' onclick="retirerLigneCmd(' + i + ')">Retirer</button>' +
    '</div>';
  }).join('');
  majTotauxCmd();
}
function totalLigne(l){
  var t = (Number(l.qty) || 0) * (Number(l.pu) || 0);
  return t ? fmt(t) : '';
}
function totalCmd(){
  return CMD_CLI.reduce(function(t, l){
    return t + (Number(l.qty) || 0) * (Number(l.pu) || 0);
  }, 0);
}
/* Le total se rafraîchit sans redessiner les champs : celui qui tape une
   quantité doit pouvoir enchaîner sur le prix sans que le curseur saute. */
function majTotauxCmd(){
  CMD_CLI.forEach(function(l, i){
    var s = document.getElementById('cmd-ligne-total-' + i);
    if(s) s.textContent = totalLigne(l);
  });
  var t = document.getElementById('cmd-total');
  if(t){
    t.innerHTML = '<div><span>Total</span><span>' + fmt(totalCmd()) + '</span></div>';
  }
}
function majLigneCmd(i, champ, valeur){
  var l = CMD_CLI[i];
  if(!l) return;
  if(champ === 'cofId'){
    l.cofId = valeur;
    var c = TOUS_COFFRETS.filter(function(x){ return x.id === valeur; })[0];
    l.nom = c ? c.nom : '';
    /* Le prix du site arrive pré-rempli : le traiteur le corrige s'il a fait un
       prix pour ce client. Sans prix, la ligne ne peut pas être enregistrée. */
    l.pu = c ? c.prix : null;
    if(c && !l.qty) l.qty = 1;
    rendreLignesCmd();
    return;
  }
  if(champ === 'qty') l.qty = Math.max(0, Math.round(Number(valeur) || 0));
  else l.pu = valeur === '' ? null : Math.round(Number(valeur));
  majTotauxCmd();
}
function ajouterLigneCmd(){
  CMD_CLI.push(ligneCmdVide());
  rendreLignesCmd();
}
function retirerLigneCmd(i){
  CMD_CLI.splice(i, 1);
  if(!CMD_CLI.length) CMD_CLI.push(ligneCmdVide());
  rendreLignesCmd();
}

/* Le client choisi remplit le téléphone, et laisse les quatre champs ouverts
   quand c'est un client neuf. */
function changerClientCmd(valeur){
  CMD_EMAIL = valeur;
  var bloc = document.getElementById('cmd-nouveau');
  if(bloc) bloc.hidden = !!valeur;
  var c = clientsTries().filter(function(x){ return x.email === valeur; })[0];
  var tel = document.getElementById('cmd-tel');
  if(tel && c && c.tel) tel.value = c.tel;
}

function poserModaleCommande(){
  var clients = clientsTries();
  var options = '<option value="">Nouveau client : écrivez ses coordonnées</option>' +
    clients.map(function(c){
      return '<option value="' + esc(c.email) + '"' + (c.email === CMD_EMAIL ? ' selected' : '') + '>' +
        esc(libelleClient(c)) + ' &middot; ' + esc(c.email) + '</option>';
    }).join('');
  var c = clients.filter(function(x){ return x.email === CMD_EMAIL; })[0];

  poserModale('ov-cli-cmd',
    '<div class="ov__boite ov__boite--large" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-cli-cmd\')" aria-label="Fermer">&times;</button>' +
      '<h3 class="adm-titre">Nouvelle commande</h3>' +
      '<p class="adm-aide">Pour une commande reçue par téléphone. Elle arrive en attente, comme ' +
        'celles du site : vous la validez depuis l\'onglet Commandes.</p>' +

      '<div class="adm-filtres">' +
        '<div><label for="cmd-client">Client</label>' +
          '<select id="cmd-client" onchange="changerClientCmd(this.value)">' + options + '</select></div>' +
        '<div><label for="cmd-tel">Téléphone pour cette livraison</label>' +
          '<input type="tel" id="cmd-tel" value="' + esc((c && c.tel) || '') + '" placeholder="0550 11 22 33"></div>' +
      '</div>' +

      '<div class="adm-filtres" id="cmd-nouveau"' + (CMD_EMAIL ? ' hidden' : '') + '>' +
        '<div><label for="cmd-etab">Établissement ou société</label>' +
          '<input type="text" id="cmd-etab" placeholder="Merinal Laboratoires"></div>' +
        '<div><label for="cmd-nom">Nom du contact</label>' +
          '<input type="text" id="cmd-nom" placeholder="Amel Z."></div>' +
        '<div><label for="cmd-email">Email</label>' +
          '<input type="email" id="cmd-email" placeholder="vous@exemple.dz"></div>' +
      '</div>' +

      '<h3 class="adm-titre">Ce qu\'il commande</h3>' +
      '<div id="cmd-lignes"></div>' +
      '<div class="adm-actions">' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="ajouterLigneCmd()">Ajouter une ligne</button>' +
      '</div>' +
      '<div class="adm-totaux" id="cmd-total"></div>' +

      '<h3 class="adm-titre">La livraison</h3>' +
      '<div class="adm-filtres">' +
        '<div><label for="cmd-date">Date</label><input type="date" id="cmd-date"></div>' +
        '<div><label for="cmd-heure">Heure</label><input type="time" id="cmd-heure"></div>' +
        '<div><label for="cmd-lieu">Lieu</label>' +
          '<input type="text" id="cmd-lieu" placeholder="Birkhadem, Alger"></div>' +
        '<div><label for="cmd-livreur">Livreur</label>' +
          '<input type="text" id="cmd-livreur" list="cmd-livreurs" placeholder="Nom du livreur">' +
          '<datalist id="cmd-livreurs">' + listeLivreurs().map(function(n){
            return '<option value="' + esc(n) + '"></option>';
          }).join('') + '</datalist></div>' +
      '</div>' +

      '<p class="msg-err" id="cmd-err">Vérifiez le client, la date, l\'heure et le lieu.</p>' +
      '<div class="adm-actions">' +
        '<button type="button" class="bouton bouton--accent" onclick="validerCommandeAdmin()">Enregistrer la commande</button>' +
        '<button type="button" class="bouton bouton--secondaire" onclick="closeOv(\'ov-cli-cmd\')">Fermer sans enregistrer</button>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-cli-cmd').setAttribute('onclick', "if(event.target===this)closeOv('ov-cli-cmd')");
  rendreLignesCmd();
}

function nouvelleCommande(email){
  CMD_EMAIL = email || '';
  CMD_CLI = [ligneCmdVide()];
  poserModaleCommande();
  openOv('ov-cli-cmd');
}

/* La référence se tire au sort. Un traiteur qui pose plusieurs commandes
   d'affilée peut tomber sur un doublon : on retire tant que la place est prise. */
function referenceLibre(){
  var r;
  do { r = 'ERR-' + Math.floor(1000 + Math.random() * 9000); } while(laCommande(r));
  return r;
}

function validerCommandeAdmin(){
  var sel = document.getElementById('cmd-client'),
      etab = '', nom = '', email = sel ? sel.value : '',
      tel = (document.getElementById('cmd-tel').value || '').trim();

  if(!email){
    etab = (document.getElementById('cmd-etab').value || '').trim();
    nom = (document.getElementById('cmd-nom').value || '').trim();
    email = (document.getElementById('cmd-email').value || '').trim();
    if(!etab || !nom || tel.length < 8 || email.indexOf('@') < 1){
      montrerErreur('cmd-err', true);
      return;
    }
  } else {
    var c = clientsTries().filter(function(x){ return x.email === email; })[0] || {};
    etab = c.etab || '';
    nom = c.nom || '';
    if(tel.length < 8){ montrerErreur('cmd-err', true); return; }
  }

  /* Les lignes vides ou sans quantité ne comptent pas : le traiteur en ajoute
     deux, en remplit une seule, et c'est très bien ainsi. */
  var lignes = CMD_CLI.filter(function(l){ return l.cofId && l.qty > 0; });
  if(!lignes.length){ toast('Choisissez au moins un coffret, avec sa quantité.'); return; }
  var sansPrix = lignes.filter(function(l){ return !(l.pu > 0); })[0];
  if(sansPrix){
    toast('« ' + esc(sansPrix.nom) + ' » est sur demande sur le site : écrivez son prix pour cette commande.');
    return;
  }

  var date = document.getElementById('cmd-date').value,
      heure = document.getElementById('cmd-heure').value,
      lieu = (document.getElementById('cmd-lieu').value || '').trim(),
      livreur = (document.getElementById('cmd-livreur').value || '').trim();
  if(!date || !heure || !lieu){ montrerErreur('cmd-err', true); return; }
  montrerErreur('cmd-err', false);

  /* Le client entre dans les comptes connus au passage : la prochaine commande
     le proposera dans la liste, et l'onglet Paiements tiendra son solde. */
  enregistrerClientFiche(etab, nom, tel, email);

  var o = {
    ref: referenceLibre(),
    client: {nom: nom, tel: tel, etab: etab, email: email},
    lignes: lignes.map(function(l){
      return {cofId: l.cofId, nom: l.nom, qty: l.qty, pu: l.pu,
              entree: '', viande: '', garnitures: '', dessert: '', boisson: ''};
    }),
    total: lignes.reduce(function(t, l){ return t + l.qty * l.pu; }, 0),
    date: date, heure: heure, lieu: lieu, tel: tel,
    note: '', st: 'attente', rep: null, prep: {livreur: livreur || ''}
  };
  /* Avant de poser la commande : en existe-t-il déjà une identique ? */
  var jumelle = commandeJumelle(o);
  if(jumelle){
    confirmerAction(
      'Une commande identique existe déjà : ' + jumelle.ref + ', ' +
        (etab || nom) + ', le ' + frDate(jumelle.date) + ', ' +
        jumelle.lignes.map(function(l){ return l.qty + ' × ' + l.nom; }).join(', ') +
        '. La créer quand même ?',
      'Créer quand même',
      function(){ poserCommandeAdmin(o, etab, nom, livreur); });
    return;
  }
  poserCommandeAdmin(o, etab, nom, livreur);
}

/* ---------- L'alerte anti-doublon ----------
   Deux commandes identiques, c'est presque toujours une saisie en double : le
   traiteur interrompu, ou qui croit que la première n'a pas pris. On ne bloque
   pas, un client peut commander deux fois le même jour à deux services : on
   demande. Signature : le client, la date, et les coffrets avec leurs quantités,
   dans l'ordre où ils viennent. */
function signatureCommande(o){
  var qui = o.client ? String(o.client.email || o.client.tel || '').toLowerCase() : '';
  var lignes = (o.lignes || []).map(function(l){ return l.cofId + 'x' + l.qty; }).sort().join('|');
  return qui + '#' + o.date + '#' + lignes;
}
function commandeJumelle(o){
  var sig = signatureCommande(o);
  return ORDERS.filter(function(x){
    return x.st !== 'annulee' && signatureCommande(x) === sig;
  })[0] || null;
}

function poserCommandeAdmin(o, etab, nom, livreur){
  ORDERS.unshift(o);
  enregistrerCommandes();
  if(livreur) ajouterLivreur(livreur);

  closeOv('ov-cli-cmd');
  rendreClients();
  rendreCommandes();
  rendrePaiements();
  toast('Commande ' + esc(o.ref) + ' posée pour ' + esc(etab || nom) + '.');
}

document.addEventListener('DOMContentLoaded', rendreClients);
