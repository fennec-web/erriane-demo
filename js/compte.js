/* Erriane Foods — Compte client.
   Zone du header (boutons, puis menu au survol) et fenêtre d'inscription / connexion.

   En attendant le backend, les comptes vivent dans le navigateur.
   La connexion se fait par email : les comptes proposés sont ceux qui ont déjà
   passé une commande depuis ce navigateur. Le mot de passe arrivera avec Supabase. */

/* ---------- Header ---------- */
function initiales(txt){
  return (txt || '?').trim().charAt(0).toUpperCase();
}

/* ---------- Le solde, dans l'en-tête ----------
   Juste à gauche du panier : ce que le client doit au traiteur, en rouge tant
   qu'il reste à régler, en vert quand tout est payé. Rien pour un visiteur, rien
   dans l'espace particuliers, qui n'a pas de compte (Massyl, 29 octobre 2026). */
function majSoldeEntete(){
  var actions = document.querySelector('.entete__actions');
  if(!actions) return;
  var puce = document.getElementById('solde-entete');
  var montrer = (typeof USER !== 'undefined' && USER) && !estParticulier();
  if(!montrer){
    if(puce) puce.parentNode.removeChild(puce);
    return;
  }
  if(!puce){
    puce = document.createElement('span');
    puce.id = 'solde-entete';
    var panier = actions.querySelector('.panier-btn');
    actions.insertBefore(puce, panier || actions.firstChild);
  }
  var reste = dueFor(USER.email) - paidFor(USER.email);
  puce.className = 'solde-entete ' + (reste > 0 ? 'solde-entete--du' : 'solde-entete--ok');
  puce.textContent = reste > 0 ? 'Solde ' + fmt(reste) : 'Solde à jour';
  puce.title = reste > 0 ? 'Reste à régler sur vos commandes validées'
                         : 'Aucun solde en attente';
}

function renderCompte(){
  /* Le compte n'existe que dans l'espace entreprises. L'accueil est un simple
     aiguillage, et les particuliers ne passent plus par le site (ils sont sur
     Yassir depuis le 30/09/2026) : l'accueil n'a pas de #zone-compte dans son
     en-tête, et il n'y a donc rien à dessiner. Le badge du panier, lui, se
     dessine sur toutes les pages, y compris celles qui n'ont pas de compte. */
  var zone = document.getElementById('zone-compte');
  if(zone){
    if(USER){
      zone.innerHTML =
        '<div class="compte__chip" tabindex="0">' +
          '<span class="compte__avatar">' + esc(initiales(USER.etab)) + '</span>' +
          '<span class="compte__nom">' + esc(USER.etab) + '</span>' +
          '<svg class="compte__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
          '<div class="compte__menu">' +
            '<a href="profil.html">Mon profil</a>' +
            '<a href="commandes.html">Mes commandes</a>' +
            '<a href="paiements.html">Mes paiements</a>' +
            '<button type="button" onclick="deconnexion()">Se déconnecter</button>' +
          '</div>' +
        '</div>';
    } else {
      zone.innerHTML =
        '<a href="#" class="bouton bouton--secondaire bouton--petit" id="btn-register" onclick="openAuth(\'reg\');return false">Créer un compte</a>' +
        '<a href="#" class="bouton bouton--accent bouton--petit" onclick="openAuth(\'login\');return false">Se connecter</a>';
    }
  }
  reglerMarque();
  renderBadgePanier();
  /* Les entrées « Particuliers » disparaissent du site d'un client connecté :
     le compte est réservé aux entreprises. */
  if(typeof signalerConnexion === 'function') signalerConnexion();
  majSoldeEntete();
}

/* Pour un client connecté, la marque mène à son espace. Sinon elle le renverrait
   à l'aiguillage qui ne le concerne plus, et le renverrait ici aussitôt. */
function reglerMarque(){
  var m = document.querySelector('.entete__marque');
  if(m) m.setAttribute('href', USER ? 'entreprises.html' : 'index.html');
}

/* L'accueil est un aiguillage : il n'a de sens que pour un visiteur qui ne sait
   pas encore ce qu'il vient chercher. Un client connecté est forcément un compte
   d'entreprise, puisque les particuliers n'en ont pas : il n'a plus rien à
   aiguiller, on l'envoie directement à ses packs.

   `replace` et non `href` : l'aiguillage ne doit pas rester dans l'historique,
   sinon le bouton Retour du navigateur y ramène et renvoie ici en boucle. */
if(ESPACE === 'accueil' && USER) location.replace('entreprises.html');

/* Les pages du compte se dessinent une fois, au chargement. Après une connexion
   ou une déconnexion il faut les redessiner, sinon la page continue d'afficher
   « vous n'êtes pas connecté », ou pire, les données de la personne qui vient de
   fermer la session. Ces trois fonctions n'existent que sur les pages du compte. */
function rafraichirPagesCompte(){
  if(typeof pageProfil !== 'function') return;
  pageProfil();
  pageCommandes();
  pagePaiements();
}

function deconnexion(){
  USER = null;
  save('erri_user', null);
  renderCompte();
  rafraichirPagesCompte();
  if(typeof apresDeconnexion === 'function') apresDeconnexion();
  toast('Vous êtes déconnecté.');
}

/* ---------- Fenêtre d'authentification ---------- */
function poserModaleAuth(){
  poserModale('ov-auth',
    '<div class="ov__boite" onclick="event.stopPropagation()">' +
      '<button class="ov__fermer" onclick="closeOv(\'ov-auth\')" aria-label="Fermer">&times;</button>' +
      '<div class="auth__onglets">' +
        '<button type="button" class="auth__onglet" id="tab-login" onclick="authOnglet(\'login\')">Se connecter</button>' +
        '<button type="button" class="auth__onglet" id="tab-reg" onclick="authOnglet(\'reg\')">Créer un compte</button>' +
      '</div>' +
      /* Arrivé ici depuis le panier : on dit que rien n'est perdu, sinon on croit
         qu'il faut tout recommencer (Massyl, 27 octobre 2026). */
      (REPRENDRE
        ? '<p class="auth__rappel">Votre panier est gardé. Connectez-vous ou créez votre compte, et la commande reprend là où vous en étiez.</p>'
        : '') +

      '<div id="a-login">' +
        '<div class="champ"><label for="l-email">Votre email</label>' +
          '<input type="email" id="l-email" placeholder="vous@exemple.dz" autocomplete="email"></div>' +
        '<p class="msg-err" id="l-err">Aucun compte ne correspond à cet email sur cet appareil.</p>' +
        '<button type="button" class="bouton bouton--accent bouton--large" onclick="doLogin()">Se connecter</button>' +
        '<p class="auth__bascule">Pas encore de compte ?' +
          '<button type="button" class="lien-discret" onclick="authOnglet(\'reg\')">Créez-en un</button></p>' +
        '<div class="auth__demo"><b>Comptes de démonstration</b><div id="login-list"></div></div>' +
      '</div>' +

      '<div id="a-reg">' +
        '<div class="champ"><label for="a-etab">Établissement ou société</label>' +
          '<input type="text" id="a-etab" placeholder="Merinal Laboratoires"></div>' +
        '<div class="champ"><label for="a-nom">Votre nom</label>' +
          '<input type="text" id="a-nom" placeholder="Amel Z."></div>' +
        '<div class="champ"><label for="a-tel">Téléphone</label>' +
          '<input type="tel" id="a-tel" placeholder="0550 11 22 33"></div>' +
        '<div class="champ"><label for="a-email">Email</label>' +
          '<input type="email" id="a-email" placeholder="vous@exemple.dz"></div>' +
        '<p class="msg-err" id="a-err">Vérifiez l\'établissement, le nom, le téléphone et l\'email.</p>' +
        '<button type="button" class="bouton bouton--accent bouton--large" onclick="doRegister()">Créer mon compte</button>' +
        /* Celui qui a déjà commandé ne doit pas créer un deuxième compte : le
           chemin de la connexion est écrit là, sous le bouton. */
        '<p class="auth__bascule">Vous avez déjà un compte ?' +
          '<button type="button" class="lien-discret" onclick="authOnglet(\'login\')">Connectez-vous</button></p>' +
        /* Ce que deviennent les informations demandées, dit là où elles sont
           demandées. Loi 18-07 : un formulaire qui prend un nom et un téléphone
           doit le dire et renvoyer à la page qui détaille tout. */
        '<p class="auth__note">Vos informations servent à préparer et à livrer vos commandes, et à ' +
          'rien d\'autre. <a href="confidentialite.html">Ce que nous en faisons</a>.</p>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-auth').setAttribute('onclick', "if(event.target===this)closeOv('ov-auth')");
}

function openAuth(onglet){
  poserModaleAuth();
  authOnglet(onglet || 'login');
  openOv('ov-auth');
}

function authOnglet(which){
  document.getElementById('tab-login').classList.toggle('on', which === 'login');
  document.getElementById('tab-reg').classList.toggle('on', which === 'reg');
  document.getElementById('a-login').classList.toggle('on', which === 'login');
  document.getElementById('a-reg').classList.toggle('on', which === 'reg');
  if(which === 'login') renderListeComptes();
}

/* Sur cet appareil, les comptes connus sont ceux qui ont déjà commandé, ceux
   que le traiteur a inscrits, et ceux qui ont créé leur compte ici (la fiche se
   pose à l'inscription, voir doRegister). */
function renderListeComptes(){
  var el = document.getElementById('login-list');
  if(!el) return;
  var comptes = clientsList();
  el.innerHTML = comptes.length ? comptes.map(function(c){
    /* L'email entre dans un attribut onclick : apostrophe échappée pour le JS,
       puis guillemets et chevrons neutralisés pour le HTML. */
    return '<div class="compte-demo" onclick="loginAs(\'' + esc(c.email.replace(/'/g, "\\'")) + '\')">' +
      '<b>' + esc(c.etab) + '</b><span>' + esc(c.nom) + ' &middot; ' + esc(c.email) + '</span></div>';
  }).join('') : '<div class="auth__vide">Aucun compte pour l\'instant. Créez le vôtre dans l\'onglet ci-dessus.</div>';
}

/* ---------- Entrer / sortir ---------- */
/* Levé quand une commande complète attend son compte : le formulaire de
   livraison est rempli, il ne manque que l'identité. Le brouillon lui-même est
   gardé par panier.js, pour survivre à un rechargement de la page. */
var REPRENDRE = false;

function entrerComme(u){
  USER = u;
  save('erri_user', USER);
  renderCompte();
  rafraichirPagesCompte();
  closeOv('ov-auth');
  toast('Bonjour ' + esc(u.nom) + '.');
  /* Une commande attendait : on rouvre le formulaire de livraison, déjà rempli.
     Il ne reste plus qu'à confirmer. */
  if(REPRENDRE){
    REPRENDRE = false;
    if(LINES.length) ouvrirCheckout();
  }
}

function loginAs(email){
  var c = clientsList().filter(function(x){ return x.email === email; })[0];
  if(c) entrerComme({nom:c.nom, tel:c.tel, etab:c.etab, email:c.email});
}

function doLogin(){
  var email = (document.getElementById('l-email').value || '').trim().toLowerCase();
  var c = clientsList().filter(function(x){ return x.email.toLowerCase() === email; })[0];
  if(!c){ montrerErreur('l-err', true); return; }
  montrerErreur('l-err', false);
  entrerComme({nom:c.nom, tel:c.tel, etab:c.etab, email:c.email});
}

function doRegister(){
  var etab = document.getElementById('a-etab').value.trim(),
      nom = document.getElementById('a-nom').value.trim(),
      tel = document.getElementById('a-tel').value.trim(),
      email = document.getElementById('a-email').value.trim();
  if(!etab || !nom || tel.length < 8 || email.indexOf('@') < 1){
    montrerErreur('a-err', true);
    return;
  }
  montrerErreur('a-err', false);
  /* Le compte s'inscrit dans la liste des clients connus de cet appareil.
     Sans cette fiche, un client qui crée son compte puis se déconnecte ne
     pouvait plus se reconnecter tant qu'il n'avait pas commandé : `clientsList()`
     ne lit que les commandes et les fiches. Relevé par la recette du 8 novembre
     2026, ligne 15. */
  enregistrerClientFiche(etab, nom, tel, email);
  entrerComme({nom:nom, tel:tel, etab:etab, email:email});
}

/* ---------- Démarrage ----------
   La zone du compte est dans l'en-tête de toutes les pages publiques : c'est
   donc ici qu'elle se dessine au chargement, et non dans le fichier d'une page
   en particulier. Une page qui n'a ni packs ni commandes (la page
   Confidentialité, par exemple) n'aurait sinon ni « Se connecter » ni la
   pastille du compte, et le visiteur n'aurait aucun moyen d'entrer. Les pages de
   packs et de compte l'appellent aussi de leur côté, pour redessiner la zone
   après une connexion : deux fois le même dessin, sans conséquence. */
document.addEventListener('DOMContentLoaded', renderCompte);
