/* Erriane Foods — Panier et passage de commande.
   Le panier garde les coffrets choisis. On peut en ajouter d'autres, changer les
   quantités, retirer une ligne ou tout vider. Le formulaire de livraison n'arrive
   qu'à la dernière étape, une fois la commande relue.

   La fin du parcours dépend de l'espace de la page (voir ESPACE dans data.js) :
   chez les entreprises la commande est enregistrée, et le compte n'est demandé
   qu'au moment de confirmer ; chez les particuliers il n'y a pas de compte du
   tout, la commande part sur le WhatsApp du traiteur. */

/* ---------- Badge du header ---------- */
function nombreArticles(){
  return LINES.reduce(function(t, l){ return t + l.qty; }, 0);
}
/* Le panier se remplit sans compte : on ne demande qui que ce soit qu'au moment
   de confirmer la commande. Le bouton reste donc visible pour tout le monde. */
function renderBadgePanier(){
  var b = document.getElementById('panier-badge');
  if(!b) return;
  var n = nombreArticles();
  b.textContent = n;
  b.style.display = n > 0 ? 'grid' : 'none';
}
function enregistrerPanier(){
  save('erri_lines', LINES);
  renderBadgePanier();
}
function totalPanier(){
  return LINES.reduce(function(t, l){ return t + l.qty * l.pu; }, 0);
}
/* Le prix des coffrets est hors taxes : le panier affiche donc les trois lignes
   du calcul, comme la fiche du traiteur. Un client qui découvre la TVA au
   dernier écran se sentirait piégé, et le traiteur devrait se justifier. */
function ecrireTotaux(prefixe){
  var ht = totalPanier();
  var a = document.getElementById(prefixe + '-total'),
      b = document.getElementById(prefixe + '-tva'),
      c = document.getElementById(prefixe + '-ttc');
  if(a) a.textContent = fmt(ht);
  if(b) b.textContent = fmt(tvaDe(ht));
  if(c) c.textContent = fmt(ttcDe(ht));
}

/* ---------- Fenêtre panier ---------- */
function poserModalePanier(){
  /* Chez les particuliers, on ne sait pas encore si les prix de la carte sont
     hors taxes ou TTC (question posée au client). On n'affiche donc **pas** de
     ligne de TVA et on n'en invente pas : un seul total, celui de la carte, et le
     traiteur confirme le montant. Chez les entreprises, les trois lignes restent. */
  var totals = estParticulier()
    ? '<div class="panier__total panier__total--fort"><span>Total</span><b id="panier-total"></b></div>' +
      '<p class="panier__note">Les prix sont ceux de la carte. Le traiteur confirme le montant et les frais de livraison avec vous.</p>'
    : '<div class="panier__total"><span>Total hors taxes</span><b id="panier-total"></b></div>' +
      '<div class="panier__total panier__total--calme"><span>TVA 19 %</span><b id="panier-tva"></b></div>' +
      '<div class="panier__total panier__total--fort"><span>Total à payer</span><b id="panier-ttc"></b></div>' +
      '<p class="panier__note">Les frais de livraison sont confirmés par le traiteur.</p>';
  poserModale('ov-panier',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-panier\')" aria-label="Fermer">&times;</button>' +
      '<h3>Votre panier</h3>' +
      '<div id="panier-lignes"></div>' +
      '<div id="panier-pied">' +
        totals +
        '<button type="button" class="bouton bouton--accent bouton--large" onclick="ouvrirCheckout()">Passer la commande</button>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-panier').setAttribute('onclick', "if(event.target===this)closeOv('ov-panier')");
}

function ouvrirPanier(){
  poserModalePanier();
  var el = document.getElementById('panier-lignes');
  var pied = document.getElementById('panier-pied');

  if(!LINES.length){
    el.innerHTML = '<p class="panier__vide">Votre panier est vide.</p>';
    pied.style.display = 'none';
    openOv('ov-panier');
    return;
  }

  el.innerHTML = LINES.map(function(l, i){
    var cof = findCof(l.cofId);
    var detail = cof ? cof.d : '';
    /* Ce que le traiteur décide de servir ne s'affiche pas au client : c'est de
       la cuisine, et le voir donnerait envie de choisir ou d'annuler (Massyl,
       29 octobre 2026). Le panier ne montre que le coffret et son prix. */
    var compo = '';
    return '<div class="panier__ligne">' +
      '<div class="panier__info"><b>' + esc(l.nom) + '</b>' +
        '<span>' + fmt(l.pu) + (estParticulier() ? '' : ' / coffret') + '</span>' + compo + '</div>' +
      '<div class="panier__reglages">' +
        '<button type="button" class="qty-btn" onclick="changerQty(' + i + ',-1)" aria-label="Retirer un">&minus;</button>' +
        '<span class="panier__qty">' + l.qty + '</span>' +
        '<button type="button" class="qty-btn" onclick="changerQty(' + i + ',1)" aria-label="Ajouter un">+</button>' +
        '<span class="panier__sous-total">' + fmt(l.qty * l.pu) + '</span>' +
        '<button type="button" class="panier__retirer" onclick="retirerLigne(' + i + ')" title="Retirer cette ligne" aria-label="Retirer cette ligne">&times;</button>' +
      '</div></div>';
  }).join('');

  /* Vider le panier se confirme DANS la page : la confirmation du navigateur
     (`confirm`) peut être bloquée sans le dire, et le bouton semblait alors ne
     rien faire (Massyl, 27 octobre 2026). */
  el.innerHTML += '<div class="panier__actions">' + (VIDAGE_ARME
    ? '<span class="panier__vide-question">Vider le panier ?</span>' +
      '<button type="button" class="lien-discret panier__vide-oui" onclick="confirmerVidage()">Oui, tout retirer</button>' +
      '<button type="button" class="lien-discret" onclick="annulerVidage()">Annuler</button>'
    : '<button type="button" class="lien-discret" onclick="demanderVidage()">Vider le panier</button>') +
  '</div>';

  ecrireTotaux('panier');
  pied.style.display = '';
  openOv('ov-panier');
}

function changerQty(i, d){
  LINES[i].qty = Math.max(1, LINES[i].qty + d);
  enregistrerPanier();
  ouvrirPanier();
}
function retirerLigne(i){
  LINES.splice(i, 1);
  enregistrerPanier();
  ouvrirPanier();
}
/* Deux temps, sans boîte de dialogue du navigateur : le premier clic demande
   confirmation dans le panier, le second vide. */
var VIDAGE_ARME = false;
function demanderVidage(){
  VIDAGE_ARME = true;
  ouvrirPanier();
}
function annulerVidage(){
  VIDAGE_ARME = false;
  ouvrirPanier();
}
function confirmerVidage(){
  VIDAGE_ARME = false;
  LINES = [];
  enregistrerPanier();
  ouvrirPanier();
  renderBadgePanier();
  toast('Panier vidé.');
}
function viderPanier(){ demanderVidage(); }
function apresDeconnexion(){ renderBadgePanier(); }

/* ---------- Brouillon de livraison ----------
   Le formulaire de livraison est rempli avant de savoir qui commande. Ce qui est
   saisi est donc gardé sur l'appareil : si la personne doit créer un compte et
   que la page se recharge, ou si elle s'interrompt en route, elle retrouve le
   formulaire déjà rempli et le panier intact. */
function brouillon(){
  var b = load('erri_checkout', null);
  return (b && typeof b === 'object') ? b : {};
}
function sauverBrouillon(){
  var n = document.getElementById('ck-nom'),
      d = document.getElementById('ck-date'),
      h = document.getElementById('ck-heure'),
      l = document.getElementById('ck-lieu'),
      t = document.getElementById('ck-tel'),
      p = document.getElementById('ck-note');
  if(!l) return;   /* le formulaire n'est pas encore posé : surtout ne rien écraser */
  save('erri_checkout', {
    nom: n ? n.value.trim() : '',
    date: d ? d.value : '', heure: h ? h.value : '',
    lieu: l.value, tel: t ? t.value.trim() : '', note: p ? p.value.trim() : ''
  });
}
function effacerBrouillon(){ save('erri_checkout', null); }

/* ---------- Le bon de commande ----------
   Chez les entreprises seulement : beaucoup de sociétés émettent un bon de
   commande, et le traiteur a besoin de le retrouver avec la commande.

   Le fichier choisi reste dans la page le temps de la commande. Son nom part
   toujours avec la commande ; son contenu est gardé à part, dans la mémoire du
   navigateur, quand il est assez léger. Au-delà, on ne le garde pas : cette
   mémoire est petite, et une commande qui ne s'enregistre pas serait bien plus
   grave qu'un bon de commande redemandé. La vraie pièce jointe, de n'importe
   quelle taille, arrive avec la base de données. */
var BC_FICHIER = null;
/* 900 Ko : gardé dans la mémoire du navigateur, un fichier y pèse environ deux
   fois son poids. Au-delà, on refuserait d'enregistrer la commande elle-même. */
var BC_MAX = 900 * 1024;

function choixBonDeCommande(){
  var input = document.getElementById('ck-bc'),
      note = document.getElementById('ck-bcname');
  BC_FICHIER = null;
  if(!input || !input.files || !input.files.length){
    if(note) note.textContent = 'PDF ou photo du bon, si votre société en émet un.';
    return;
  }
  var f = input.files[0];
  if(f.size > BC_MAX){
    if(note) note.textContent = 'Ce fichier est trop lourd (900 Ko maximum). Vous pourrez l\'envoyer au traiteur après la commande.';
    input.value = '';
    return;
  }
  BC_FICHIER = f;
  if(note) note.textContent = f.name + ' · ' + Math.round(f.size / 1024) + ' Ko';
}
/* Range le contenu du bon de commande à côté des commandes, jamais dedans : si
   la mémoire refuse le fichier, la commande est déjà enregistrée et rien n'est
   perdu. */
function garderBonDeCommande(o){
  if(!BC_FICHIER || !o) return;
  /* Le fichier est gardé dans une variable à part : BC_FICHIER est remis à zéro
     tout de suite, alors que la lecture, elle, se termine plus tard. */
  var f = BC_FICHIER;
  var lecteur = new FileReader();
  lecteur.onload = function(){
    try {
      var bons = load('erri_bdc', null) || {};
      bons[o.ref] = {nom: f.name, taille: f.size, data: lecteur.result};
      save('erri_bdc', bons);
    } catch(e){
      /* Mémoire pleine : le nom du bon reste sur la commande, c'est l'essentiel. */
    }
  };
  lecteur.readAsDataURL(f);
  BC_FICHIER = null;
}
/* Après une commande, le champ ne garde pas le fichier de la précédente. */
function viderBonDeCommande(){
  BC_FICHIER = null;
  var input = document.getElementById('ck-bc'),
      note = document.getElementById('ck-bcname');
  if(input) input.value = '';
  if(note) note.textContent = 'PDF ou photo du bon, si votre société en émet un.';
}

/* Remplit le formulaire : d'abord ce qui avait été saisi, sinon ce que le compte
   sait déjà (le nom et le téléphone), sinon rien. Le champ nom n'existe que chez
   les particuliers : chez les entreprises il vient du compte, à la commande. */
function remplirFormulaire(){
  var b = brouillon();
  var n = document.getElementById('ck-nom');
  if(n) n.value = b.nom || (USER ? USER.nom : '');
  document.getElementById('ck-date').value = b.date || aujourdhui();
  document.getElementById('ck-heure').value = b.heure || '12:00';
  document.getElementById('ck-lieu').value = b.lieu || '';
  document.getElementById('ck-tel').value = b.tel || (USER ? USER.tel : '');
  document.getElementById('ck-note').value = b.note || '';
}

/* ---------- Fenêtre livraison ----------
   Elle s'adapte à l'espace de la page.

   Entreprises : le nom et le téléphone viennent du compte, on ne demande que la
   livraison, et confirmer enregistre la commande dans l'espace client.
   Particuliers : il n'y a pas de compte, donc personne pour fournir le nom. On
   le demande, et confirmer envoie la commande sur le WhatsApp du traiteur. */
function poserModaleCheckout(){
  var particulier = estParticulier();
  var champNom = particulier
    ? '<div class="champ"><label for="ck-nom">Votre nom</label>' +
      '<input type="text" id="ck-nom" placeholder="Amel Z." oninput="sauverBrouillon()"></div>'
    : '';
  var avertissement = particulier
    ? '<p class="panier__note">En confirmant, vos coordonnées sont transmises au traiteur sur WhatsApp, pour traiter cette commande.</p>'
    : '';
  /* Le bon de commande ne se demande qu'aux entreprises : un particulier n'en
     émet pas. Le champ reste facultatif, la commande passe sans lui. */
  var champBon = particulier
    ? ''
    : '<div class="champ"><label for="ck-bc">Bon de commande <span class="champ__facultatif">facultatif</span></label>' +
      '<input type="file" id="ck-bc" accept=".pdf,.jpg,.jpeg,.png" onchange="choixBonDeCommande()">' +
      '<div class="note-file" id="ck-bcname">PDF ou photo du bon, si votre société en émet un.</div></div>';
  poserModale('ov-checkout',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-checkout\')" aria-label="Fermer">&times;</button>' +
      '<h3>Livraison</h3>' +
      '<div class="rappel"><div id="ck-recap"></div>' +
        '<button type="button" onclick="ouvrirPanier()">Modifier</button></div>' +
      champNom +
      '<div class="champ"><label for="ck-date">Date de livraison</label>' +
        '<input type="date" id="ck-date" oninput="sauverBrouillon()"></div>' +
      '<div class="champ"><label for="ck-heure">Heure souhaitée</label>' +
        '<input type="time" id="ck-heure" value="12:00" oninput="sauverBrouillon()"></div>' +
      '<div class="champ"><label for="ck-lieu">' + (particulier ? 'Adresse de livraison' : 'Lieu de livraison') + '</label>' +
        '<input type="text" id="ck-lieu" placeholder="' + (particulier ? 'Rue, cité, repère&hellip;' : 'Société, adresse, étage, quai&hellip;') + '" oninput="sauverBrouillon()"></div>' +
      '<div class="champ"><label for="ck-tel">Téléphone sur place</label>' +
        '<input type="tel" id="ck-tel" placeholder="0550 11 22 33" oninput="sauverBrouillon()"></div>' +
      '<div class="champ"><label for="ck-note">Précision pour le traiteur <span class="champ__facultatif">facultatif</span></label>' +
        '<textarea id="ck-note" rows="2" placeholder="Allergies, accès, personne à contacter&hellip;" oninput="sauverBrouillon()"></textarea></div>' +
      champBon +
      /* Déjà client : le chemin de la connexion est proposé dès la livraison, et
         non seulement au moment du compte. Placé après les champs, pour ne pas
         couper le formulaire en deux. Le panier est gardé de toute façon. */
      (particulier ? '' :
        '<p class="ck-compte" id="ck-compte">Vous avez déjà un compte ?' +
          '<button type="button" class="lien-discret" onclick="connecterDepuisLivraison()">Connectez-vous</button>' +
          '<span class="ck-compte__note">Votre panier est gardé.</span></p>') +
      '<p class="msg-err" id="ck-err">' + (particulier
        ? 'Remplissez votre nom, la date, l\'heure, l\'adresse et le téléphone.'
        : 'Remplissez la date, l\'heure, le lieu et le téléphone.') + '</p>' +
      avertissement +
      /* Même règle que le panier : la ligne de TVA n'existe que chez les
         entreprises, dont les prix sont hors taxes. */
      (particulier
        ? '<div class="panier__total panier__total--fort"><span>Total</span><b id="ck-total"></b></div>'
        : '<div class="panier__total"><span>Total hors taxes</span><b id="ck-total"></b></div>' +
          '<div class="panier__total panier__total--calme"><span>TVA 19 %</span><b id="ck-tva"></b></div>' +
          '<div class="panier__total panier__total--fort"><span>Total à payer</span><b id="ck-ttc"></b></div>') +
      '<button type="button" class="bouton bouton--accent bouton--large" id="ck-valider" onclick="validerCommande()">Confirmer la commande</button>' +
      '<p class="panier__note" id="ck-bas">Aucun paiement en ligne. Le traiteur vous rappelle pour valider votre commande.</p>' +
      /* Nom et téléphone sont collectés ici : la loi 18-07 demande de dire à
         quoi ils servent et où lire la suite. Une phrase et un lien, sans case à
         cocher en plus de la commande (voir reference-page-confidentialite). */
      '<p class="panier__note">Vos coordonnées servent à préparer et à livrer cette commande. ' +
        '<a href="confidentialite.html">Ce que nous en faisons</a>.</p>' +
    '</div>');
  document.getElementById('ov-checkout').setAttribute('onclick', "if(event.target===this)closeOv('ov-checkout')");
}

function ouvrirCheckout(){
  if(!LINES.length) return;
  poserModaleCheckout();
  document.getElementById('ck-recap').innerHTML = LINES.map(function(l){
    return '<div><b>' + l.qty + '</b> &times; ' + esc(l.nom) + '</div>';
  }).join('');
  ecrireTotaux('ck');
  document.getElementById('ck-date').min = aujourdhui();
  remplirFormulaire();
  /* Le bouton dit ce qu'il fait. Chez les particuliers la commande part sur
     WhatsApp ; chez les entreprises, tant qu'il n'y a pas de compte, confirmer
     commence par en créer un. */
  var valider = document.getElementById('ck-valider'),
      bas = document.getElementById('ck-bas');
  if(estParticulier()){
    valider.textContent = 'Envoyer sur WhatsApp';
    bas.textContent = 'Aucun paiement en ligne. Votre commande part sur le WhatsApp du traiteur, déjà rédigée, et il vous répond pour valider votre commande.';
  } else if(USER){
    valider.textContent = 'Confirmer la commande';
    bas.textContent = 'Aucun paiement en ligne. Le traiteur vous rappelle pour valider votre commande.';
  } else {
    valider.textContent = 'Créer mon compte et confirmer';
    bas.textContent = 'Un compte est créé à la première commande. Votre panier et ces informations sont conservés pendant l\'inscription.';
  }
  /* Le rappel « Vous avez déjà un compte ? » ne sert que si l'on n'est pas
     connecté : une fois entré, il n'a plus de sens. */
  var rappel = document.getElementById('ck-compte');
  if(rappel) rappel.style.display = USER ? 'none' : '';

  montrerErreur('ck-err', false);
  openOv('ov-checkout');
}

/* Depuis la livraison, sans attendre l'étape du compte : on garde la commande
   en attente, on ferme la livraison et on ouvre la connexion. `entrerComme()`
   rouvrira la livraison, remplie, dès que le client est entré. */
function connecterDepuisLivraison(){
  if(typeof LINES !== 'undefined' && LINES.length){
    sauverBrouillon();
    REPRENDRE = true;
  }
  closeOv('ov-checkout');
  openAuth('login');
}

/* Construit la commande à partir du panier et du formulaire. Le client peut
   n'avoir ni établissement ni email : c'est le cas d'un particulier. */
function commandeEnCours(client, date, heure, lieu, tel){
  var note = document.getElementById('ck-note');
  return {
    ref: 'ERR-' + Math.floor(1000 + Math.random() * 9000),
    client: client,
    lignes: LINES.map(function(l){
      return {cofId:l.cofId, nom:l.nom, qty:l.qty, pu:l.pu,
              entree:l.entree || '', viande:l.viande || '', garnitures:l.garnitures || '',
              dessert:l.dessert || '', boisson:l.boisson || ''};
    }),
    total: totalPanier(),
    date: date, heure: heure, lieu: lieu, tel: tel,
    note: note ? note.value.trim() : '',
    st: 'attente', rep: null, prep: {livreur:''}
  };
}

function validerCommande(){
  if(!LINES.length) return;
  var nom = document.getElementById('ck-nom'),
      date = document.getElementById('ck-date').value,
      heure = document.getElementById('ck-heure').value,
      lieu = document.getElementById('ck-lieu').value.trim(),
      tel = document.getElementById('ck-tel').value.trim();
  if((nom && !nom.value.trim()) || !date || !heure || !lieu || !tel){
    montrerErreur('ck-err', true);
    return;
  }
  montrerErreur('ck-err', false);

  /* Tout est saisi. On le garde avant toute chose : si la suite s'interrompt, ou
     que la page se recharge, rien n'est perdu. */
  sauverBrouillon();

  /* Particuliers : pas de compte, donc pas d'espace client. La commande part sur
     le WhatsApp du traiteur. */
  if(estParticulier()){ envoyerSurWhatsApp(); return; }

  if(!USER){
    REPRENDRE = true;
    closeOv('ov-checkout');
    toast('Encore une étape : votre compte.');
    openAuth('reg');
    return;
  }

  var o = commandeEnCours(
    {nom:USER.nom, tel:USER.tel, etab:USER.etab, email:USER.email},
    date, heure, lieu, tel);
  /* Le nom du bon de commande part avec la commande ; son contenu se range
     juste après, à part. */
  o.bdc = BC_FICHIER ? BC_FICHIER.name : '';
  ORDERS.unshift(o);
  save('erri_orders', ORDERS);
  garderBonDeCommande(o);
  viderBonDeCommande();
  effacerBrouillon();
  LINES = [];
  enregistrerPanier();
  closeOv('ov-checkout');
  ouvrirConfirmation(o.ref);
}

/* ---------- Envoi sur WhatsApp (particuliers) ----------
   La commande n'entre dans aucun espace client : elle part sur le WhatsApp du
   traiteur, déjà rédigée. Elle est quand même gardée sur l'appareil, pour que
   l'espace traiteur la voie même si le message n'est jamais parti. */
function messageWhatsApp(o){
  var l = ['Bonjour Erriane Foods, je souhaite commander.', ''];
  o.lignes.forEach(function(x){
    l.push('-' + x.qty + ' x ' + x.nom + ' : ' + fmt(x.qty * x.pu));
  });
  /* Même choix que le panier : chez les particuliers, un seul total, sans ligne
     de TVA, tant qu'on ne sait pas si la carte est hors taxes ou TTC. */
  if(estParticulier()){
    l.push('Total : ' + fmt(o.total));
  } else {
    l.push('Total hors taxes : ' + fmt(o.total));
    l.push('TVA 19 % : ' + fmt(tvaDe(o.total)) + ' (hors frais de livraison)');
    l.push('Total : ' + fmt(ttcDe(o.total)));
  }
  l.push('');
  l.push('Nom : ' + o.client.nom);
  l.push('Téléphone : ' + o.tel);
  l.push('Livraison : le ' + frDate(o.date) + ' à ' + o.heure);
  l.push('Adresse : ' + o.lieu);
  if(o.note) l.push('Précision : ' + o.note);
  return l.join('\n');
}

function envoyerSurWhatsApp(){
  var nom = document.getElementById('ck-nom'),
      tel = document.getElementById('ck-tel').value.trim();
  var o = commandeEnCours(
    {nom: nom.value.trim(), tel: tel, etab: '', email: ''},
    document.getElementById('ck-date').value,
    document.getElementById('ck-heure').value,
    document.getElementById('ck-lieu').value.trim(),
    tel);

  ORDERS.unshift(o);
  save('erri_orders', ORDERS);
  effacerBrouillon();
  LINES = [];
  enregistrerPanier();
  closeOv('ov-checkout');

  /* Le clic vient de partir : le navigateur autorise l'ouverture. Le lien est
     aussi reposé dans la fenêtre de confirmation, au cas où elle serait
     bloquée. */
  var lien = waLink(messageWhatsApp(o));
  window.open(lien, '_blank');
  ouvrirConfirmationWhatsApp(o, lien);
}

/* ---------- Fenêtre de confirmation ---------- */
function poserModaleConfirme(){
  poserModale('ov-confirme',
    '<div class="ov__boite ov__boite--centre" onclick="event.stopPropagation()">' +
      '<div class="confirme__rond">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<h3>Commande envoyée</h3>' +
      '<p class="confirme__ref" id="cf-ref"></p>' +
      '<p class="confirme__texte">Le traiteur vous rappelle pour confirmer la livraison. Vous recevrez une notification WhatsApp dès que la commande est prise en charge.</p>' +
      '<a href="commandes.html" class="bouton bouton--accent bouton--large">Voir ma commande</a>' +
      '<button type="button" class="lien-discret" onclick="closeOv(\'ov-confirme\')">Continuer mes achats</button>' +
    '</div>');
  document.getElementById('ov-confirme').setAttribute('onclick', "if(event.target===this)closeOv('ov-confirme')");
}

function ouvrirConfirmation(ref){
  poserModaleConfirme();
  document.getElementById('cf-ref').textContent = 'Numéro ' + ref;
  openOv('ov-confirme');
  renderBadgePanier();
}

/* ---------- Fenêtre de confirmation (particuliers) ----------
   Il n'y a pas de commande à consulter dans un espace client : elle est dans
   WhatsApp. Cette fenêtre le dit, et redonne le lien si le navigateur a bloqué
   l'ouverture. */
function poserModaleConfirmeWhatsApp(){
  poserModale('ov-confirme-wa',
    '<div class="ov__boite ov__boite--centre" onclick="event.stopPropagation()">' +
      '<div class="confirme__rond">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<h3>Commande prête</h3>' +
      '<p class="confirme__ref" id="cfw-ref"></p>' +
      '<p class="confirme__texte">WhatsApp s\'est ouvert avec votre commande déjà rédigée. Il ne reste qu\'à l\'envoyer au traiteur. Si la fenêtre ne s\'est pas ouverte, utilisez le bouton ci-dessous.</p>' +
      '<a href="#" id="cfw-lien" class="bouton bouton--whatsapp bouton--large" target="_blank" rel="noopener">Ouvrir WhatsApp</a>' +
      '<button type="button" class="lien-discret" onclick="closeOv(\'ov-confirme-wa\')">Continuer mes achats</button>' +
    '</div>');
  document.getElementById('ov-confirme-wa').setAttribute('onclick', "if(event.target===this)closeOv('ov-confirme-wa')");
}

function ouvrirConfirmationWhatsApp(o, lien){
  poserModaleConfirmeWhatsApp();
  document.getElementById('cfw-lien').setAttribute('href', lien);
  document.getElementById('cfw-ref').textContent = 'Numéro ' + o.ref;
  openOv('ov-confirme-wa');
  renderBadgePanier();
}
