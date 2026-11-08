/* Erriane Foods — Espace traiteur, onglet Paiements.
   Trois choses, dans cet ordre : enregistrer un versement reçu, voir où en est
   chaque client, et retrouver l'historique de ce qui est passé. */

/* Ce qu'un versement peut être. Les mêmes valeurs s'affichent chez le client. */
var PAY_TYPES = ['Espèces', 'Chèque', 'Virement'];

/* Un chèque se suit par son numéro : c'est ce qu'on retrouve sur le relevé
   bancaire, et c'est ce qui manquait au traiteur. Le champ n'apparaît que
   pour un chèque, et il est obligatoire : un versement par chèque sans
   numéro ne se rapproche de rien. */
function majTypePaiement(){
  var t = document.getElementById('pay-type'),
      bloc = document.getElementById('pay-num-bloc'),
      num = document.getElementById('pay-num');
  if(!t || !bloc) return;
  var cheque = t.value === 'Chèque';
  bloc.hidden = !cheque;
  if(!cheque && num) num.value = '';
}

/* ---------- Le formulaire ---------- */
/* Le montant se pré-remplit avec le solde du client : c'est le cas le plus
   fréquent, et le traiteur peut toujours l'écraser. */
function remplirMontant(){
  var sel = document.getElementById('pay-email'),
      m = document.getElementById('pay-montant');
  if(!sel || !m) return;
  var s = sel.value ? soldeClient(sel.value) : 0;
  m.value = s > 0 ? s : '';
}
function ajouterVersement(){
  var sel = document.getElementById('pay-email'),
      m = document.getElementById('pay-montant'),
      t = document.getElementById('pay-type'),
      d = document.getElementById('pay-date'),
      s = document.getElementById('pay-statut'),
      num = document.getElementById('pay-num');
  var montant = Math.round(Number(m.value));
  if(!sel.value || !montant || montant <= 0){
    montrerErreur('pay-err', true);
    return;
  }
  /* Un chèque sans numéro ne se rapproche de rien sur le relevé : on refuse. */
  var numero = t.value === 'Chèque' ? (num.value || '').trim() : '';
  if(t.value === 'Chèque' && !numero){
    toast('Indiquez le numéro du chèque.');
    if(num) num.focus();
    return;
  }
  montrerErreur('pay-err', false);
  var cli = clientsList().filter(function(c){ return c.email === sel.value; })[0] || {};
  PAYMENTS.push({
    id: 'P-' + Date.now(),
    email: sel.value,
    etab: cli.etab || cli.nom || sel.value,
    montant: montant,
    type: t.value,
    num: numero,
    date: d.value || aujourdhui(),
    st: s.value
  });
  enregistrerPaiements();
  var reste = soldeClient(sel.value);
  toast(s.value === 'enc'
    ? 'Versement enregistré. Solde : ' + fmt(reste) + '.'
    : 'Versement enregistré, en attente d\'encaissement.');
  m.value = '';
  if(num) num.value = '';
  rendrePaiements();
  remplirMontant();
}

/* ---------- Ce qui est encaissé, ce qui ne l'est pas ---------- */
function encaisserVersement(id){
  var p = PAYMENTS.filter(function(x){ return x.id === id; })[0];
  if(!p) return;
  p.st = 'enc';
  enregistrerPaiements();
  toast('Versement de ' + esc(p.etab) + ' encaissé. Solde : ' + fmt(soldeClient(p.email)) + '.');
  rendrePaiements();
}
function supprimerVersement(id){
  var p = PAYMENTS.filter(function(x){ return x.id === id; })[0];
  if(!p) return;
  confirmerAction('Supprimer le versement de ' + fmt(p.montant) + ' (' + p.etab + ') ?', 'Supprimer', function(){
    PAYMENTS = PAYMENTS.filter(function(x){ return x.id !== id; });
    enregistrerPaiements();
    toast('Versement supprimé. Solde : ' + fmt(soldeClient(p.email)) + '.');
    rendrePaiements();
  });
}

/* ---------- Les trois blocs de l'écran ---------- */
/* La bannière du haut : l'argent qui dort, en une ligne. C'est la mécanique sur
   laquelle le site se vend, elle doit se voir avant la liste des versements.
   Rouge tant qu'il reste de l'argent dû, verte quand tout est encaissé. */
function majBandeSolde(){
  var zone = document.getElementById('pay-solde-bande');
  if(!zone) return;
  var clients = clientsList();
  var reste = 0, enRetard = 0;
  clients.forEach(function(c){
    var b = dueFor(c.email) - paidFor(c.email);
    if(b > 0){ reste += b; enRetard++; }
  });
  if(reste > 0){
    zone.className = 'adm-solde-bande adm-solde-bande--du';
    zone.innerHTML = '<b>' + fmt(reste) + '</b>' +
      '<span>' + (enRetard > 1 ? 'restent à encaisser sur ' + enRetard + ' clients'
                               : 'reste à encaisser sur 1 client') + '</span>';
  } else {
    zone.className = 'adm-solde-bande adm-solde-bande--ok';
    zone.innerHTML = '<b>Tout est encaissé.</b>' +
      (clients.length ? '<span>aucun solde en attente</span>' : '<span>aucun client pour le moment</span>');
  }
}

function rendrePaiements(){
  var sel = document.getElementById('pay-email');
  if(!sel) return;

  /* Les clients qui ont un compte, c'est-à-dire ceux qui commandent en ligne.
     Un particulier n'a pas de compte : il règle à la livraison, et il n'y a
     donc aucun solde à tenir pour lui. */
  var clients = clientsList();
  var garde = sel.value;
  sel.innerHTML = clients.length
    ? clients.map(function(c){
        return '<option value="' + esc(c.email) + '">' + esc(c.etab || c.nom || c.email) + '</option>';
      }).join('')
    : '<option value="">Aucun client pour le moment</option>';
  if(garde && clients.filter(function(c){ return c.email === garde; }).length) sel.value = garde;
  var champDate = document.getElementById('pay-date');
  if(champDate && !champDate.value) champDate.value = aujourdhui();

  /* La balance : ce qui est facturé, ce qui est rentré, ce qui reste. */
  var balance = document.getElementById('pay-balance');
  if(balance){
    var lignes = clients.map(function(c){
      var due = dueFor(c.email), paid = paidFor(c.email), b = due - paid;
      return '<tr>' +
        '<td><b>' + esc(c.etab || c.nom || c.email) + '</b>' +
          (c.etab && c.nom ? '<span class="adm-sous">' + esc(c.nom) + '</span>' : '') + '</td>' +
        '<td>' + fmt(due) + '</td>' +
        '<td>' + fmt(paid) + '</td>' +
        '<td><b class="' + (b > 0 ? 'adm-solde--du' : 'adm-solde--ok') + '">' + fmt(b) + '</b></td>' +
        '</tr>';
    }).join('');
    var totDue = clients.reduce(function(t, c){ return t + dueFor(c.email); }, 0);
    var totPaid = clients.reduce(function(t, c){ return t + paidFor(c.email); }, 0);
    balance.innerHTML = clients.length
      ? '<div class="adm-tableau"><table class="adm-table"><thead><tr>' +
          '<th>Client</th><th>Facturé (validé)</th><th>Versé (encaissé)</th><th>Solde</th>' +
        '</tr></thead><tbody>' + lignes +
        '<tr class="adm-table__total"><td>Total</td><td>' + fmt(totDue) + '</td>' +
          '<td>' + fmt(totPaid) + '</td><td><b>' + fmt(totDue - totPaid) + '</b></td></tr>' +
        '</tbody></table></div>'
      : '<div class="adm-vide">Aucun client pour le moment.</div>';
  }

  majBandeSolde();

  /* L'historique : tout ce qui a été saisi, du plus récent au plus ancien. */
  var histo = document.getElementById('pay-historique');
  if(histo){
    var vers = PAYMENTS.slice().sort(function(a, b){
      return String(b.date + b.id).localeCompare(String(a.date + a.id));
    });
    histo.innerHTML = vers.length
      ? '<div class="adm-tableau"><table class="adm-table"><thead><tr>' +
          '<th>Client</th><th>Type</th><th>Date</th><th>Montant</th><th>Statut</th><th></th>' +
        '</tr></thead><tbody>' + vers.map(function(p){
          return '<tr>' +
            '<td>' + esc(p.etab || p.email) + '</td>' +
            '<td>' + esc(p.type) + (p.num ? '<span class="adm-sous">n° ' + esc(p.num) + '</span>' : '') + '</td>' +
            '<td>' + frDate(p.date) + '</td>' +
            '<td><b>' + fmt(p.montant) + '</b></td>' +
            '<td><span class="etat etat--' + (p.st === 'enc' ? 'confirmee' : 'attente') + '">' +
              (p.st === 'enc' ? 'Encaissé' : 'En attente d\'encaissement') + '</span></td>' +
            '<td class="adm-actions-cellule">' +
              (p.st === 'enc' ? '' :
                '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="encaisserVersement(\'' + esc(p.id) + '\')">Marquer encaissé</button>') +
              '<button type="button" class="bouton bouton--secondaire bouton--petit" onclick="supprimerVersement(\'' + esc(p.id) + '\')">Supprimer</button>' +
            '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="adm-vide">Aucun versement enregistré.</div>';
  }
}
