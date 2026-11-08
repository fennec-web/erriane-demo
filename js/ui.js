/* Erriane Foods — Socle d'interface.
   Ouverture des fenêtres (modales), messages passagers, petits utilitaires DOM. */

/* Ouvre une fenêtre. Une seule à la fois : on ferme avant d'ouvrir,
   sinon deux fenêtres se superposent. */
function openOv(id, superposer){
  /* `superposer` : la fenêtre se pose par-dessus celle qui est ouverte, au lieu
     de la fermer. Sert à la confirmation, qui doit s'afficher devant le
     formulaire qu'elle interroge, et le laisser intact si l'on renonce. */
  if(!superposer){
    var ouverts = document.querySelectorAll('.ov.open');
    for(var i = 0; i < ouverts.length; i++) ouverts[i].classList.remove('open');
  }
  var el = document.getElementById(id);
  if(el) el.classList.add('open');
}
function closeOv(id){
  var el = document.getElementById(id);
  if(el) el.classList.remove('open');
}
/* ---------- Connecté veut dire entreprise ----------
   Le compte n'existe que pour les entreprises : un client connecté n'a donc rien
   à faire du menu particuliers, qui se commande sans compte. On pose une classe
   sur le body, et le CSS retire les entrées « Particuliers » du menu, du pied de
   page et de l'accueil (décision de Massyl, 27 octobre 2026).
   La classe se recalcule après chaque connexion et déconnexion, voir
   signalerConnexion() appelée par renderCompte(). */
function signalerConnexion(){
  var connecte = false;
  try { connecte = !!JSON.parse(localStorage.getItem('erri_user')); } catch(e){ connecte = false; }
  document.body.classList.toggle('est-connecte', connecte);
  /* Le style en ligne, en plus de la classe : un navigateur qui garde une
     ancienne feuille de style continuait d'afficher les entrées publiques après
     la connexion (Massyl, 27 octobre 2026). Le style en ligne gagne toujours. */
  var caches = document.querySelectorAll('.nav-public, .lien-particuliers');
  var montres = document.querySelectorAll('.nav-espace');
  for(var i = 0; i < caches.length; i++) caches[i].style.display = connecte ? 'none' : '';
  /* « inline-block » et non « '' » : la feuille de style cache ces entrées par
     défaut, donc une valeur vide les laisserait cachées. */
  for(var j = 0; j < montres.length; j++) montres[j].style.display = connecte ? 'inline-block' : 'none';
}
document.addEventListener('DOMContentLoaded', signalerConnexion);

/* L'accueil est un aiguillage : il sert à choisir entre les deux espaces. Un
   client connecté est une entreprise, son accueil est donc la page Entreprises,
   et il n'a plus rien à choisir (Massyl, 27 octobre 2026). On remplace l'entrée
   d'historique, pour que le retour arrière ne le ramène pas ici en boucle. */
/* La décision seule, sans navigation : c'est elle qu'on vérifie dans les tests. */
function doitRedirigerAccueil(espace, session){
  return espace === 'accueil' && !!session;
}

function aiguillageAccueil(){
  var session = null;
  try { session = JSON.parse(localStorage.getItem('erri_user')); } catch(e){ session = null; }
  if(!doitRedirigerAccueil(document.body.getAttribute('data-espace'), session)) return false;
  location.replace('entreprises.html');
  return true;
}
aiguillageAccueil();

/* La visibilité se règle par le style en ligne, jamais par l'attribut « hidden » :
   une règle de feuille de style comme le « display » de « .bouton » l'emporte sur
   « hidden », et les deux boutons s'affichaient alors ensemble dès que le CSS servi
   était l'ancien. Le style en ligne gagne toujours.
   Elle vivait dans catalogue.js jusqu'au 27 octobre 2026 ; elle est ici parce que
   la page particuliers charge ui.js et pas catalogue.js. */
function voir(el, visible){
  el.style.display = visible ? '' : 'none';
}
/* Échap ferme la fenêtre ouverte. */
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  var ouverts = document.querySelectorAll('.ov.open');
  for(var i = 0; i < ouverts.length; i++) ouverts[i].classList.remove('open');
});

/* Message passager en bas de l'écran. */
var TOAST_T = null;
function toast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(TOAST_T);
  TOAST_T = setTimeout(function(){ t.classList.remove('show'); }, 6000);
}

/* ---------- Le menu sur téléphone ----------
   L'en-tête est étroit : les liens passent sous la barre, et ce bouton les
   ouvre. L'attribut `data-ouvert` porte « true » ou « false », jamais rien : la
   feuille de style teste la valeur (voir base.css), donc un attribut posé vide
   n'ouvre pas le menu. Même geste que dans le gabarit (modeles/site/js/app.js). */
function basculerMenu(bouton){
  var entete = bouton.closest('.entete');
  if(!entete) return;
  var ouvert = entete.getAttribute('data-ouvert') === 'true';
  entete.setAttribute('data-ouvert', ouvert ? 'false' : 'true');
  bouton.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
}

/* Crée le bandeau de message s'il n'existe pas encore dans la page. */
function poserToast(){
  if(document.getElementById('toast')) return;
  var d = document.createElement('div');
  d.id = 'toast';
  document.body.appendChild(d);
}

/* Écrit une fenêtre dans la page à partir de son HTML. */
function poserModale(id, html){
  if(document.getElementById(id)) return;
  var d = document.createElement('div');
  d.id = id;
  d.className = 'ov';
  d.innerHTML = html;
  document.body.appendChild(d);
}

/* Affiche un message d'erreur dans une fenêtre. */
function montrerErreur(id, visible){
  var el = document.getElementById(id);
  if(el) el.style.display = visible ? 'block' : 'none';
}

/* Date du jour au format 2026-09-27, pour les champs date. */
function aujourdhui(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/* 2026-09-27 devient 27/09/2026. */
function frDate(iso){
  return iso ? iso.split('-').reverse().join('/') : '';
}

/* ---------- Confirmation dans la page ----------
   La boîte de dialogue du navigateur (`confirm`) peut être bloquée sans le dire :
   le bouton semble alors ne rien faire, et c'est arrivé sur « Vider le panier »
   (Massyl, 27 octobre 2026). Ici la question s'affiche dans la page, et l'action
   est gardée jusqu'au oui. */
var CONFIRME_ACTION = null;

function confirmerAction(message, libelle, action){
  CONFIRME_ACTION = action;
  poserModale('ov-confirme',
    '<div class="ov__boite ov__boite--confirme" onclick="event.stopPropagation()">' +
      '<p class="confirme__texte">' + esc(message) + '</p>' +
      '<div class="confirme__acts">' +
        '<button type="button" class="bouton bouton--accent" onclick="confirmeOui()">' +
          esc(libelle || 'Confirmer') + '</button>' +
        '<button type="button" class="bouton bouton--secondaire" onclick="confirmeNon()">Annuler</button>' +
      '</div>' +
    '</div>');
  document.getElementById('ov-confirme').setAttribute('onclick', "if(event.target===this)confirmeNon()");
  document.getElementById('ov-confirme').classList.add('ov--dessus');
  openOv('ov-confirme', true);
}
function confirmeOui(){
  var action = CONFIRME_ACTION;
  CONFIRME_ACTION = null;
  closeOv('ov-confirme');
  if(typeof action === 'function') action();
}
function confirmeNon(){
  CONFIRME_ACTION = null;
  closeOv('ov-confirme');
}
