/* Erriane Foods — Pages du compte client.
   Profil, mes commandes, mes paiements. Le client ne voit que ses propres données. */

/* ---------- Garde commune ---------- */
function blocConnexionRequise(){
  return '<div class="encart">' +
    '<h3>Vous n\'êtes pas connecté</h3>' +
    '<p>Connectez-vous pour retrouver votre profil, vos commandes et vos paiements.</p>' +
    '<button type="button" class="bouton bouton--accent" onclick="openAuth(\'login\')">Se connecter</button>' +
    '<button type="button" class="lien-discret" onclick="openAuth(\'reg\')">Créer un compte</button>' +
    '</div>';
}
function mesCommandes(){
  return USER ? ORDERS.filter(function(o){ return o.client.email === USER.email; }) : [];
}

/* ---------- Mon profil ---------- */
var profilEnEdition = false;

function pageProfil(){
  var zone = document.getElementById('zone-profil');
  if(!zone) return;
  if(!USER){ zone.innerHTML = blocConnexionRequise(); return; }

  var b = balFor(USER.email);
  var solde = b > 0
    ? '<div class="encart encart--alerte"><b>Reste à payer</b><span>' + fmt(b) + '</span></div>'
    : '<div class="encart encart--ok"><b>Compte à jour</b><span>' + (b < 0 ? 'Avoir de ' + fmt(-b) : 'Solde : 0 DA') + '</span></div>';

  zone.innerHTML =
    '<div class="panneau">' +
      '<div class="panneau__tete">' +
        '<h3>Informations de livraison</h3>' +
        '<button type="button" class="bouton bouton--secondaire bouton--petit" id="btn-profil" onclick="basculerProfil()">Modifier</button>' +
      '</div>' +
      '<div id="profil-lecture">' +
        ligneFiche('Établissement', USER.etab) +
        ligneFiche('Nom', USER.nom) +
        ligneFiche('Téléphone', USER.tel) +
        ligneFiche('Email', USER.email) +
      '</div>' +
      '<div id="profil-edition" style="display:none">' +
        '<div class="champ"><label for="p-etab">Établissement ou société</label><input type="text" id="p-etab"></div>' +
        '<div class="champ"><label for="p-nom">Votre nom</label><input type="text" id="p-nom"></div>' +
        '<div class="champ"><label for="p-tel">Téléphone</label><input type="tel" id="p-tel"></div>' +
        '<div class="champ"><label for="p-email">Email</label>' +
          '<input type="email" id="p-email" readonly>' +
          '<span class="champ__aide">L\'email identifie votre compte. Pour le changer, contactez-nous.</span></div>' +
        '<p class="msg-err" id="p-err">Remplissez l\'établissement, le nom et le téléphone.</p>' +
        '<button type="button" class="bouton bouton--accent" onclick="enregistrerProfil()">Mettre à jour</button>' +
      '</div>' +
    '</div>' +
    solde +
    '<div class="page__actions">' +
      '<a href="commandes.html" class="bouton bouton--secondaire">Mes commandes</a>' +
      '<a href="paiements.html" class="bouton bouton--secondaire">Mes paiements</a>' +
    '</div>';
}

function ligneFiche(libelle, valeur){
  return '<div class="fiche"><dt>' + esc(libelle) + '</dt><dd>' + esc(valeur || '—') + '</dd></div>';
}

function basculerProfil(){
  profilEnEdition = !profilEnEdition;
  var lecture = document.getElementById('profil-lecture');
  var edition = document.getElementById('profil-edition');
  var btn = document.getElementById('btn-profil');
  if(profilEnEdition){
    document.getElementById('p-etab').value = USER.etab;
    document.getElementById('p-nom').value = USER.nom;
    document.getElementById('p-tel').value = USER.tel;
    document.getElementById('p-email').value = USER.email;
    lecture.style.display = 'none';
    edition.style.display = '';
    btn.textContent = 'Annuler';
  } else {
    lecture.style.display = '';
    edition.style.display = 'none';
    btn.textContent = 'Modifier';
  }
  montrerErreur('p-err', false);
}

function enregistrerProfil(){
  var etab = document.getElementById('p-etab').value.trim(),
      nom = document.getElementById('p-nom').value.trim(),
      tel = document.getElementById('p-tel').value.trim();
  if(!etab || !nom || tel.length < 8){
    montrerErreur('p-err', true);
    return;
  }
  montrerErreur('p-err', false);
  /* L'email ne change pas ici : c'est lui qui relie le compte à ses commandes. */
  USER = {nom:nom, tel:tel, etab:etab, email:USER.email};
  save('erri_user', USER);
  profilEnEdition = false;
  renderCompte();
  pageProfil();
  toast('Profil mis à jour.');
}

/* ---------- Mes commandes ---------- */
function pageCommandes(){
  var zone = document.getElementById('zone-commandes');
  if(!zone) return;
  if(!USER){ zone.innerHTML = blocConnexionRequise(); return; }
  var miennes = mesCommandes();
  zone.innerHTML = miennes.length
    ? miennes.map(carteCommande).join('')
    : '<div class="encart"><h3>Aucune commande</h3><p>Vos commandes apparaîtront ici.</p>' +
      '<a href="entreprises.html" class="bouton bouton--accent">Voir les coffrets</a></div>';
}

function carteCommande(o){
  var lignes = o.lignes.map(function(l){
    return '<div class="cmd-ligne"><span>' + l.qty + ' &times; ' + esc(l.nom) + '</span><b>' + fmt(l.qty * l.pu) + '</b></div>';
  }).join('');
  var suite = o.rep ? '<p class="cmd-suite">Nouvelle date proposée : <b>' + esc(o.rep) + '</b></p>' : '';
  return '<article class="carte-cmd">' +
    '<div class="carte-cmd__tete">' +
      '<b>' + esc(o.ref) + '</b>' +
      '<span class="etat etat--' + o.st + '">' + esc(ST_LABEL_CLIENT[o.st] || o.st) + '</span>' +
    '</div>' +
    '<div class="carte-cmd__livraison">' + frDate(o.date) + ' à ' + esc(o.heure) + ' &middot; ' + esc(o.lieu) + '</div>' +
    '<div class="carte-cmd__lignes">' + lignes + '</div>' +
    suite +
    /* Le client voit que sa pièce jointe est arrivée : sinon il la renvoie, ou
       il appelle pour savoir. */
    (o.bdc ? '<p class="cmd-suite">Bon de commande joint : <b>' + esc(o.bdc) + '</b></p>' : '') +
    '<div class="carte-cmd__pied carte-cmd__pied--fort"><span>Total</span><b>' + fmt(o.total) + '</b></div>' +
    '</article>';
}

/* ---------- Mes paiements ---------- */
function pagePaiements(){
  var zone = document.getElementById('zone-paiements');
  if(!zone) return;
  if(!USER){ zone.innerHTML = blocConnexionRequise(); return; }

  var due = dueFor(USER.email), paid = paidFor(USER.email), b = due - paid;
  var versements = PAYMENTS.filter(function(x){ return x.email === USER.email; })
    .sort(function(a, c){ return c.date.localeCompare(a.date); });

  zone.innerHTML =
    '<div class="compte-resume">' +
      '<div><span>Commandes validées</span><b>' + fmt(due) + '</b></div>' +
      '<div><span>Versements encaissés</span><b>' + fmt(paid) + '</b></div>' +
      '<div><span>Solde</span><b class="' + (b > 0 ? 'solde-neg' : 'solde-pos') + '">' + fmt(b) + '</b></div>' +
    '</div>' +
    '<table class="tableau">' +
      '<thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>État</th></tr></thead>' +
      '<tbody>' + (versements.length ? versements.map(function(x){
        return '<tr><td>' + frDate(x.date) + '</td>' +
          '<td>' + esc(x.type) + (x.num ? '<small>n° ' + esc(x.num) + '</small>' : '') + '</td>' +
          '<td><b>' + fmt(x.montant) + '</b></td>' +
          '<td><span class="etat etat--' + (x.st === 'enc' ? 'confirmee' : 'attente') + '">' +
          (x.st === 'enc' ? 'Encaissé' : 'En attente') + '</span></td></tr>';
      }).join('') : '<tr><td colspan="4" class="tableau__vide">Aucun versement enregistré.</td></tr>') +
      '</tbody>' +
    '</table>' +
    '<p class="note-bas">Le paiement en ligne n\'est pas encore disponible. Les versements sont enregistrés par le traiteur.</p>';
}

/* ---------- Démarrage ---------- */
document.addEventListener('DOMContentLoaded', function(){
  poserToast();
  renderCompte();
  pageProfil();
  pageCommandes();
  pagePaiements();
});
