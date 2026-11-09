/* Erriane Foods — la démonstration pré-remplie.
   Un visiteur qui arrive sur la maquette doit trouver un compte, des commandes
   et un versement. Sans ça, la fenêtre de connexion est vide et l'espace
   traiteur n'a pas une ligne : le site ne montre rien de ce qu'il sait faire.

   Le scénario vient du brief (section « Mécanique choisie ») et de la première
   démo. Les prix sont TTC depuis le 9 novembre 2026 : Merinal Laboratoires doit
   54 000 DA (54 × Coffret Basique à 1 000 DA), a versé 40 000, et il reste
   14 000 DA. Rien n'est inventé : ce sont les chiffres du dossier.

   Les dates sont relatives au jour de la visite, pour que la démonstration ne
   vieillisse pas. Elle ne s'écrit qu'une fois, et seulement si la mémoire du
   navigateur ne contient encore ni commande ni client : les données d'un vrai
   client ne sont jamais écrasées. */
(function(){
  try {
    if (localStorage.getItem('erri_amorce')) return;
    localStorage.setItem('erri_amorce', '1');
    if (localStorage.getItem('erri_orders') || localStorage.getItem('erri_clients')) return;

    function iso(n){
      var d = new Date();
      d.setDate(d.getDate() + n);
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var j = ('0' + d.getDate()).slice(-2);
      return d.getFullYear() + '-' + m + '-' + j;
    }

    var merinal = {nom:'Amel Z.', tel:'0550 11 22 33', etab:'Merinal Laboratoires', email:'amel@merinal.dz'};
    var seaal   = {nom:'Karim B.', tel:'0770 11 22 33', etab:'SEAAL Kouba', email:'karim@seaal.dz'};

    var clients = [
      {email:'amel@merinal.dz', etab:'Merinal Laboratoires', nom:'Amel Z.', tel:'0550 11 22 33'},
      {email:'karim@seaal.dz', etab:'SEAAL Kouba', nom:'Karim B.', tel:'0770 11 22 33'}
    ];

    var commandes = [
      {ref:'ERR-5621', client:merinal, total:54000, date:iso(3), heure:'12:00',
       lieu:'Siège Merinal, zone d’activité, Kouba', tel:'0550 11 22 33', note:'',
       st:'confirmee', rep:null, prep:{livreur:'Sofiane'}, bdc:'',
       lignes:[{cofId:'basique', nom:'Coffret Basique', qty:54, pu:1000,
                entree:'Salade variée', viande:'6 poulet, 4 veau',
                garnitures:'Riz, pommes de terre', dessert:'Fruits de saison',
                boisson:'Soda, jus d’orange'}]},
      {ref:'ERR-5622', client:seaal, total:24000, date:iso(5), heure:'12:30',
       lieu:'Siège SEAAL, Kouba', tel:'0770 11 22 33', note:'',
       st:'attente', rep:null, prep:{livreur:''}, bdc:'',
       lignes:[{cofId:'standard', nom:'Coffret Standard', qty:20, pu:1200,
                entree:'Potage de légumes', viande:'Escalope de dinde grillée',
                garnitures:'Semoule, haricots verts', dessert:'Yaourt',
                boisson:'Jus multifruits'}]}
    ];

    var versements = [
      {id:'P-1', email:'amel@merinal.dz', etab:'Merinal Laboratoires',
       montant:40000, type:'Espèces', num:'', date:iso(-5), st:'enc'}
    ];

    localStorage.setItem('erri_clients', JSON.stringify(clients));
    localStorage.setItem('erri_orders', JSON.stringify(commandes));
    localStorage.setItem('erri_pays', JSON.stringify(versements));
  } catch(e) { /* sans mémoire, le site reste vide mais fonctionne */ }
})();
