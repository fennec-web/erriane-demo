/* Erriane Foods — Les deux bandes du site.
   Celle du haut, qui court sur toute la largeur de la page Entreprises, et
   celle qui reste sur le côté. Le traiteur les remplit depuis son espace,
   onglet Médias : il choisit un fichier déjà posé sur le site, chacune dans sa
   forme, large en haut et verticale sur le côté. Tant qu'il n'a rien réglé, les
   deux montrent les vidéos du client.

   Une vidéo se lance seule, sans son et en boucle : elle décore, elle ne
   s'impose pas. Le client qui a masqué la bande latérale ne la revoit pas de la
   visite : le souvenir ne dure que l'onglet ouvert, pas la journée. */

var CLE_BANDE_FERMEE = 'erri_bande_cote';

/* Les réglages des bandes sont lus par bandesReglages(), écrite dans media.js
   parce que l'espace traiteur s'en sert aussi : les deux écrans ne peuvent donc
   pas se contredire. */

/* Le média, tel qu'il se pose dans la page. Il est décoratif : le texte de la
   page porte le sens, et une vidéo n'a rien à annoncer à un lecteur d'écran. */
function mediaHtml(src, poster){
  var chemin = 'img/' + src;
  if(mediaEstVideo(src)){
    return '<video src="' + esc(chemin) + '"' +
      (poster ? ' poster="img/' + esc(poster) + '"' : '') +
      ' muted loop playsinline autoplay preload="metadata" aria-hidden="true"></video>';
  }
  return '<img src="' + esc(chemin) + '" alt="">';
}

function bandeCoteMasquee(){
  try { return sessionStorage.getItem(CLE_BANDE_FERMEE) === '1'; } catch(e){ return false; }
}
function fermerBandeCote(){
  try { sessionStorage.setItem(CLE_BANDE_FERMEE, '1'); } catch(e){ /* sans mémoire, on masque quand même */ }
  var aside = document.getElementById('bande-cote');
  if(aside) aside.hidden = true;
}

/* ---------- Quand la bande latérale entre en scène ----------
   Les deux bandes montrent des vidéos. Au chargement, celle du haut occupe
   toute la largeur : la bande latérale viendrait par-dessus, et on verrait deux
   vidéos l'une sur l'autre. Elle n'apparaît donc qu'une fois la bande du haut
   sortie de l'écran, et s'efface quand on remonte tout en haut. Sur une page
   sans bande du haut, il n'y a rien à attendre : elle se pose tout de suite.

   Le jour où le navigateur ne sait pas observer, on montre la bande plutôt que
   de la perdre : c'est un défaut d'affichage, pas une fonction perdue. */
function surveillerLeHaut(){
  var cote = document.getElementById('bande-cote');
  var haut = document.getElementById('bande-haut');
  if(!cote) return;
  if(!haut || haut.hidden || !('IntersectionObserver' in window)){
    cote.classList.add('bande-cote--posee');
    return;
  }
  var observateur = new IntersectionObserver(function(entrees){
    entrees.forEach(function(e){
      cote.classList.toggle('bande-cote--posee', !e.isIntersecting);
    });
  }, {threshold: 0});
  observateur.observe(haut);
}

function poserBandes(){
  var m = bandesReglages();

  /* La bande du haut se pose derrière le titre de la page Entreprises. */
  var haut = document.getElementById('bande-haut');
  if(haut && m.haut){
    haut.innerHTML = mediaHtml(m.haut, m.hautPoster);
    haut.hidden = false;
  }

  /* La bande latérale. */
  var cote = document.getElementById('bande-cote');
  if(!cote) return;
  cote.hidden = false;
  /* La feuille de style cache la bande quand il n'y a pas la place pour elle
     (voir css/site.css) : sur un téléphone, dans une fenêtre étroite, ou sur un
     écran trop bas. Dans ce cas on ne pose pas la vidéo du tout, parce qu'un
     navigateur télécharge une vidéo même cachée, et qu'un téléphone n'a pas à
     payer deux mégaoctets pour une bande que personne ne verra.
     On lit le style plutôt que de recopier le seuil ici : il n'y a donc qu'un
     seul endroit qui décide, et les deux ne peuvent pas se contredire. */
  var assezDePlace = getComputedStyle(cote).display !== 'none';
  if(!assezDePlace || !m.cote || bandeCoteMasquee()){
    cote.hidden = true;
    return;
  }
  var media = document.getElementById('bande-cote-media');
  var texte = document.getElementById('bande-cote-texte');
  if(media) media.innerHTML = mediaHtml(m.cote, '');
  if(texte){
    texte.textContent = m.coteTexte || '';
    texte.hidden = !m.coteTexte;
  }
  surveillerLeHaut();
}

document.addEventListener('DOMContentLoaded', poserBandes);
