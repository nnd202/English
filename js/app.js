// English — interface. Écrans : accueil, partie (Sprint / Libre), bilan,
// stats, cartes, fiche d'une carte, réglages.
import * as store from './store.js';
import { creerPioche, difficultes, quotaNouvelles } from './tirage.js';
import { retenu } from './fsrs.js';
import { legende, zones, morceaux } from './ipa.js';
import { initVoix, dire, voixListe, voixOk } from './voix.js';
import { creerBoucle, noterCarte as noterCarteP, plusRatees, meilleure as meilleurePartie, bat } from './paquet.js';
import { noterDeck, ordreTour, plusDures, repartition, NOTES_DECK } from './decks.js';
import { schema, decouper, phraseComplete, estJuste, distracteurs, tirerQuestions } from './temps.js';
import { decouperPhrases, comparer, compter, choisirPhrases, morceaux as morceauxPhrase, phrasesWiki } from './dictee.js';

const $ = (s, r = document) => r.querySelector(s);
const vue = $('#vue'), nav = $('#nav'), feuille = $('#feuille');
const h = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let LANGUE = null, CARTES = [], PAR_ID = new Map(), DICTEES = [], BANQUE = [];
let partie = null, bilan = null, dictee = null, bilanDictee = null, exo = null, bilanTemps = null, TEMPS = null;
let DECKS = [], sessionDeck = null, bilanDeck = null, PAQUETS = [], sprintP = null, bilanP = null;

const DUREES = [300, 600, 900, 1200];
const TIRAGES = { melange: 'Brassage', hasard: 'Hasard', dues: 'Révisions', nouvelles: 'Nouvelles' };
const NOTES = { 1: 'Raté', 2: 'Difficile', 3: 'Bien', 4: 'Facile' };

// ---------- Utilitaires ----------
const chrono = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function duree(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
const dateCourte = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const dateHeure = (ms) => new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}

const ICONES = {
  maison: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  jouer: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
  cartes: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></svg>',
  reglages: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  son: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  lent: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5"/></svg>',
  sens: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg>',
  retour: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  lien: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  fermer: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

// ---------- Démarrage ----------
// Hauteur réellement visible (barre du navigateur et clavier déduits).
function ajusterHauteur() {
  const v = window.visualViewport;
  const r = document.documentElement.style;
  r.setProperty('--hauteur-visible', `${Math.round(v ? v.height : window.innerHeight)}px`);
  r.setProperty('--haut-visible', `${Math.round(v ? v.offsetTop : 0)}px`);
}

async function demarrer() {
  ajusterHauteur();
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', ajusterHauteur);
    visualViewport.addEventListener('scroll', ajusterHauteur);
  }
  window.addEventListener('resize', ajusterHauteur);
  const charge = async (u) => (await fetch(u, { cache: 'no-cache' })).json();
  LANGUE = await charge('data/langue.json');
  const { lots, dictees = [] } = await charge('data/lots.json');
  TEMPS = await charge('data/temps.json');
  DECKS = (await charge('data/decks.json')).decks;
  PAQUETS = (await charge('data/paquets.json')).paquets;
  const tous = await Promise.all([
    ...lots.map(nom => charge(`data/lots/${nom}.json`)),
    ...dictees.map(nom => charge(`data/dictees/${nom}.json`))
  ]);
  for (const lot of tous) {
    for (const c of lot.cartes || []) { c.lot = lot.lot; CARTES.push(c); PAR_ID.set(c.id, c); }
    for (const t of lot.textes || []) DICTEES.push(t);
    for (const x of lot.banque || []) BANQUE.push(x);
  }
  store.charger();
  initVoix(LANGUE.voix);
  window.addEventListener('hashchange', router);
  router();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

function router() {
  const hash = location.hash || '#/';
  if (partie && !partie.fini && hash !== '#/jeu') {
    history.pushState(null, '', '#/jeu');
    if (feuille.classList.contains('ouverte')) { fermerFeuille(); return; }
    mettrePause(true);
    return;
  }
  if (dictee && !dictee.fini && hash !== '#/dictee') {
    history.pushState(null, '', '#/dictee');
    voileQuitterDictee();
    return;
  }
  if (sessionDeck && !sessionDeck.fini && hash !== '#/deck') { finirDeck(true); return; }
  if (sprintP && !sprintP.fini && hash !== '#/paquet') {
    history.pushState(null, '', '#/paquet');
    if (feuille.classList.contains('ouverte')) { fermerFeuille(); return; }
    pausePaquet(true);
    return;
  }
  if (exo && !exo.fini && hash !== '#/exo-temps') {
    history.pushState(null, '', '#/exo-temps');
    $('#quitter-t')?.click();
    return;
  }
  fermerFeuille();
  const [, ecran, arg] = hash.split('/');
  nav.hidden = ['jeu', 'dictee', 'exo-temps', 'deck', 'paquet'].includes(ecran);
  document.body.classList.toggle('verrou', nav.hidden);
  if (!nav.hidden) window.scrollTo(0, 0);
  if (ecran === 'dictee' && dictee) return ecranDictee();
  if (ecran === 'bilan-dictee' && bilanDictee) return ecranBilanDictee();
  if (ecran === 'dictees') return ecranDictees();
  if (ecran === 'temps') return ecranTemps();
  if (ecran === 'decks') return ecranDecks();
  if (ecran === 'classique') return ecranClassique();
  if (ecran === 'paquet' && sprintP) return ecranPaquet();
  if (ecran === 'bilan-paquet' && bilanP) return ecranBilanPaquet();
  if (ecran === 'deck' && sessionDeck) return ecranDeck();
  if (ecran === 'bilan-deck' && bilanDeck) return ecranBilanDeck();
  if (ecran === 'exo-temps' && exo) return ecranExoTemps();
  if (ecran === 'bilan-temps' && bilanTemps) return ecranBilanTemps();
  if (ecran === 'coller') return ecranColler();
  if (ecran === 'jeu' && partie) return ecranJeu();
  if (ecran === 'bilan' && bilan) return ecranBilan();
  if (ecran === 'stats') return ecranStats();
  if (ecran === 'cartes') return ecranCartes();
  if (ecran === 'carte' && PAR_ID.has(decodeURIComponent(arg))) return ecranFiche(decodeURIComponent(arg));
  if (ecran === 'reglages') return ecranReglages();
  return ecranAccueil();
}

function dessinerNav(actif) {
  const b = (cle, lien, label) => `<a href="${lien}" class="${actif === cle ? 'actif' : ''}">${ICONES[cle]}<span>${label}</span></a>`;
  nav.innerHTML = `${b('maison', '#/', 'Accueil')}${b('stats', '#/stats', 'Stats')}
    <button class="nav-jouer" aria-label="Lancer un Sprint">${ICONES.jouer}</button>
    ${b('cartes', '#/cartes', 'Cartes')}${b('reglages', '#/reglages', 'Réglages')}`;
  $('.nav-jouer', nav).onclick = () => lancerPaquet(etatPaquets().dernier || PAQUETS[0].id);
}

// ---------- Bandeau de stats ----------
function chiffres() {
  const e = store.get();
  const aujourdhui = store.jourCle(Date.now());
  const sessionsJour = e.sessions.filter(s => store.jourCle(s.debut) === aujourdhui);
  return {
    serie: store.series(e.sessions),
    jour: sessionsJour.reduce((n, s) => n + (s.passees || 0), 0),
    total: e.sessions.reduce((n, s) => n + (s.joue || 0), 0)
  };
}
function bandeau() {
  const c = chiffres();
  return `<div class="bandeau">
    <div><b>${c.serie.enCours}</b><span>jour${c.serie.enCours > 1 ? 's' : ''} de suite</span><small>record ${c.serie.record}</small></div>
    <div><b>${c.jour}</b><span>cartes aujourd'hui</span></div>
    <div><b>${duree(c.total)}</b><span>temps cumulé</span></div>
  </div>`;
}
function entete(titre, sousTitre = '', avecBandeau = false, retour = '') {
  return `<header class="tete">
    <div class="tete-haut">
      ${retour ? `<a class="btn-rond" href="${retour}" aria-label="Retour">${ICONES.retour}</a>` : ''}
      <div><h1>${h(titre)}</h1>${sousTitre ? `<p>${h(sousTitre)}</p>` : ''}</div>
    </div>
    ${avecBandeau ? bandeau() : ''}
  </header>`;
}

// ---------- Accueil ----------
function infosPioche() {
  const e = store.get();
  const now = Date.now();
  const types = e.sprint.types;
  const actives = CARTES.filter(c => types.includes(c.type) && !(e.cartes[c.id] && e.cartes[c.id].ej));
  const dues = actives.filter(c => e.cartes[c.id] && e.cartes[c.id].s && e.cartes[c.id].due <= now).length;
  const jamais = actives.filter(c => !(e.cartes[c.id] && e.cartes[c.id].s)).length;
  const quota = Math.min(jamais, quotaNouvelles(e.reglages, store.introduitesLe(e.cartes, store.jourCle(now))));
  return { dues, quota, jamais };
}

function ecranClassique() {
  dessinerNav('maison');
  const e = store.get();
  const sp = e.sprint;
  const rec = store.records(e.sessions)[store.cleRecord({ duree: sp.duree, tirage: sp.tirage })];
  const inf = infosPioche();
  const puce = (groupe, val, label, actif) => `<button class="puce ${actif ? 'on' : ''}" data-${groupe}="${val}">${label}</button>`;
  vue.innerHTML = `${entete('Sprint classique', 'Le premier système : tirage Brassage, notes en 4 niveaux', false, '#/')}
  <main class="page">
    <section class="bloc sprint">
      <div class="bloc-titre"><h2>Sprint classique</h2><span>Le plus de cartes possible dans le temps choisi</span></div>
      <div class="puces">${DUREES.map(d => puce('duree', d, `${d / 60} min`, sp.duree === d)).join('')}</div>
      <div class="puces">${Object.entries(TIRAGES).map(([k, v]) => puce('tirage', k, v, sp.tirage === k)).join('')}</div>
      <div class="puces petites">${store.TYPES.map(t => puce('type', t, LANGUE.types[t], sp.types.includes(t))).join('')}</div>
      <div class="record">${rec
        ? `Record <b>${rec.passees} cartes</b> en ${sp.duree / 60} min · ${TIRAGES[sp.tirage]} <span>le ${dateCourte(rec.debut)}</span>`
        : `Pas encore de record en ${sp.duree / 60} min · ${TIRAGES[sp.tirage]}`}</div>
      <p class="info">${pluriel(inf.jamais, 'carte')} jamais vue${inf.jamais > 1 ? 's' : ''} · ${pluriel(inf.dues, 'carte')} à revoir${sp.tirage === 'melange' ? ` · ${Math.round(e.reglages.partNouvelles * 100)} % de nouveautés` : ''}${inf.quota < inf.jamais ? ` · plafond : ${inf.quota} aujourd'hui` : ''}</p>
      <button class="btn-principal" data-lancer="sprint">${ICONES.jouer} Démarrer le Sprint</button>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Decks</h2><span>Un paquet fixe de 45 à 60 cartes, tout à la suite, puis tes cartes dures à rabâcher</span></div>
      <a class="btn-second fort" href="#/decks">Ouvrir les decks</a>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Mode libre</h2><span>Sans chrono ni record : prendre son temps, lire, écouter</span></div>
      <button class="btn-second" data-lancer="libre">Commencer</button>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Dictées</h2><span>Écouter, taper, comparer mot à mot</span></div>
      <a class="btn-second" href="#/dictees">Choisir un texte</a>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Les temps</h2><span>Placer l'action sur la frise, conjuguer, la grille des 12 temps</span></div>
      <a class="btn-second" href="#/temps">S'entraîner</a>
    </section>
    <section class="bloc bientot">
      <div class="bloc-titre"><h2>Bientôt</h2></div>
      <div class="ligne-bientot"><b>Verbes irréguliers</b><span>la grille à remplir</span></div>
    </section>
  </main>`;
  vue.querySelectorAll('[data-duree]').forEach(b => b.onclick = () => { sp.duree = +b.dataset.duree; store.sauver(); ecranClassique(); });
  vue.querySelectorAll('[data-tirage]').forEach(b => b.onclick = () => { sp.tirage = b.dataset.tirage; store.sauver(); ecranClassique(); });
  vue.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
    const t = b.dataset.type;
    if (sp.types.includes(t)) { if (sp.types.length > 1) sp.types = sp.types.filter(x => x !== t); }
    else sp.types = store.TYPES.filter(x => x === t || sp.types.includes(x));
    store.sauver(); ecranClassique();
  });
  vue.querySelectorAll('[data-lancer]').forEach(b => b.onclick = () => lancer(b.dataset.lancer));
  brancherRappel();
}

// ---------- Rappel de sauvegarde ----------
function rappelSauvegarde() {
  const e = store.get(), r = e.reglages.rappelJours;
  if (!r || !e.sessions.length) return '';
  const ref = Math.max(e.derniereSauvegarde || e.sessions[0].debut, e.rappelReporte || 0);
  if (Date.now() - ref < r * 86400000) return '';
  return `<div class="rappel"><span>${e.derniereSauvegarde ? `Dernière sauvegarde le ${dateCourte(e.derniereSauvegarde)}.` : 'Aucune sauvegarde pour l\'instant.'}</span>
    <div><button class="btn-mini" data-sauver>Sauvegarder</button><button class="btn-mini clair" data-plustard>Plus tard</button></div></div>`;
}
function brancherRappel() {
  const s = $('[data-sauver]'), p = $('[data-plustard]');
  if (s) s.onclick = exporter;
  if (p) p.onclick = () => { const e = store.get(); e.rappelReporte = Date.now() - (e.reglages.rappelJours - 1) * 86400000; store.sauver(); router(); };
}

// ---------- Partie ----------
function lancer(mode) {
  const e = store.get();
  const now = Date.now();
  const options = { tirage: e.sprint.tirage, types: [...e.sprint.types] };
  const pioche = creerPioche({
    cartes: CARTES, etats: e.cartes, reglages: e.reglages, options, maintenant: now,
    introduitesAujourdhui: store.introduitesLe(e.cartes, store.jourCle(now)),
    debutJour: new Date(now).setHours(0, 0, 0, 0)
  });
  if (!pioche.infos.actives) { toast('Aucune carte disponible avec ces filtres.'); return; }
  partie = {
    id: 's' + now, mode, duree: mode === 'sprint' ? e.sprint.duree : null, tirage: options.tirage, types: options.types,
    debut: now, joueMs: 0, top: now, pause: false, pauses: 0, fini: false,
    pioche, courante: null, retournee: false, surligne: null,
    notes: { 1: 0, 2: 0, 3: 0, 4: 0 }, passees: 0, retours: 0, exclues: 0, nouvelles: 0, rates: [], cartes: []
  };
  carteSuivante();
  history.pushState(null, '', '#/jeu');
  router();
  boucle();
}

const tempsJoue = () => partie.joueMs + (partie.pause ? 0 : Date.now() - partie.top);

function boucle() {
  clearInterval(boucle.t);
  boucle.t = setInterval(() => {
    if (!partie || partie.fini) { clearInterval(boucle.t); return; }
    const t = tempsJoue();
    const el = $('#chrono');
    if (partie.mode === 'sprint') {
      const reste = partie.duree * 1000 - t;
      if (el) el.textContent = chrono(reste);
      const barre = $('#barre-temps');
      if (barre) barre.style.width = `${Math.min(100, t / (partie.duree * 10))}%`;
      if (el) el.classList.toggle('urgent', reste < 30000);
      if (reste <= 0) finir(true);
    } else if (el) el.textContent = chrono(t);
  }, 200);
}

function carteSuivante() {
  const x = partie.pioche.suivante();
  partie.courante = x ? { ...x, depuis: tempsJoue() } : null;
  partie.retournee = false;
  partie.surligne = null;
}

function mettrePause(oui) {
  if (!partie || partie.fini || partie.pause === oui) { if (oui) dessinerPause(); return; }
  if (oui) { partie.joueMs += Date.now() - partie.top; partie.pause = true; partie.pauses++; }
  else { partie.top = Date.now(); partie.pause = false; }
  ecranJeu();
}

function enregistrerEnCours() {
  const e = store.get();
  e.enCours = resumePartie(false);
  e.enCours.derniere = Date.now();
  store.sauver();
}

function noterCourante(g) {
  const c = partie.courante;
  if (!c) return;
  const ms = tempsJoue() - c.depuis;
  if (g === 0) {
    store.ejecter(c.carte.id);
    partie.exclues++;
  } else {
    store.noterCarte(c.carte.id, g, ms);
    partie.notes[g]++;
    partie.passees++;
    if (c.retour) partie.retours++;
    if (c.nouvelle) partie.nouvelles++;
    if (g === 1) { partie.pioche.retour(c.carte.id); if (!partie.rates.includes(c.carte.id)) partie.rates.push(c.carte.id); }
  }
  partie.cartes.push([c.carte.id, g, Math.round(ms)]);
  enregistrerEnCours();
  carteSuivante();
  if (!partie.courante) { finir(partie.mode === 'libre'); return; }
  ecranJeu();
}

function resumePartie(complet) {
  const p = partie;
  return {
    id: p.id, mode: p.mode, duree: p.duree, tirage: p.tirage, types: p.types,
    debut: p.debut, fin: Date.now(), joue: Math.round(p.mode === 'sprint' && complet ? p.duree * 1000 : tempsJoue()),
    complet, passees: p.passees, notes: { ...p.notes }, retours: p.retours, exclues: p.exclues,
    nouvelles: p.nouvelles, pauses: p.pauses, rates: [...p.rates], cartes: p.cartes
  };
}

function finir(complet) {
  if (!partie || partie.fini) return;
  if (!partie.pause) { partie.joueMs += Date.now() - partie.top; partie.pause = true; }
  partie.fini = true;
  clearInterval(boucle.t);
  const e = store.get();
  const s = resumePartie(partie.mode === 'sprint' ? complet : true);
  const avant = store.records(e.sessions)[store.cleRecord(s)];
  e.enCours = null;
  if (s.cartes.length) e.sessions.push(s);
  store.sauver();
  bilan = { s, avant, nouveauRecord: s.mode === 'sprint' && s.complet && s.passees > 0 && (!avant || s.passees > avant.passees) };
  partie = null;
  location.replace('#/bilan');
}

// ---------- Rendu d'une carte ----------
// Le flap t̬ (t + U+032C) est mal placé par certaines polices : on le dessine nous-mêmes.
const ipaHtml = (s) => h(s).replace(/t\u032C/g, '<span class="flap">t</span>');
function htmlSurligne(texte, spec) {
  return morceaux(texte, zones(texte, spec)).map(m => m.on ? `<mark>${ipaHtml(m.t)}</mark>` : ipaHtml(m.t)).join('');
}

function htmlCarte(c, { retournee, surligne }) {
  const p = surligne != null ? (c.p || [])[surligne] : null;
  const reg = store.get().reglages;
  let html = `<div class="fiche-type">${h(LANGUE.types[c.type])}</div>
    <div class="fiche-texte ${c.type === 'phrase' || c.type === 'temps' ? 'long' : ''}">${retournee && p && p.mot ? htmlSurligne(c.texte, p.mot) : h(c.texte)}</div>
    ${c.note && c.note.startsWith('(') ? `<div class="fiche-note">${h(c.note)}</div>` : ''}`;
  if (!retournee) return html + `<div class="fiche-indice">Prononce, puis retourne</div>`;
  html += `<div class="fiche-ipa${c.ipa.length > 24 ? ' long' : ''}">/${p && p.ipa ? htmlSurligne(c.ipa, p.ipa) : ipaHtml(c.ipa)}/</div>
    <div class="fiche-actions">
      <button data-dire="1">${ICONES.son}<span>Écouter</span></button>
      <button data-dire="lent">${ICONES.lent}<span>Lent</span></button>
      <button data-sens>${ICONES.sens}<span>Sens</span></button>
    </div>`;
  if (c.temps && TEMPS) {
    const t = TEMPS.temps.find(x => x.id === c.temps);
    html += `<div class="schema-carte">${schema(c.temps)}<span><b>${h(t.nom)}</b> · ${h(t.forme)}</span></div>`;
  }
  if (reg.pastilles && c.p && c.p.length) {
    html += `<div class="pastilles">${c.p.map((x, i) => `<button class="pastille p-${x.t} ${surligne === i ? 'on' : ''}" data-pastille="${i}">${h(LANGUE.pastilles[x.t].nom)}</button>`).join('')}</div>`;
    if (p) html += `<div class="regle">${h(LANGUE.pastilles[p.t].regle)}</div>`;
  }
  const leg = legende(c.ipa, LANGUE.symboles, reg.legendeComplete);
  html += `<button class="legende" data-legende>${leg.map(x => `<span><b>${ipaHtml(x.s)}</b>${h(x.ex)}</span>`).join('')}</button>`;
  return html;
}

function brancherCarte(racine, c, etatRendu, redessiner) {
  racine.querySelectorAll('[data-dire]').forEach(b => b.onclick = (ev) => {
    ev.stopPropagation();
    const r = store.get().reglages;
    if (!dire(c.texte, { vitesse: b.dataset.dire === 'lent' ? r.vitesseLente : 1, nom: r.voix })) toast('Synthèse vocale indisponible sur ce navigateur.');
  });
  const s = racine.querySelector('[data-sens]');
  if (s) s.onclick = (ev) => { ev.stopPropagation(); feuilleSens(c); };
  racine.querySelectorAll('[data-pastille]').forEach(b => b.onclick = (ev) => {
    ev.stopPropagation();
    const i = +b.dataset.pastille;
    etatRendu.surligne = etatRendu.surligne === i ? null : i;
    redessiner();
  });
  const l = racine.querySelector('[data-legende]');
  if (l) l.onclick = (ev) => { ev.stopPropagation(); feuilleLegende(); };
}

// ---------- Écran de jeu ----------
function ecranJeu() {
  nav.hidden = true;
  const p = partie;
  if (!p) return router();
  const c = p.courante;
  const sprint = p.mode === 'sprint';
  const t = tempsJoue();
  vue.innerHTML = `<div class="jeu">
    <div class="jeu-tete">
      <button class="btn-rond" id="btn-pause" aria-label="Pause">${ICONES.pause}</button>
      <div class="jeu-chrono"><span id="chrono">${chrono(sprint ? p.duree * 1000 - t : t)}</span><small>${sprint ? `Sprint · ${TIRAGES[p.tirage]}` : 'Mode libre'}</small></div>
      <div class="jeu-score"><b>${p.passees}</b><small>cartes</small></div>
      ${sprint ? `<div class="barre"><div id="barre-temps" style="width:${Math.min(100, t / (p.duree * 10))}%"></div></div>` : ''}
    </div>
    <div class="jeu-zone">
      <div class="fiche ${p.retournee ? 'verso' : 'recto'}" id="fiche">${c ? htmlCarte(c.carte, p) : ''}</div>
    </div>
    <div class="jeu-bas">
      ${p.retournee
        ? `<button class="ejecter" data-g="0">Trop facile · ne plus montrer</button>
           <div class="notes">${[1, 2, 3, 4].map(g => `<button class="n${g}" data-g="${g}">${NOTES[g]}</button>`).join('')}</div>`
        : `<button class="btn-principal" id="retourner">Retourner</button>`}
    </div>
    ${p.pause ? htmlPause() : ''}
  </div>`;
  $('#btn-pause').onclick = () => mettrePause(true);
  const fiche = $('#fiche');
  if (!p.retournee) {
    const tourner = () => { p.retournee = true; ecranJeu(); };
    fiche.onclick = tourner;
    $('#retourner').onclick = tourner;
  } else {
    brancherCarte(fiche, c.carte, p, ecranJeu);
    vue.querySelectorAll('[data-g]').forEach(b => b.onclick = () => noterCourante(+b.dataset.g));
  }
  if (p.pause) brancherPause();
}

function htmlPause() {
  return `<div class="voile-pause"><div class="boite">
    <h2>Pause</h2><p>Le chrono est arrêté.</p>
    <button class="btn-principal" id="reprendre">Reprendre</button>
    <button class="btn-second" id="terminer">Terminer la partie</button>
    ${partie.mode === 'sprint' ? '<small>Une partie terminée avant la fin ne compte pas pour les records.</small>' : ''}
  </div></div>`;
}
function dessinerPause() { if (partie && !$('.voile-pause')) ecranJeu(); }
function brancherPause() {
  $('#reprendre').onclick = () => mettrePause(false);
  $('#terminer').onclick = () => finir(false);
}

// ---------- Bilan ----------
function barreNotes(notes) {
  const total = [1, 2, 3, 4].reduce((n, g) => n + (notes[g] || 0), 0) || 1;
  return `<div class="barre-notes">${[4, 3, 2, 1].map(g => notes[g] ? `<div class="n${g}" style="flex:${notes[g] / total}"></div>` : '').join('')}</div>
    <div class="legende-notes">${[4, 3, 2, 1].map(g => `<span><i class="n${g}"></i>${NOTES[g]} <b>${notes[g] || 0}</b></span>`).join('')}</div>`;
}

function ecranBilan() {
  dessinerNav('');
  const { s, avant, nouveauRecord } = bilan;
  const sprint = s.mode === 'sprint';
  const details = [
    s.retours ? pluriel(s.retours, 'retour') : '',
    s.nouvelles ? pluriel(s.nouvelles, 'nouvelle') : ''
  ].filter(Boolean).join(' · ');
  const horsScore = [
    s.exclues ? `${s.exclues} ${s.exclues > 1 ? 'cartes exclues' : 'carte exclue'} (hors score)` : '',
    s.pauses ? pluriel(s.pauses, 'pause') : ''
  ].filter(Boolean).join(' · ');
  vue.innerHTML = `${entete('Bilan', sprint ? `Sprint ${s.duree / 60} min · ${TIRAGES[s.tirage]}` : 'Mode libre')}
  <main class="page">
    <section class="bloc bilan">
      ${nouveauRecord ? '<div class="badge-record">Nouveau record !</div>' : ''}
      <div class="gros"><b>${s.passees}</b><span>cartes</span></div>
      <p class="sous">en ${chrono(s.joue)}${sprint && !s.complet ? ' · terminée avant la fin' : ''}</p>
      ${barreNotes(s.notes)}
      ${details ? `<p class="info centre">dont ${details}</p>` : ''}
      ${horsScore ? `<p class="info centre">${horsScore}</p>` : ''}
      ${sprint && avant && !nouveauRecord ? `<p class="info centre">Record : ${avant.passees} cartes (le ${dateCourte(avant.debut)})</p>` : ''}
    </section>
    ${s.rates.length ? `<section class="bloc"><div class="bloc-titre"><h2>À retravailler</h2><span>Les cartes ratées de la partie</span></div>
      ${s.rates.map(id => ligneCarte(PAR_ID.get(id))).join('')}</section>` : ''}
    <div class="boutons">
      <button class="btn-principal" id="rejouer">${ICONES.jouer} Rejouer</button>
      <a class="btn-second" href="#/">Accueil</a>
    </div>
  </main>`;
  $('#rejouer').onclick = () => lancer(s.mode);
}

function ligneCarte(c, extra = '') {
  if (!c) return '';
  return `<a class="ligne-carte" href="#/carte/${encodeURIComponent(c.id)}">
    <div><b>${h(c.texte)}</b>${c.note && c.note.startsWith('(') ? ` <small>${h(c.note)}</small>` : ''}<span class="ipa-mini">/${ipaHtml(c.ipa)}/</span></div>
    ${extra ? `<em>${extra}</em>` : ''}</a>`;
}

// ---------- Stats ----------
function ecranStats() {
  dessinerNav('stats');
  const e = store.get();
  const now = Date.now();
  const recs = Object.values(store.records(e.sessions)).sort((a, b) => a.duree - b.duree || a.tirage.localeCompare(b.tirage));
  const totalNotes = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const s of e.sessions) for (const g of [1, 2, 3, 4]) totalNotes[g] += (s.notes && s.notes[g]) || 0;

  const etats = e.cartes;
  const vues = CARTES.filter(c => etats[c.id] && etats[c.id].s);
  const ejectees = CARTES.filter(c => etats[c.id] && etats[c.id].ej);
  const maitrisees = vues.filter(c => etats[c.id].s >= 21 && !etats[c.id].ej);
  const dues = vues.filter(c => etats[c.id].due <= now && !etats[c.id].ej);
  const dures = vues.filter(c => !etats[c.id].ej).sort((a, b) => etats[b.id].d - etats[a.id].d).slice(0, 8);
  const lentes = vues.filter(c => etats[c.id].n).sort((a, b) => etats[b.id].t / etats[b.id].n - etats[a.id].t / etats[a.id].n).slice(0, 8);

  // 14 derniers jours
  const jours = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    const k = store.jourCle(d.getTime());
    const n = e.sessions.filter(s => store.jourCle(s.debut) === k).reduce((x, s) => x + (s.passees || 0), 0);
    jours.push({ k, n, d });
  }
  const max = Math.max(1, ...jours.map(j => j.n));
  // Barres de 70 au plus sous une marge de 18 : l'étiquette du plus haut jour reste visible.
  const graphe = `<svg class="graphe" viewBox="0 0 280 110">${jours.map((j, i) => {
    const hb = j.n ? Math.max(3, 70 * j.n / max) : 0;
    return `<rect x="${i * 20 + 3}" y="${88 - hb}" width="14" height="${hb}" rx="4"/>${j.n ? `<text x="${i * 20 + 10}" y="${84 - hb}">${j.n}</text>` : ''}<text class="jour" x="${i * 20 + 10}" y="104">${j.d.getDate()}</text>`;
  }).join('')}</svg>`;

  vue.innerHTML = `${entete('Stats', '', true)}
  <main class="page">
    ${statsPaquets()}
    <section class="bloc"><div class="bloc-titre"><h2>Records du Sprint classique</h2><span>Meilleure partie complète par durée et tirage</span></div>
      ${recs.length ? recs.map(r => `<div class="ligne-record"><div><b>${r.duree / 60} min</b> · ${TIRAGES[r.tirage]}<small>le ${dateCourte(r.debut)}</small></div><strong>${r.passees}</strong></div>
        <div class="mini-notes">${barreNotes(r.notes)}</div>`).join('') : '<p class="info">Pas encore de Sprint complet.</p>'}
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>14 derniers jours</h2><span>Cartes passées par jour</span></div>${graphe}</section>
    <section class="bloc"><div class="bloc-titre"><h2>Stock</h2></div>
      <div class="grille-chiffres">
        <div><b>${CARTES.length}</b><span>cartes</span></div>
        <div><b>${vues.length}</b><span>déjà vues</span></div>
        <div><b>${maitrisees.length}</b><span>bien ancrées</span></div>
        <div><b>${dues.length}</b><span>à revoir</span></div>
        <div><b>${ejectees.length}</b><span>éjectées</span></div>
        <div><b>${e.sessions.length}</b><span>parties</span></div>
      </div>
      <p class="info">« Bien ancrées » : tenues au moins 3 semaines selon FSRS.</p>
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>Toutes tes notes</h2></div>${barreNotes(totalNotes)}</section>
    ${statsDictees(e.sessions)}
    ${statsTemps(e.sessions)}
    ${dures.length ? `<section class="bloc"><div class="bloc-titre"><h2>Les plus dures</h2><span>Difficulté calculée par FSRS (sur 10)</span></div>
      ${dures.map(c => ligneCarte(c, etats[c.id].d.toFixed(1))).join('')}</section>` : ''}
    ${lentes.length ? `<section class="bloc"><div class="bloc-titre"><h2>Celles qui prennent du temps</h2><span>Temps moyen par passage, tous modes</span></div>
      ${lentes.map(c => ligneCarte(c, `${(etats[c.id].t / etats[c.id].n / 1000).toFixed(1)} s`)).join('')}</section>` : ''}
    <section class="bloc"><div class="bloc-titre"><h2>Historique</h2></div>
      ${e.sessions.length ? e.sessions.slice(-30).reverse().map(s => s.mode === 'paquet' ? `<div class="ligne-histo">
        <div><b>Sprint</b> · ${h(s.titre)}<small>${dateHeure(s.debut)} · ${libDuree(s.duree)} · ${s.rates} raté${s.rates > 1 ? 's' : ''}</small></div>
        <div class="histo-droite"><strong>${s.complet ? '✓ ' + chrono(s.joue) : `${s.ok}/${s.total}`}</strong></div>
      </div>` : s.mode === 'deck' ? `<div class="ligne-histo">
        <div><b>Deck</b> · ${h(s.titre)}<small>${dateHeure(s.debut)} · ${chrono(s.joue)}${s.complet ? ' · tour terminé' : ''}</small></div>
        <div class="histo-droite"><strong>${s.passees}</strong><span class="pts"><i class="n4">${s.notesDeck[0]}</i><i class="n2">${s.notesDeck[1]}</i><i class="n1">${s.notesDeck[2]}</i></span></div>
      </div>` : s.mode === 'temps' ? `<div class="ligne-histo">
        <div><b>Temps</b> · ${h(MODES_TEMPS[s.exercice].nom)}<small>${dateHeure(s.debut)} · ${chrono(s.joue)}</small></div>
        <div class="histo-droite"><strong>${s.justes}/${s.total}</strong></div>
      </div>` : s.mode === 'dictee' ? `<div class="ligne-histo">
        <div><b>Dictée${s.niveau && s.source === 'banque' ? '' : ''}</b> · ${h(s.titre)}<small>${dateHeure(s.debut)} · ${chrono(s.joue)}</small></div>
        <div class="histo-droite"><strong>${pourcent(s)}</strong></div>
      </div>` : `<div class="ligne-histo">
        <div><b>${s.mode === 'sprint' ? `Sprint ${s.duree / 60} min` : 'Libre'}</b> · ${TIRAGES[s.tirage] || ''}<small>${dateHeure(s.debut)} · ${chrono(s.joue)}${s.mode === 'sprint' && !s.complet ? ' · arrêtée' : ''}</small></div>
        <div class="histo-droite"><strong>${s.passees}</strong><span class="pts">${[4, 3, 2, 1].map(g => `<i class="n${g}">${s.notes[g] || 0}</i>`).join('')}</span></div>
      </div>`).join('') : '<p class="info">Aucune partie pour l\'instant.</p>'}
    </section>
  </main>`;
}

// ---------- Cartes ----------
let filtreCartes = { q: '', f: 'toutes' };
function ecranCartes() {
  dessinerNav('cartes');
  const e = store.get();
  const now = Date.now();
  const F = { toutes: 'Toutes', vues: 'Vues', jamais: 'Jamais vues', dues: 'À revoir', ejectees: 'Éjectées' };
  vue.innerHTML = `${entete('Cartes', `${CARTES.length} cartes dans le stock`)}
  <main class="page">
    <input class="recherche" type="search" placeholder="Chercher un mot…" value="${h(filtreCartes.q)}">
    <div class="puces petites">${Object.entries(F).map(([k, v]) => `<button class="puce ${filtreCartes.f === k ? 'on' : ''}" data-f="${k}">${v}</button>`).join('')}</div>
    <div id="liste"></div>
  </main>`;
  const dessinerListe = () => {
    const q = filtreCartes.q.trim().toLowerCase();
    const liste = CARTES.filter(c => {
      const x = e.cartes[c.id] || {};
      if (q && !c.texte.toLowerCase().includes(q)) return false;
      switch (filtreCartes.f) {
        case 'vues': return x.s && !x.ej;
        case 'jamais': return !x.s && !x.ej;
        case 'dues': return x.s && !x.ej && x.due <= now;
        case 'ejectees': return x.ej;
        default: return true;
      }
    });
    $('#liste').innerHTML = liste.length ? `<div class="bloc liste">${liste.map(c => {
      const x = e.cartes[c.id] || {};
      return ligneCarte(c, x.ej ? 'éjectée' : x.s ? `${x.n}×` : '');
    }).join('')}</div>` : '<p class="info centre">Aucune carte.</p>';
  };
  $('.recherche').oninput = (ev) => { filtreCartes.q = ev.target.value; dessinerListe(); };
  vue.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtreCartes.f = b.dataset.f; ecranCartes(); });
  dessinerListe();
}

// ---------- Fiche d'une carte ----------
function ecranFiche(id) {
  dessinerNav('cartes');
  const c = PAR_ID.get(id);
  const e = store.get();
  const x = e.cartes[id] || {};
  const etatRendu = { surligne: null };
  const diff = difficultes(CARTES, e.cartes)[id];
  const dessiner = () => {
    vue.innerHTML = `${entete(c.texte, LANGUE.types[c.type], false, 'javascript:history.back()')}
    <main class="page">
      <div class="fiche verso seule" id="fiche">${htmlCarte(c, { retournee: true, surligne: etatRendu.surligne })}</div>
      <section class="bloc">
        <div class="grille-chiffres">
          <div><b>${x.n || 0}</b><span>passages</span></div>
          <div><b>${diff.d.toFixed(1)}</b><span>difficulté${diff.estimee ? ' estimée' : ''}</span></div>
          <div><b>${x.n ? (x.t / x.n / 1000).toFixed(1) + ' s' : '—'}</b><span>temps moyen</span></div>
          <div><b>${x.s ? Math.round(retenu(x, Date.now()) * 100) + ' %' : '—'}</b><span>mémoire</span></div>
          <div><b>${x.due ? dateCourte(x.due) : '—'}</b><span>prochaine révision</span></div>
          <div><b>${x.l || 0}</b><span>oublis</span></div>
        </div>
        <button class="btn-second" id="ej">${x.ej ? 'Remettre en jeu' : 'Trop facile · ne plus montrer'}</button>
      </section>
    </main>`;
    brancherCarte($('#fiche'), c, etatRendu, dessiner);
    $('#ej').onclick = () => { store.ejecter(id, !x.ej); toast(x.ej ? 'Carte remise en jeu.' : 'Carte éjectée.'); ecranFiche(id); };
  };
  dessiner();
}

// ---------- Feuilles (sens, légende) ----------
function ouvrirFeuille(html) {
  feuille.innerHTML = `<div class="voile" data-fermer></div><div class="feuille">
    <button class="btn-rond fermer" data-fermer aria-label="Fermer">${ICONES.fermer}</button>${html}</div>`;
  feuille.classList.add('ouverte');
  feuille.querySelectorAll('[data-fermer]').forEach(b => b.onclick = fermerFeuille);
}
function fermerFeuille() { feuille.classList.remove('ouverte'); feuille.innerHTML = ''; }

function lienPour(modele, c) {
  const brut = (modele.source === 'lemme' ? (c.lemme || c.texte) : c.texte).replace(/[.?!,]+$/, '');
  return modele.url
    .replace('{code}', encodeURIComponent(brut))
    .replace('{tirets}', encodeURIComponent(brut.toLowerCase().replace(/[^a-z0-9' -]/g, '').trim().replace(/\s+/g, '-')))
    .replace('{soulignes}', encodeURIComponent(brut.replace(/\s+/g, '_')));
}

function feuilleSens(c) {
  const liens = LANGUE.liens.filter(l => l.types.includes(c.type));
  ouvrirFeuille(`<div class="sens">
    <h2>${h(c.texte)}</h2>
    <p class="def">${h(c.def)}</p>
    ${c.ex ? `<p class="ex">${h(c.ex)}</p>` : ''}
    ${c.note && !c.note.startsWith('(') ? `<p class="note">${h(c.note)}</p>` : ''}
    <div class="liens">${liens.map(l => `<a href="${lienPour(l, c)}" target="_blank" rel="noopener">${h(l.nom)}${ICONES.lien}</a>`).join('')}</div>
  </div>`);
}

function feuilleLegende() {
  const groupes = {};
  for (const s of LANGUE.symboles) (groupes[s.g] ||= []).push(s);
  ouvrirFeuille(`<div class="legende-complete"><h2>Légende IPA</h2><p class="info">${ipaHtml(LANGUE.notation)}</p>
    ${Object.entries(groupes).map(([g, l]) => `<h3>${h(g)}</h3><div class="leg-grille">${l.map(s => `<span><b>${ipaHtml(s.s)}</b>${h(s.ex)}</span>`).join('')}</div>`).join('')}
  </div>`);
}

// ---------- Réglages ----------
function ecranReglages() {
  dessinerNav('reglages');
  const e = store.get(), r = e.reglages;
  const voix = voixListe();
  const champ = (cle, label, aide, min, max, pas = 1) => `<label class="reglage"><div><b>${label}</b><small>${aide}</small></div>
    <input type="number" inputmode="numeric" data-cle="${cle}" min="${min}" max="${max}" step="${pas}" value="${r[cle]}"></label>`;
  const bascule = (cle, label, aide) => `<label class="reglage"><div><b>${label}</b><small>${aide}</small></div>
    <input type="checkbox" class="interrupteur" data-cle="${cle}" ${r[cle] ? 'checked' : ''}></label>`;
  vue.innerHTML = `${entete('Réglages')}
  <main class="page">
    <section class="bloc"><div class="bloc-titre"><h2>Tirage des cartes</h2><span>Une carte ne revient jamais dans la même partie, sauf une ratée, une fois, 8 à 12 cartes plus loin.</span></div>
      <label class="reglage"><div><b>Part de nouveautés</b><small>En Brassage, part des cartes jamais vues : <span id="val-part">${Math.round(r.partNouvelles * 100)} %</span>. Le reste est de la révision.</small></div>
        <input type="range" min="0" max="1" step="0.1" data-cle="partNouvelles" value="${r.partNouvelles}"></label>
      ${champ('nouvellesMax', 'Plafond de nouvelles par jour', '0 = aucun plafond.', 0, 500, 5)}
      <label class="reglage"><div><b>Poids de la difficulté</b><small>En révision, les cartes dures sortent plus souvent.</small></div>
        <input type="range" min="0" max="1" step="0.1" data-cle="poidsDifficulte" value="${r.poidsDifficulte}"></label>
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>Carte</h2></div>
      ${bascule('pastilles', 'Pastilles', 'Flap T, liaison, forme faible… sous l\'IPA.')}
      ${bascule('legendeComplete', 'Légende complète', 'Montrer aussi les symboles évidents (p, b, t…).')}
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>Voix</h2></div>
      ${voixOk() ? `<label class="reglage"><div><b>Voix américaine</b><small>${voix.length ? `${voix.length} voix trouvée${voix.length > 1 ? 's' : ''}` : 'Aucune voix en-US détectée : installe-la dans les réglages de synthèse vocale du téléphone.'}</small></div>
        <select data-cle="voix"><option value="">Automatique</option>${voix.map(v => `<option ${v === r.voix ? 'selected' : ''}>${h(v)}</option>`).join('')}</select></label>` : '<p class="info">Synthèse vocale indisponible sur ce navigateur.</p>'}
      ${champ('vitesseLente', 'Vitesse « lent »', 'De 0,5 à 0,9.', 0.5, 0.9, 0.05)}
      <button class="btn-second" id="test-voix">${ICONES.son} Tester : « figure it out »</button>
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>Sauvegarde</h2><span>Les données ne vivent que dans ce navigateur.</span></div>
      ${champ('rappelJours', 'Rappel tous les', 'jours (0 = jamais).', 0, 60)}
      <p class="info">${e.derniereSauvegarde ? `Dernière sauvegarde le ${dateHeure(e.derniereSauvegarde)}.` : 'Aucune sauvegarde pour l\'instant.'}</p>
      <button class="btn-principal" id="exporter">Sauvegarder maintenant</button>
      <label class="btn-second fichier">Importer une sauvegarde<input type="file" accept=".txt,.json,text/plain,application/json" id="importer" hidden></label>
      <p class="info">L'import fusionne sans doublon : rien n'est perdu.</p>
    </section>
    <p class="info centre version">English · ${CARTES.length} cartes</p>
  </main>`;
  vue.querySelectorAll('[data-cle]').forEach(inp => inp.onchange = () => {
    const cle = inp.dataset.cle;
    let v = inp.type === 'checkbox' ? inp.checked : inp.tagName === 'SELECT' ? inp.value : Number(inp.value);
    if (typeof v === 'number') { if (Number.isNaN(v)) return; v = Math.min(Number(inp.max), Math.max(Number(inp.min), v)); }
    r[cle] = v; store.sauver(); toast('Réglage enregistré.');
    if (cle === 'partNouvelles') $('#val-part').textContent = `${Math.round(v * 100)} %`;
  });
  $('#test-voix').onclick = () => dire('figure it out', { nom: r.voix });
  $('#exporter').onclick = exporter;
  $('#importer').onchange = (ev) => importer(ev.target.files[0]);
}

// ---------- Export / import ----------
async function exporter() {
  const e = store.get();
  const d = new Date();
  const nom = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')} - Export English.txt`;
  const contenu = JSON.stringify({ app: 'English', v: 1, date: d.toISOString(), etat: { cartes: e.cartes, sessions: e.sessions, reglages: e.reglages, sprint: e.sprint, textes: e.textes, dictee: e.dictee, phrasesDictee: e.phrasesDictee, decks: e.decks, paquets: e.paquets } });
  const fichier = new File([contenu], nom, { type: 'text/plain' });
  let ok = false;
  try {
    if (navigator.canShare && navigator.canShare({ files: [fichier] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      await navigator.share({ files: [fichier], title: nom });
      ok = true;
    }
  } catch (err) { if (err.name === 'AbortError') return; }
  if (!ok) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(fichier); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  e.derniereSauvegarde = Date.now();
  store.sauver();
  toast('Sauvegarde créée.');
  router();
}

async function importer(f) {
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'English' || !data.etat) throw new Error('format');
    const e = store.get();
    const fus = store.fusionner(e, data.etat);
    store.remplacer({ ...e, cartes: fus.cartes, sessions: fus.sessions, textes: fus.textes, phrasesDictee: fus.phrasesDictee, decks: fus.decks, paquets: fus.paquets });
    toast(`Import réussi : ${fus.sessions.length} parties au total.`);
    router();
  } catch {
    toast('Fichier non reconnu.');
  }
}

// ---------- Dictées ----------
const NIVEAUX = ['B1', 'B2', 'C1', 'C2'];
const VITESSES = { lente: { label: 'Lente', v: 0.75 }, normale: { label: 'Normale', v: 1 }, rapide: { label: 'Rapide', v: 1.15 } };
const ECOUTES = { 0: 'Illimitées', 3: '3 par phrase', 1: 'Une seule' };
const pourcent = (s) => s.mots ? `${Math.round(100 * s.justes / s.mots)} %` : '—';

function statsDictees(sessions) {
  const d = sessions.filter(s => s.mode === 'dictee');
  if (!d.length) return '';
  const mots = d.reduce((n, s) => n + s.mots, 0), justes = d.reduce((n, s) => n + s.justes, 0);
  const parNiveau = NIVEAUX.map(nv => {
    const x = d.filter(s => s.niveau === nv);
    const m = x.reduce((n, s) => n + s.mots, 0), j = x.reduce((n, s) => n + s.justes, 0);
    return x.length ? `<div><b>${Math.round(100 * j / m)} %</b><span>${nv} · ${pluriel(x.length, 'dictée')}</span></div>` : '';
  }).join('');
  return `<section class="bloc"><div class="bloc-titre"><h2>Dictées</h2><span>Part de mots justes</span></div>
    <div class="grille-chiffres">
      <div><b>${d.length}</b><span>dictées</span></div>
      <div><b>${mots ? Math.round(100 * justes / mots) : 0} %</b><span>mots justes</span></div>
      <div><b>${duree(d.reduce((n, s) => n + s.joue, 0))}</b><span>temps</span></div>
      ${parNiveau}
    </div></section>`;
}

function meilleure(id) {
  const d = store.get().sessions.filter(s => s.mode === 'dictee' && s.texteId === id && s.mots);
  if (!d.length) return null;
  return Math.max(...d.map(s => Math.round(100 * s.justes / s.mots)));
}

function resumeReglages(r) {
  return [VITESSES[r.vitesse].label.toLowerCase(), ECOUTES[r.ecoutes].toLowerCase(), r.aideMots ? 'nombre de mots' : '', r.aideMorceaux ? 'par morceaux' : ''].filter(Boolean).join(' · ');
}

function ecranDictees() {
  dessinerNav('maison');
  const e = store.get(), r = e.dictee;
  const vus = (nv) => BANQUE.filter(p => p.niveau === nv && e.phrasesDictee[p.id]).length;
  const total = (nv) => BANQUE.filter(p => p.niveau === nv).length;
  const puce = (cle, val, label, actif) => `<button class="puce ${actif ? 'on' : ''}" data-r="${cle}" data-v="${val}">${label}</button>`;
  const ligne = (t, perso) => {
    const m = meilleure(t.id);
    return `<div class="ligne-dictee">
      <button class="ld-main" data-dictee="${h(t.id)}">
        <b>${h(t.titre)}</b><small>${h(t.genre || 'Ton texte')} · ${pluriel(t.phrases.length, 'phrase')}</small>
      </button>
      ${m != null ? `<em>${m} %</em>` : ''}
      ${perso ? `<button class="ld-suppr" data-suppr="${h(t.id)}" aria-label="Supprimer">${ICONES.fermer}</button>` : ''}
    </div>`;
  };
  vue.innerHTML = `${entete('Dictées', 'La voix lit, tu tapes, l\'appli compare', false, '#/')}
  <main class="page">
    <section class="bloc">
      <div class="bloc-titre"><h2>Nouvelle dictée</h2><span>Des phrases tirées au hasard, jamais vues avant</span></div>
      <div class="puces">${NIVEAUX.map(nv => puce('niveau', nv, nv, r.niveau === nv)).join('')}</div>
      <p class="info">${r.niveau} : ${vus(r.niveau)} phrases faites sur ${total(r.niveau)}</p>
      <div class="sous-titre">Phrases</div>
      <div class="puces petites">${[4, 6, 8, 10].map(n => puce('nb', n, n, r.nb === n)).join('')}</div>
      <div class="sous-titre">Vitesse de lecture</div>
      <div class="puces petites">${Object.entries(VITESSES).map(([k, x]) => puce('vitesse', k, x.label, r.vitesse === k)).join('')}</div>
      <div class="sous-titre">Écoutes</div>
      <div class="puces petites">${[0, 3, 1].map(k => puce('ecoutes', k, ECOUTES[k], r.ecoutes === k)).join('')}</div>
      <div class="sous-titre">Aides</div>
      <div class="puces petites">
        <button class="puce ${r.aideMots ? 'on' : ''}" data-aide="aideMots">Nombre de mots</button>
        <button class="puce ${r.aideMorceaux ? 'on' : ''}" data-aide="aideMorceaux">Écouter par morceaux</button>
      </div>
      <button class="btn-principal" id="nouvelle">Commencer</button>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Dictée surprise</h2><span>Un article de Wikipédia lu à voix haute, impossible à connaître d'avance. Registre écrit, plutôt C1. Mêmes réglages ; les noms propres sont pardonnés.</span></div>
      <div class="boutons-ligne">
        <button class="btn-second" data-wiki="jour">Article du jour</button>
        <button class="btn-second" data-wiki="hasard">Au hasard</button>
      </div>
    </section>
    <section class="bloc liste"><div class="bloc-titre"><h2>Histoires</h2><span>Textes suivis, plutôt B1-B2</span></div>${DICTEES.map(t => ligne(t, false)).join('')}</section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Coller un texte</h2><span>Un article, un passage de livre, une réplique… Il reste sur ton téléphone.</span></div>
      <a class="btn-second" href="#/coller">Coller un texte</a>
    </section>
    ${e.textes.length ? `<section class="bloc liste"><div class="bloc-titre"><h2>Tes textes</h2></div>${e.textes.map(t => ligne(t, true)).join('')}</section>` : ''}
    <section class="bloc">
      <div class="bloc-titre"><h2>Avec de vraies voix</h2><span>Enregistrements humains, accents variés : le complément idéal à la voix du téléphone.</span></div>
      <a class="btn-second" href="https://dailydictation.com/" target="_blank" rel="noopener">Daily Dictation ${ICONES.lien}</a>
    </section>
  </main>`;
  vue.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    const v = b.dataset.v;
    r[b.dataset.r] = ['nb', 'ecoutes'].includes(b.dataset.r) ? +v : v;
    store.sauver(); ecranDictees();
  });
  vue.querySelectorAll('[data-aide]').forEach(b => b.onclick = () => { r[b.dataset.aide] = !r[b.dataset.aide]; store.sauver(); ecranDictees(); });
  $('#nouvelle').onclick = () => {
    const choix = choisirPhrases(BANQUE, e.phrasesDictee, r.niveau, r.nb, Date.now());
    if (!choix.length) { toast('Aucune phrase pour ce niveau.'); return; }
    lancerDictee({ id: 'banque-' + r.niveau, titre: `Dictée ${r.niveau}`, phrases: choix.map(p => p.texte), ids: choix.map(p => p.id) }, { source: 'banque', niveau: r.niveau });
  };
  vue.querySelectorAll('[data-wiki]').forEach(b => b.onclick = () => dicteeWiki(b.dataset.wiki, b));
  vue.querySelectorAll('[data-dictee]').forEach(b => b.onclick = () => {
    const id = b.dataset.dictee;
    const t = DICTEES.find(x => x.id === id) || e.textes.find(x => x.id === id);
    if (t) lancerDictee(t, { source: DICTEES.includes(t) ? 'histoire' : 'texte' });
  });
  vue.querySelectorAll('[data-suppr]').forEach(b => b.onclick = () => {
    const t = e.textes.find(x => x.id === b.dataset.suppr);
    if (!t || !confirmerDouce(b)) return;
    e.textes = e.textes.filter(x => x !== t);
    store.sauver(); toast('Texte supprimé.'); ecranDictees();
  });
}

// Article de Wikipédia (résumé), en direct. Plusieurs essais si l'article est trop court.
async function dicteeWiki(quoi, bouton) {
  const r = store.get().dictee;
  const lib = bouton.textContent;
  bouton.textContent = 'Recherche…'; bouton.disabled = true;
  try {
    let art = null;
    if (quoi === 'jour') {
      const d = new Date();
      const u = `https://en.wikipedia.org/api/rest_v1/feed/featured/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const j = await (await fetch(u)).json();
      art = j.tfa;
    }
    for (let essai = 0; essai < 6 && !(art && phrasesWiki(art.extract || '', r.nb).length >= Math.min(3, r.nb)); essai++) {
      art = await (await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary')).json();
    }
    const phrases = art ? phrasesWiki(art.extract || '', r.nb) : [];
    if (!phrases.length) throw new Error('vide');
    const titre = art.titles?.normalized || art.title;
    lancerDictee({ id: 'wiki', titre, phrases, url: art.content_urls?.mobile?.page || art.content_urls?.desktop?.page }, { source: 'wiki', niveau: 'C1', indulgenceNoms: true });
  } catch {
    toast('Wikipédia est injoignable pour l\'instant (connexion ?).');
    bouton.textContent = lib; bouton.disabled = false;
  }
}

// Suppression en deux touchers (pas de boîte de dialogue du navigateur).
function confirmerDouce(bouton) {
  if (bouton.dataset.arme) return true;
  bouton.dataset.arme = '1';
  bouton.classList.add('arme');
  toast('Touche encore pour supprimer.');
  setTimeout(() => { delete bouton.dataset.arme; bouton.classList.remove('arme'); }, 3000);
  return false;
}

function ecranColler() {
  dessinerNav('maison');
  vue.innerHTML = `${entete('Coller un texte', '', false, '#/dictees')}
  <main class="page">
    <section class="bloc">
      <input class="champ" id="titre-texte" placeholder="Titre (facultatif)" maxlength="60">
      <textarea class="champ grand" id="texte-colle" placeholder="Colle ici un texte en anglais…" autocomplete="off" spellcheck="false"></textarea>
      <p class="info" id="apercu">0 phrase</p>
      <button class="btn-principal" id="garder">Enregistrer et commencer</button>
    </section>
  </main>`;
  const zone = $('#texte-colle');
  zone.oninput = () => { $('#apercu').textContent = pluriel(decouperPhrases(zone.value).length, 'phrase'); };
  $('#garder').onclick = () => {
    const phrases = decouperPhrases(zone.value);
    if (!phrases.length) { toast('Colle d\'abord un texte.'); return; }
    const titre = $('#titre-texte').value.trim() || phrases[0].split(' ').slice(0, 5).join(' ') + '…';
    const t = { id: 'u' + Date.now(), titre, phrases, date: Date.now() };
    store.get().textes.unshift(t);
    store.sauver();
    lancerDictee(t, { source: 'texte' });
  };
}

function lancerDictee(t, opts = {}) {
  const r = { ...store.get().dictee };
  dictee = {
    texte: t, opts, reglages: r, i: 0, saisie: '', resultats: [],
    ecoutes: Array(t.phrases.length).fill(0), debut: Date.now(), verifie: false, fini: false
  };
  history.pushState(null, '', '#/dictee');
  router();
  clearInterval(lancerDictee.t);
  lancerDictee.t = setInterval(() => {
    if (!dictee || dictee.fini) { clearInterval(lancerDictee.t); return; }
    const el = $('#chrono-d');
    if (el) el.textContent = chrono(Date.now() - dictee.debut);
  }, 500);
}

function htmlComparaison(elts) {
  return elts.map(e => {
    switch (e.k) {
      case 'ok': return `<span class="d-ok">${h(e.ref)}</span>`;
      case 'nom': return `<span class="d-nom">${h(e.ref)}</span>`;
      case 'faute': return `<span class="d-faute"><del>${h(e.saisi)}</del><ins>${h(e.ref)}</ins></span>`;
      case 'faux': return `<span class="d-faux"><del>${h(e.saisi)}</del><ins>${h(e.ref)}</ins></span>`;
      case 'manque': return `<ins class="d-manque">${h(e.ref)}</ins>`;
      default: return `<del class="d-ajout">${h(e.saisi)}</del>`;
    }
  }).join(' ');
}

function ecranDictee() {
  nav.hidden = true;
  const d = dictee, t = d.texte, n = t.phrases.length, r = d.reglages;
  const phrase = t.phrases[d.i];
  const res = d.verifie ? d.resultats[d.i] : null;
  const c = res ? compter(res) : null;
  const max = r.ecoutes, reste = max ? Math.max(0, max - d.ecoutes[d.i]) : Infinity;
  const bloque = !res && reste === 0;
  const parts = r.aideMorceaux ? morceauxPhrase(phrase) : [];
  const nbMots = phrase.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;
  const infoEcoute = res ? '' : max
    ? (reste ? `${pluriel(reste, 'écoute')} restante${reste > 1 ? 's' : ''}` : 'Plus d\'écoute : à toi de jouer.')
    : (d.ecoutes[d.i] ? `Écoutée ${d.ecoutes[d.i]} fois` : 'Écoute la phrase, puis tape-la.');
  vue.innerHTML = `<div class="jeu dictee">
    <div class="jeu-tete">
      <button class="btn-rond" id="quitter-d" aria-label="Quitter">${ICONES.fermer}</button>
      <div class="jeu-chrono"><span id="chrono-d">${chrono(Date.now() - d.debut)}</span><small>${h(t.titre)}</small></div>
      <div class="jeu-score"><b>${d.i + 1}/${n}</b><small>phrase</small></div>
      <div class="barre"><div style="width:${100 * (d.i + (d.verifie ? 1 : 0)) / n}%"></div></div>
    </div>
    <div class="dictee-corps">
      <div class="fiche dictee-fiche">
        <div class="fiche-actions grandes">
          <button data-ecoute="norm" ${bloque ? 'disabled' : ''}>${ICONES.son}<span>Écouter</span></button>
          <button data-ecoute="lent" ${bloque ? 'disabled' : ''}>${ICONES.lent}<span>Lent</span></button>
        </div>
        ${parts.length > 1 && !res ? `<div class="morceaux">${parts.map((m, k) => `<button class="puce" data-morceau="${k}" ${bloque ? 'disabled' : ''}>${k + 1}</button>`).join('')}<span>par morceaux</span></div>` : ''}
        <p class="info" id="info-ecoute">${infoEcoute}</p>
        ${r.aideMots && !res ? `<p class="aide-mots">${'<i></i>'.repeat(nbMots)}<span>${nbMots} mots</span></p>` : ''}
        ${res ? `<div class="correction">${htmlComparaison(res)}</div>
          <p class="info centre">${c.justes}/${c.mots} mots justes${c.fautes ? ` · ${pluriel(c.fautes, 'faute')} d'orthographe` : ''}${c.faux ? ` · ${c.faux} faux` : ''}${c.manques ? ` · ${c.manques} oublié${c.manques > 1 ? 's' : ''}` : ''}${c.ajouts ? ` · ${c.ajouts} en trop` : ''}</p>
          <button class="btn-mini clair relire" data-ecoute="norm">${ICONES.son} Réécouter</button>`
          : `<textarea class="champ saisie" id="saisie" rows="3" placeholder="Tape ce que tu entends…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${h(d.saisie)}</textarea>`}
      </div>
      ${res
        ? `<button class="btn-principal" id="suivante">${d.i + 1 < n ? 'Phrase suivante' : 'Voir le bilan'}</button>`
        : `<button class="btn-principal" id="verifier">Vérifier</button>`}
    </div>
  </div>`;
  const ecouter = (texte, vitesse) => {
    if (!res && max && d.ecoutes[d.i] >= max) return;
    if (!dire(texte, { vitesse, nom: store.get().reglages.voix })) { toast('Synthèse vocale indisponible sur ce navigateur.'); return; }
    if (!res) { d.ecoutes[d.i]++; if (max && d.ecoutes[d.i] >= max) { setTimeout(ecranDictee, 50); return; } }
    const info = $('#info-ecoute');
    if (info && !res) info.textContent = max ? `${pluriel(max - d.ecoutes[d.i], 'écoute')} restante${max - d.ecoutes[d.i] > 1 ? 's' : ''}` : `Écoutée ${d.ecoutes[d.i]} fois`;
  };
  vue.querySelectorAll('[data-ecoute]').forEach(b => b.onclick = () =>
    ecouter(phrase, b.dataset.ecoute === 'lent' ? store.get().reglages.vitesseLente : VITESSES[r.vitesse].v));
  vue.querySelectorAll('[data-morceau]').forEach(b => b.onclick = () => ecouter(parts[+b.dataset.morceau], VITESSES[r.vitesse].v));
  $('#quitter-d').onclick = voileQuitterDictee;
  const zone = $('#saisie');
  if (zone) zone.oninput = () => { d.saisie = zone.value; };
  const v = $('#verifier');
  if (v) v.onclick = () => {
    if (!d.saisie.trim()) { toast('Tape d\'abord la phrase.'); return; }
    d.resultats[d.i] = comparer(phrase, d.saisie, { indulgenceNoms: !!d.opts.indulgenceNoms });
    d.verifie = true;
    ecranDictee();
  };
  const s = $('#suivante');
  if (s) s.onclick = () => {
    if (d.i + 1 < n) { d.i++; d.saisie = ''; d.verifie = false; ecranDictee(); }
    else finirDictee();
  };
}

function voileQuitterDictee() {
  if (!dictee || $('.voile-pause')) return;
  const div = document.createElement('div');
  div.className = 'voile-pause';
  div.innerHTML = `<div class="boite"><h2>Quitter la dictée ?</h2><p>${dictee.resultats.length ? 'Les phrases déjà vérifiées seront enregistrées.' : 'Rien ne sera enregistré.'}</p>
    <button class="btn-principal" id="continuer-d">Continuer</button>
    <button class="btn-second" id="arreter-d">Quitter</button></div>`;
  $('.jeu').appendChild(div);
  $('#continuer-d').onclick = () => div.remove();
  $('#arreter-d').onclick = () => finirDictee(true);
}

function finirDictee(abandon = false) {
  const d = dictee;
  d.fini = true;
  clearInterval(lancerDictee.t);
  const e = store.get();
  const faits = d.resultats.filter(Boolean);
  const tot = faits.map(compter).reduce((a, c) => { for (const k in c) a[k] = (a[k] || 0) + c[k]; return a; }, {});
  // Suivi des phrases de la banque : meilleure part de mots justes.
  if (d.texte.ids) d.resultats.forEach((res, k) => {
    if (!res) return;
    const c = compter(res), id = d.texte.ids[k], x = e.phrasesDictee[id] || { n: 0, best: 0 };
    e.phrasesDictee[id] = { n: x.n + 1, best: Math.max(x.best, c.mots ? c.justes / c.mots : 0), last: Date.now() };
  });
  const s = {
    id: 'd' + d.debut, mode: 'dictee', source: d.opts.source || 'texte', niveau: d.opts.niveau || null,
    texteId: d.texte.id, titre: d.texte.titre, url: d.texte.url || null, reglages: d.reglages,
    debut: d.debut, fin: Date.now(), joue: Date.now() - d.debut, complet: !abandon,
    phrases: faits.length, ecoutes: d.ecoutes.reduce((a, b) => a + b, 0),
    mots: tot.mots || 0, justes: tot.justes || 0, fautes: tot.fautes || 0, faux: tot.faux || 0, manques: tot.manques || 0, ajouts: tot.ajouts || 0,
    passees: 0, notes: {}, cartes: []
  };
  if (faits.length) { e.sessions.push(s); }
  store.sauver();
  bilanDictee = faits.length ? { s, d } : null;
  dictee = null;
  location.replace(faits.length ? '#/bilan-dictee' : '#/dictees');
}

function ecranBilanDictee() {
  dessinerNav('maison');
  const { s, d } = bilanDictee;
  vue.innerHTML = `${entete('Bilan de la dictée', d.texte.titre)}
  <main class="page">
    <section class="bloc bilan">
      <div class="gros"><b>${pourcent(s)}</b><span>de mots justes</span></div>
      <p class="sous">${s.justes}/${s.mots} mots · ${chrono(s.joue)} · ${pluriel(s.ecoutes, 'écoute')}</p>
      <p class="info centre">${s.niveau ? s.niveau + ' · ' : ''}${resumeReglages(s.reglages)}</p>
      <div class="legende-notes">
        <span><i class="d-i-faute"></i>Orthographe <b>${s.fautes}</b></span>
        <span><i class="d-i-faux"></i>Faux <b>${s.faux}</b></span>
        <span><i class="d-i-manque"></i>Oubliés <b>${s.manques}</b></span>
        <span><i class="d-i-ajout"></i>En trop <b>${s.ajouts}</b></span>
      </div>
    </section>
    <section class="bloc"><div class="bloc-titre"><h2>Correction</h2></div>
      ${d.resultats.map((r, i) => r ? `<div class="correction ligne"><div>${htmlComparaison(r)}</div>
        <button class="btn-mini clair" data-relire="${i}">${ICONES.son}</button></div>` : '').join('')}
      ${s.url ? `<a class="btn-second" href="${h(s.url)}" target="_blank" rel="noopener">Lire l'article sur Wikipédia ${ICONES.lien}</a><p class="info">Texte : Wikipédia, licence CC BY-SA.</p>` : ''}
    </section>
    <div class="boutons">
      <button class="btn-principal" id="refaire">${s.source === 'banque' ? 'Nouvelle dictée' : 'Recommencer'}</button>
      <a class="btn-second" href="#/dictees">Autres dictées</a>
    </div>
  </main>`;
  vue.querySelectorAll('[data-relire]').forEach(b => b.onclick = () => dire(d.texte.phrases[+b.dataset.relire], { nom: store.get().reglages.voix }));
  $('#refaire').onclick = () => {
    if (s.source === 'banque') {
      const e = store.get(), r = e.dictee;
      const choix = choisirPhrases(BANQUE, e.phrasesDictee, s.niveau, r.nb, Date.now());
      lancerDictee({ id: 'banque-' + s.niveau, titre: `Dictée ${s.niveau}`, phrases: choix.map(p => p.texte), ids: choix.map(p => p.id) }, { source: 'banque', niveau: s.niveau });
    } else lancerDictee(d.texte, d.opts);
  };
}

// ---------- Les temps ----------
const MODES_TEMPS = {
  placer: { nom: 'Placer sur la frise', desc: 'Une phrase : choisis le schéma qui montre quand se passe l\'action.' },
  conjuguer: { nom: 'Conjuguer', desc: 'Un schéma et une phrase à trous : écris le verbe au bon temps.' },
  grille: { nom: 'La grille des 12 temps', desc: 'Une phrase : touche la case de son temps.' }
};
const EPOQUES = { passe: 'Passé', present: 'Présent', futur: 'Futur' };
const ASPECTS = { simple: 'Simple', continu: 'Continu', parfait: 'Parfait', 'parfait continu': 'Parfait continu' };
const tempsDe = (id) => TEMPS.temps.find(t => t.id === id);

function ecranTemps() {
  dessinerNav('maison');
  const e = store.get();
  const recents = e.sessions.filter(s => s.mode === 'temps');
  const meilleur = (m) => {
    const x = recents.filter(s => s.exercice === m);
    return x.length ? Math.max(...x.map(s => Math.round(100 * s.justes / s.total))) : null;
  };
  vue.innerHTML = `${entete('Les temps', 'Voir le temps avant de le nommer', false, '#/')}
  <main class="page">
    ${Object.entries(MODES_TEMPS).map(([k, m]) => `<section class="bloc">
      <div class="bloc-titre"><h2>${m.nom}</h2><span>${m.desc}</span></div>
      ${meilleur(k) != null ? `<p class="info">Meilleur score : ${meilleur(k)} %</p>` : ''}
      <button class="btn-principal" data-exo="${k}">10 questions</button>
    </section>`).join('')}
    <section class="bloc"><div class="bloc-titre"><h2>Les 12 temps</h2><span>Touche un temps pour voir son schéma et sa règle.</span></div>
      <div class="grille-temps fiche-temps">${grilleTemps(null, true)}</div>
      <div id="detail-temps"></div>
    </section>
  </main>`;
  vue.querySelectorAll('[data-exo]').forEach(b => b.onclick = () => lancerTemps(b.dataset.exo));
  vue.querySelectorAll('.fiche-temps [data-t]').forEach(b => b.onclick = () => {
    vue.querySelectorAll('.fiche-temps [data-t]').forEach(x => x.classList.toggle('on', x === b));
    const t = tempsDe(b.dataset.t);
    $('#detail-temps').innerHTML = `<div class="detail-temps">${schema(t.id)}<h3>${h(t.nom)} <small>${h(t.fr)}</small></h3>
      <p><b>${h(t.forme)}</b></p><p>${h(t.regle)}</p>
      <p class="ex">${TEMPS.phrases.filter(p => p.t === t.id).slice(0, 2).map(p => h(phraseComplete(p.p))).join('<br>')}</p></div>`;
  });
}

// Grille 3 × 4 : époques en lignes, aspects en colonnes.
function grilleTemps(marques = null, avecNoms = false) {
  const cases = [];
  cases.push('<span></span>', ...Object.values(ASPECTS).map(a => `<span class="gt-col">${a}</span>`));
  for (const [ep, lib] of Object.entries(EPOQUES)) {
    cases.push(`<span class="gt-lig">${lib}</span>`);
    for (const asp of Object.keys(ASPECTS)) {
      const t = TEMPS.temps.find(x => x.epoque === ep && x.aspect === asp);
      const cl = marques ? (marques[t.id] || '') : '';
      cases.push(`<button class="gt-case ${cl}" data-t="${t.id}">${avecNoms || marques ? h(t.nom.replace(' (will)', '')) : ''}</button>`);
    }
  }
  return cases.join('');
}

function lancerTemps(mode) {
  const e = store.get();
  const dernieres = e.sessions.filter(s => s.mode === 'temps').slice(-3).flatMap(s => s.ratees || []);
  exo = { mode, questions: tirerQuestions(TEMPS.phrases, 10, dernieres), i: 0, reponses: [], debut: Date.now(), fini: false, saisie: '' };
  history.pushState(null, '', '#/exo-temps');
  router();
}

function ecranExoTemps() {
  nav.hidden = true;
  const x = exo, q = x.questions[x.i], t = tempsDe(q.t), rep = x.reponses[x.i];
  const { avant, verbe, apres } = decouper(q.p);
  let corps = '';
  if (x.mode === 'placer') {
    x.choix ||= {};
    const choix = x.choix[x.i] ||= distracteurs(TEMPS.temps, q.t);
    corps = `<p class="phrase-temps">${h(avant)}<mark>${h(verbe)}</mark>${h(apres)}</p>
      <p class="info centre">Quel schéma correspond au verbe surligné ?</p>
      <div class="choix-schemas">${choix.map(id => `<button class="choix-schema ${rep ? (id === q.t ? 'bon' : id === rep.donne ? 'faux' : 'eteint') : ''}" data-choix="${id}" ${rep ? 'disabled' : ''}>${schema(id)}</button>`).join('')}</div>`;
  } else if (x.mode === 'grille') {
    const marques = rep ? { [q.t]: 'bon', ...(rep.ok ? {} : { [rep.donne]: 'faux' }) } : null;
    corps = `<p class="phrase-temps">${h(avant)}<mark>${h(verbe)}</mark>${h(apres)}</p>
      <div class="grille-temps jeu-grille">${grilleTemps(marques, false)}</div>`;
  } else {
    corps = `<div class="schema-grand">${schema(q.t)}</div>
      <p class="phrase-temps">${h(avant)}${rep ? `<mark class="${rep.ok ? 'ok' : 'ko'}">${h(rep.ok ? rep.donne : verbe)}</mark>` : `<span class="trou">______</span>`}${h(apres)}</p>
      <p class="info centre">Verbe : <b>${h(q.base)}</b></p>
      ${rep ? (rep.ok ? '' : `<p class="info centre">Ta réponse : <s>${h(rep.donne)}</s></p>`) :
        `<input class="champ saisie-temps" id="saisie-temps" placeholder="ta réponse" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${h(x.saisie)}">`}`;
  }
  const retour = rep ? `<div class="retour-temps ${rep.ok ? 'ok' : 'ko'}">
      <b>${rep.ok ? 'Juste !' : 'Pas tout à fait.'}</b> ${h(t.nom)} <small>(${h(t.fr)})</small>
      <p><b>${h(t.forme)}</b> · ${h(t.regle)}</p>
      ${x.mode !== 'conjuguer' ? '' : ''}
    </div>` : '';
  vue.innerHTML = `<div class="jeu temps">
    <div class="jeu-tete">
      <button class="btn-rond" id="quitter-t" aria-label="Quitter">${ICONES.fermer}</button>
      <div class="jeu-chrono"><span>${MODES_TEMPS[x.mode].nom}</span><small>question ${x.i + 1} sur ${x.questions.length}</small></div>
      <div class="jeu-score"><b>${x.reponses.filter(r => r && r.ok).length}</b><small>justes</small></div>
      <div class="barre"><div style="width:${100 * (x.i + (rep ? 1 : 0)) / x.questions.length}%"></div></div>
    </div>
    <div class="dictee-corps">
      <div class="fiche dictee-fiche">${corps}${retour}</div>
      ${rep ? `<button class="btn-principal" id="suite-t">${x.i + 1 < x.questions.length ? 'Question suivante' : 'Voir le bilan'}</button>`
        : x.mode === 'conjuguer' ? '<button class="btn-principal" id="valider-t">Vérifier</button>' : ''}
    </div>
  </div>`;
  const repondre = (donne, ok) => { x.reponses[x.i] = { donne, ok }; ecranExoTemps(); };
  vue.querySelectorAll('[data-choix]').forEach(b => b.onclick = () => repondre(b.dataset.choix, b.dataset.choix === q.t));
  vue.querySelectorAll('.jeu-grille [data-t]').forEach(b => b.onclick = () => { if (!rep) repondre(b.dataset.t, b.dataset.t === q.t); });
  const champ = $('#saisie-temps');
  if (champ) {
    champ.oninput = () => { x.saisie = champ.value; };
    champ.onkeydown = (ev) => { if (ev.key === 'Enter') $('#valider-t').click(); };
  }
  const v = $('#valider-t');
  if (v) v.onclick = () => {
    if (!x.saisie.trim()) { toast('Écris d\'abord le verbe.'); return; }
    repondre(x.saisie.trim(), estJuste(x.saisie, verbe));
    x.saisie = '';
  };
  if (rep) $('.retour-temps')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const s = $('#suite-t');
  if (s) s.onclick = () => { if (x.i + 1 < x.questions.length) { x.i++; ecranExoTemps(); } else finirTemps(); };
  $('#quitter-t').onclick = () => {
    if ($('.voile-pause')) return;
    const div = document.createElement('div');
    div.className = 'voile-pause';
    div.innerHTML = `<div class="boite"><h2>Quitter l'exercice ?</h2><p>${x.reponses.filter(Boolean).length ? 'Les réponses déjà données seront enregistrées.' : 'Rien ne sera enregistré.'}</p>
      <button class="btn-principal" id="continuer-t">Continuer</button><button class="btn-second" id="arreter-t">Quitter</button></div>`;
    $('.jeu').appendChild(div);
    $('#continuer-t').onclick = () => div.remove();
    $('#arreter-t').onclick = () => finirTemps(true);
  };
}

function finirTemps(abandon = false) {
  const x = exo;
  x.fini = true;
  const faites = x.reponses.map((r, i) => r ? { q: x.questions[i], r } : null).filter(Boolean);
  const s = {
    id: 'te' + x.debut, mode: 'temps', exercice: x.mode, debut: x.debut, fin: Date.now(), joue: Date.now() - x.debut,
    complet: !abandon, total: faites.length, justes: faites.filter(f => f.r.ok).length,
    ratees: faites.filter(f => !f.r.ok).map(f => f.q.id), erreurs: faites.filter(f => !f.r.ok).map(f => f.q.t),
    passees: 0, notes: {}, cartes: []
  };
  const e = store.get();
  if (faites.length) e.sessions.push(s);
  store.sauver();
  bilanTemps = faites.length ? { s, faites } : null;
  exo = null;
  location.replace(faites.length ? '#/bilan-temps' : '#/temps');
}

function ecranBilanTemps() {
  dessinerNav('maison');
  const { s, faites } = bilanTemps;
  const ratees = faites.filter(f => !f.r.ok);
  vue.innerHTML = `${entete('Bilan', MODES_TEMPS[s.exercice].nom)}
  <main class="page">
    <section class="bloc bilan">
      <div class="gros"><b>${s.justes}/${s.total}</b><span>réponses justes</span></div>
      <p class="sous">en ${chrono(s.joue)}</p>
    </section>
    ${ratees.length ? `<section class="bloc"><div class="bloc-titre"><h2>À revoir</h2><span>Elles reviendront en priorité la prochaine fois.</span></div>
      ${ratees.map(f => { const t = tempsDe(f.q.t); const d = decouper(f.q.p); return `<div class="ligne-temps">
        <p>${h(d.avant)}<mark>${h(d.verbe)}</mark>${h(d.apres)}</p>
        <small>${h(t.nom)} · ${h(t.forme)}${s.exercice === 'conjuguer' ? ` · ta réponse : ${h(f.r.donne)}` : ` · tu as choisi : ${h(tempsDe(f.r.donne).nom)}`}</small>
      </div>`; }).join('')}</section>` : '<section class="bloc"><p class="info centre">Sans faute !</p></section>'}
    <div class="boutons">
      <button class="btn-principal" id="refaire-t">Encore 10 questions</button>
      <a class="btn-second" href="#/temps">Les temps</a>
    </div>
  </main>`;
  $('#refaire-t').onclick = () => lancerTemps(s.exercice);
}

function statsTemps(sessions) {
  const d = sessions.filter(s => s.mode === 'temps');
  if (!d.length) return '';
  const tot = d.reduce((n, s) => n + s.total, 0), j = d.reduce((n, s) => n + s.justes, 0);
  const err = {};
  for (const s of d) for (const t of s.erreurs || []) err[t] = (err[t] || 0) + 1;
  const pires = Object.entries(err).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<section class="bloc"><div class="bloc-titre"><h2>Les temps</h2></div>
    <div class="grille-chiffres">
      <div><b>${d.length}</b><span>séries</span></div>
      <div><b>${Math.round(100 * j / tot)} %</b><span>justes</span></div>
      <div><b>${duree(d.reduce((n, s) => n + s.joue, 0))}</b><span>temps</span></div>
    </div>
    ${pires.length ? `<p class="info">Ceux qui te résistent : ${pires.map(([t, n]) => `${h(tempsDe(t).nom)} (${n})`).join(', ')}</p>` : ''}
  </section>`;
}

// ---------- Decks ----------
const deckDe = (id) => DECKS.find(d => d.id === id);

function etatDecks() {
  const e = store.get();
  e.decks ||= {};
  e.decks.notation ||= '3';
  e.decks.ordre ||= 'fixe';
  e.decks.progres ||= {};
  e.decks.evals ||= {};
  return e.decks;
}

function barreDeck(ids, evals) {
  const r = repartition(ids, evals), t = ids.length || 1;
  return `<div class="barre-deck">${[[0, 'n4'], [1, 'n2'], [2, 'n1']].map(([g, c]) => r[g] ? `<i class="${c}" style="flex:${r[g] / t}"></i>` : '').join('')}${r.jamais ? `<i class="jamais" style="flex:${r.jamais / t}"></i>` : ''}</div>`;
}

function ecranDecks() {
  dessinerNav('maison');
  const D = etatDecks();
  const toutes = DECKS.flatMap(d => d.cartes);
  const dures = plusDures([...new Set(toutes)], D.evals);
  const puce = (cle, val, label) => `<button class="puce ${D[cle] === val ? 'on' : ''}" data-dr="${cle}" data-v="${val}">${label}</button>`;
  vue.innerHTML = `${entete('Decks', 'Un paquet fixe, toutes les cartes à la suite', false, '#/')}
  <main class="page">
    <section class="bloc">
      <div class="sous-titre">Après chaque carte</div>
      <div class="puces petites">${puce('notation', '3', 'Facile · Moyen · Dur')}${puce('notation', 'suivant', 'Suivant seulement')}</div>
      <div class="sous-titre">Ordre des cartes</div>
      <div class="puces petites">${puce('ordre', 'fixe', 'Toujours le même')}${puce('ordre', 'melange', 'Mélangé à chaque tour')}</div>
      <p class="info">La notation sert à repérer tes cartes dures pour les rabâcher. Pas de répétition espacée ici : tout le deck, dans l'ordre.</p>
    </section>
    <section class="bloc">
      <div class="bloc-titre"><h2>Les plus dures</h2><span>Tes cartes notées dures ou moyennes, tous decks confondus, la plus dure d'abord.</span></div>
      <button class="btn-principal" id="dures" ${dures.length ? '' : 'disabled'}>${dures.length ? `Rabâcher ${Math.min(dures.length, 40)} cartes` : 'Pas encore de carte notée dure'}</button>
    </section>
    ${DECKS.map(d => {
      const p = D.progres[d.id] || { pos: 0, tours: 0 };
      const duresDeck = plusDures(d.cartes, D.evals);
      return `<section class="bloc deck">
        <div class="deck-tete"><div class="bloc-titre"><h2>${h(d.titre)}</h2><span>${h(d.desc)}</span></div><em class="niveau">${h(d.niveau)}</em></div>
        ${barreDeck(d.cartes, D.evals)}
        <p class="info">${d.cartes.length} cartes${p.tours ? ` · ${pluriel(p.tours, 'tour')} terminé${p.tours > 1 ? 's' : ''}` : ''}${p.pos ? ` · en cours : ${p.pos}/${d.cartes.length}` : ''}${duresDeck.length ? ` · ${duresDeck.length} dure${duresDeck.length > 1 ? 's' : ''}` : ''}</p>
        <div class="boutons-ligne">
          <button class="btn-second fort" data-deck="${d.id}">${p.pos ? 'Continuer' : p.tours ? 'Nouveau tour' : 'Commencer'}</button>
          <button class="btn-second" data-deck-dures="${d.id}" ${duresDeck.length ? '' : 'disabled'}>Que les dures</button>
        </div>
      </section>`;
    }).join('')}
  </main>`;
  vue.querySelectorAll('[data-dr]').forEach(b => b.onclick = () => { D[b.dataset.dr] = b.dataset.v; store.sauver(); ecranDecks(); });
  vue.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => lancerDeck(deckDe(b.dataset.deck)));
  vue.querySelectorAll('[data-deck-dures]').forEach(b => b.onclick = () => {
    const d = deckDe(b.dataset.deckDures);
    lancerDeck({ id: d.id + ':dures', titre: `${d.titre} · les dures`, cartes: plusDures(d.cartes, D.evals), virtuel: true });
  });
  const bd = $('#dures');
  if (bd) bd.onclick = () => lancerDeck({ id: 'dures', titre: 'Les plus dures', cartes: plusDures([...new Set(toutes)], D.evals, 40), virtuel: true });
}

function lancerDeck(deck) {
  if (!deck.cartes.length) { toast('Aucune carte dans ce deck.'); return; }
  const D = etatDecks();
  const p = deck.virtuel ? { pos: 0, tours: 0 } : (D.progres[deck.id] ||= { pos: 0, tours: 0 });
  sessionDeck = {
    deck, ordre: ordreTour(deck.cartes, D.ordre, p.tours), pos: p.pos, tour: p.tours + 1,
    debut: Date.now(), depuis: Date.now(), retournee: false, surligne: null,
    notes: { 0: 0, 1: 0, 2: 0 }, cartes: [], fini: false
  };
  history.pushState(null, '', '#/deck');
  router();
}

function ecranDeck() {
  nav.hidden = true;
  const S = sessionDeck, D = etatDecks();
  const c = PAR_ID.get(S.ordre[S.pos]);
  if (!c) { finirDeck(true); return; }
  const total = S.ordre.length;
  const ev = D.evals[c.id];
  vue.innerHTML = `<div class="jeu deck-jeu">
    <div class="jeu-tete">
      <button class="btn-rond" id="quitter-deck" aria-label="Quitter">${ICONES.fermer}</button>
      <div class="jeu-chrono"><span>${S.pos + 1}/${total}</span><small>${h(S.deck.titre)}${S.deck.virtuel ? '' : ` · tour ${S.tour}`}</small></div>
      <div class="jeu-score"><b>${S.cartes.length}</b><small>passées</small></div>
      <div class="barre"><div style="width:${100 * S.pos / total}%"></div></div>
    </div>
    <div class="jeu-zone">
      <div class="fiche ${S.retournee ? 'verso' : 'recto'}" id="fiche">${htmlCarte(c, S)}
        ${S.retournee && ev ? `<div class="deja">Dernière note : ${NOTES_DECK[ev.g]} · ${pluriel(ev.n, 'passage')}</div>` : ''}</div>
    </div>
    <div class="jeu-bas">
      ${!S.retournee ? '<button class="btn-principal" id="retourner">Retourner</button>'
        : D.notation === 'suivant' ? '<button class="btn-principal" data-gd="-1">Suivant</button>'
        : `<div class="notes trois">${[[0, 'n4'], [1, 'n2'], [2, 'n1']].map(([g, cl]) => `<button class="${cl}" data-gd="${g}">${NOTES_DECK[g]}</button>`).join('')}</div>`}
    </div>
  </div>`;
  const fiche = $('#fiche');
  if (!S.retournee) {
    const tourner = () => { S.retournee = true; ecranDeck(); };
    fiche.onclick = tourner; $('#retourner').onclick = tourner;
  } else {
    brancherCarte(fiche, c, S, ecranDeck);
    vue.querySelectorAll('[data-gd]').forEach(b => b.onclick = () => passerCarteDeck(c.id, +b.dataset.gd));
  }
  $('#quitter-deck').onclick = () => finirDeck(true);
}

function passerCarteDeck(id, g) {
  const S = sessionDeck, D = etatDecks(), now = Date.now();
  if (g >= 0) { noterDeck(D.evals, id, g, now); S.notes[g]++; }
  S.cartes.push([id, g, now - S.depuis]);
  S.depuis = now;
  S.pos++;
  S.retournee = false; S.surligne = null;
  if (!S.deck.virtuel) D.progres[S.deck.id].pos = S.pos;
  store.sauver();
  if (S.pos >= S.ordre.length) finirDeck(false);
  else ecranDeck();
}

function finirDeck(enCours) {
  const S = sessionDeck, D = etatDecks(), e = store.get();
  S.fini = true;
  const tourFini = !enCours && S.pos >= S.ordre.length;
  if (tourFini && !S.deck.virtuel) { D.progres[S.deck.id] = { pos: 0, tours: (D.progres[S.deck.id].tours || 0) + 1 }; }
  const s = {
    id: 'k' + S.debut, mode: 'deck', deckId: S.deck.id, titre: S.deck.titre, debut: S.debut, fin: Date.now(), joue: Date.now() - S.debut,
    complet: tourFini, passees: S.cartes.length, notesDeck: { ...S.notes }, notes: {}, cartes: S.cartes, tour: S.tour
  };
  if (S.cartes.length) e.sessions.push(s);
  store.sauver();
  bilanDeck = S.cartes.length ? { s, S, tourFini } : null;
  sessionDeck = null;
  location.replace(bilanDeck ? '#/bilan-deck' : '#/decks');
}

function ecranBilanDeck() {
  dessinerNav('maison');
  const { s, S, tourFini } = bilanDeck, D = etatDecks();
  const vus = [...new Set(s.cartes.map(x => x[0]))];
  const dures = plusDures(vus, D.evals);
  const total = s.notesDeck[0] + s.notesDeck[1] + s.notesDeck[2] || 1;
  vue.innerHTML = `${entete(tourFini ? (S.deck.virtuel ? 'Série terminée' : `Tour ${S.tour} terminé`) : 'Pause dans le deck', S.deck.titre)}
  <main class="page">
    <section class="bloc bilan">
      <div class="gros"><b>${s.passees}</b><span>cartes</span></div>
      <p class="sous">en ${chrono(s.joue)}${!tourFini && !S.deck.virtuel ? ` · reprise à la carte ${S.pos + 1}/${S.ordre.length}` : ''}</p>
      ${D.notation === '3' || s.notesDeck[0] + s.notesDeck[1] + s.notesDeck[2] ? `<div class="barre-notes">${[[0, 'n4'], [1, 'n2'], [2, 'n1']].map(([g, c]) => s.notesDeck[g] ? `<div class="${c}" style="flex:${s.notesDeck[g] / total}"></div>` : '').join('')}</div>
      <div class="legende-notes">${[[0, 'n4'], [1, 'n2'], [2, 'n1']].map(([g, c]) => `<span><i class="${c}"></i>${NOTES_DECK[g]} <b>${s.notesDeck[g]}</b></span>`).join('')}</div>` : ''}
    </section>
    ${dures.length ? `<section class="bloc"><div class="bloc-titre"><h2>Les dures de cette série</h2><span>Moyenne récente de tes notes</span></div>
      ${dures.map(id => ligneCarte(PAR_ID.get(id), D.evals[id].m >= 1.5 ? 'dure' : 'moyenne')).join('')}</section>` : ''}
    <div class="boutons">
      ${dures.length ? '<button class="btn-principal" id="rabacher">Rabâcher les dures</button>' : ''}
      ${!S.deck.virtuel ? `<button class="${dures.length ? 'btn-second' : 'btn-principal'}" id="encore">${tourFini ? 'Tour suivant' : 'Reprendre'}</button>` : ''}
      <a class="btn-second" href="#/decks">Decks</a>
    </div>
  </main>`;
  const r = $('#rabacher');
  if (r) r.onclick = () => lancerDeck({ id: S.deck.id + ':dures', titre: `${S.deck.titre.replace(/ · les dures$/, '')} · les dures`, cartes: dures, virtuel: true });
  const en = $('#encore');
  if (en) en.onclick = () => lancerDeck(deckDe(S.deck.id));
}

// ---------- Sprint par paquets ----------
const DUREES_P = [300, 600, 900, 1200, 0];
const libDuree = (d) => d ? `${d / 60} min` : 'Libre';
const paquetDe = (id) => PAQUETS.find(p => p.id === id);

function etatPaquets() {
  const e = store.get();
  e.paquets ||= {};
  e.paquets.reglages ||= { duree: 600, hasard: false, recto: 'texte' };
  e.paquets.stats ||= {};
  return e.paquets;
}
const partiesDe = (pid, duree) => store.get().sessions.filter(s => s.mode === 'paquet' && s.paquetId === pid && (duree === undefined || s.duree === duree));

function libRecord(r, total) {
  if (!r) return '';
  return r.complet ? `${total}/${total} en ${chrono(r.joue)}` : `${r.ok}/${total}`;
}

// Carte de paquet → objet attendu par le panneau Sens (liens selon le type).
function versCarte(pc, paquet) {
  const type = paquet.genre === 'cartes' ? ({ mot: 'mot', expr: 'combi', phrasal: 'phrasal', phrase: 'phrase' }[pc.cat] || 'mot')
    : paquet.genre === 'paires' ? 'phrase' : 'phrasal';
  return { texte: pc.texte, def: pc.aide, ex: pc.ex, note: pc.note, type, lemme: pc.lemme };
}

function ecranAccueil() {
  dessinerNav('maison');
  const P = etatPaquets(), r = P.reglages;
  const puce = (cle, val, label) => `<button class="puce ${r[cle] === val ? 'on' : ''}" data-pr="${cle}" data-v="${val}">${label}</button>`;
  const groupes = [...new Set(PAQUETS.map(p => p.groupe))];
  const ligne = (p) => {
    const rec = meilleurePartie(partiesDe(p.id, r.duree));
    const vues = p.cartes.filter(c => P.stats[c.id]).length;
    const reussies = p.cartes.filter(c => P.stats[c.id] && P.stats[c.id].dernier === 1).length;
    return `<div class="ligne-paquet">
      <button class="lp-main" data-infos="${p.id}">
        <b>${h(p.titre)}</b><small>${h(p.accroche)}</small>
        <span class="lp-meta">${p.cartes.length} cartes${vues ? ` · ${reussies} réussies la dernière fois` : ''}${rec ? ` · record ${libDuree(r.duree)} : <b>${libRecord(rec, p.cartes.length)}</b>` : ''}</span>
        <div class="barre-deck">${reussies ? `<i class="n4" style="flex:${reussies}"></i>` : ''}${vues - reussies ? `<i class="n1" style="flex:${vues - reussies}"></i>` : ''}${p.cartes.length - vues ? `<i class="jamais" style="flex:${p.cartes.length - vues}"></i>` : ''}</div>
      </button>
      <button class="lp-jouer" data-jouer="${p.id}" aria-label="Jouer">${ICONES.jouer}</button>
    </div>`;
  };
  vue.innerHTML = `${entete('English', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), true)}
  <main class="page">
    ${rappelSauvegarde()}
    <section class="bloc sprint">
      <div class="bloc-titre"><h2>Sprint</h2><span>Un paquet, un chrono : réussir toutes les cartes. Raté → la carte revient au tour suivant.</span></div>
      <div class="puces">${DUREES_P.map(d => puce('duree', d, libDuree(d))).join('')}</div>
      <div class="puces petites">${puce('hasard', false, 'Dans l\'ordre')}${puce('hasard', true, 'Au hasard')}</div>
      <div class="puces petites">${puce('recto', 'texte', 'Recto : le texte')}${puce('recto', 'audio', 'Recto : l\'audio')}</div>
    </section>
    ${groupes.map(g => `<section class="bloc liste"><div class="bloc-titre"><h2>${h(g)}</h2>${g !== 'Vocabulaire et phrases' ? '<span>À l\'essai</span>' : ''}</div>
      ${PAQUETS.filter(p => p.groupe === g).map(ligne).join('')}</section>`).join('')}
    <details class="bloc autres">
      <summary><b>Autres outils</b><span>Sprint classique, decks, dictées, exercices des temps, mode libre</span></summary>
      <div class="autres-liens">
        <a class="btn-second" href="#/classique">Sprint classique et mode libre</a>
        <a class="btn-second" href="#/decks">Decks</a>
        <a class="btn-second" href="#/dictees">Dictées</a>
        <a class="btn-second" href="#/temps">Exercices des temps</a>
      </div>
    </details>
  </main>`;
  vue.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => {
    const k = b.dataset.pr, v = b.dataset.v;
    r[k] = k === 'duree' ? +v : k === 'hasard' ? v === 'true' : v;
    store.sauver(); ecranAccueil();
  });
  vue.querySelectorAll('[data-jouer]').forEach(b => b.onclick = () => lancerPaquet(b.dataset.jouer));
  vue.querySelectorAll('[data-infos]').forEach(b => b.onclick = () => feuillePaquet(paquetDe(b.dataset.infos)));
  brancherRappel();
}

function statsPaquets() {
  const P = etatPaquets();
  const lignes = PAQUETS.map(p => {
    const parties = partiesDe(p.id);
    if (!parties.length) return '';
    const rec = DUREES_P.map(d => [d, meilleurePartie(partiesDe(p.id, d))]).filter(([, x]) => x).map(([d, x]) => `${libDuree(d)} : ${libRecord(x, p.cartes.length)}`).join(' · ');
    const jouees = p.cartes.filter(c => P.stats[c.id]);
    const okT = jouees.reduce((n, c) => n + P.stats[c.id].ok, 0), raT = jouees.reduce((n, c) => n + P.stats[c.id].rate, 0);
    return `<div class="ligne-histo"><div><b>${h(p.titre)}</b><small>${pluriel(parties.length, 'partie')} · ${rec}</small></div>
      <div class="histo-droite"><strong>${okT + raT ? Math.round(100 * okT / (okT + raT)) : 0} %</strong><small>réussite</small></div></div>`;
  }).join('');
  return lignes ? `<section class="bloc"><div class="bloc-titre"><h2>Sprint par paquets</h2><span>Records par durée, taux de réussite de toutes tes réponses</span></div>${lignes}</section>` : '';
}

function feuillePaquet(p) {
  const P = etatPaquets(), r = P.reglages;
  const parties = partiesDe(p.id).slice(-8).reverse();
  const ratees = plusRatees(p.cartes.map(c => c.id), P.stats, 8);
  const parId = new Map(p.cartes.map(c => [c.id, c]));
  const records = DUREES_P.map(d => [d, meilleurePartie(partiesDe(p.id, d))]).filter(([, x]) => x);
  ouvrirFeuille(`<div class="sens">
    <h2>${h(p.titre)}</h2><p class="info">${h(p.accroche)} ${p.cartes.length} cartes.</p>
    ${records.length ? `<h3 class="sous-titre">Records</h3>${records.map(([d, x]) => `<div class="ligne-record"><div>${libDuree(d)}<small>le ${dateCourte(x.debut)}</small></div><strong>${libRecord(x, p.cartes.length)}</strong></div>`).join('')}` : '<p class="info">Pas encore de partie.</p>'}
    ${parties.length ? `<h3 class="sous-titre">Dernières parties</h3>${parties.map(s => `<div class="ligne-histo"><div>${libDuree(s.duree)}${s.hasard ? ' · hasard' : ''}${s.recto === 'audio' ? ' · audio' : ''}<small>${dateHeure(s.debut)} · ${s.tours} tour${s.tours > 1 ? 's' : ''} · ${s.rates} raté${s.rates > 1 ? 's' : ''}</small></div><div class="histo-droite"><strong>${s.complet ? '✓ ' + chrono(s.joue) : `${s.ok}/${s.total}`}</strong></div></div>`).join('')}` : ''}
    ${ratees.length ? `<h3 class="sous-titre">Les plus ratées</h3>${ratees.map(id => { const x = P.stats[id]; return `<div class="ligne-histo"><div>${h(parId.get(id).recto ? parId.get(id).texte : parId.get(id).texte)}</div><div class="histo-droite"><span class="pts"><i class="n4">${x.ok}</i><i class="n1">${x.rate}</i></span></div></div>`; }).join('')}` : ''}
    <button class="btn-principal" id="jouer-feuille">${ICONES.jouer} Jouer · ${libDuree(r.duree)}</button>
  </div>`);
  $('#jouer-feuille').onclick = () => { fermerFeuille(); lancerPaquet(p.id); };
}

function lancerPaquet(pid) {
  const p = paquetDe(pid);
  if (!p) return;
  const P = etatPaquets(), r = P.reglages;
  P.dernier = pid;
  const boucle = creerBoucle(p.cartes.map(c => c.id), r.hasard);
  sprintP = {
    paquet: p, parId: new Map(p.cartes.map(c => [c.id, c])), boucle, duree: r.duree, hasard: r.hasard,
    recto: p.genre === 'cartes' ? r.recto : 'texte',
    debut: Date.now(), joueMs: 0, top: Date.now(), pause: false, pauses: 0, fini: false,
    courante: null, depuis: 0, retournee: false, rates: 0, cartes: [], rateesPartie: new Set()
  };
  sprintP.courante = boucle.suivante();
  sprintP.depuis = 0;
  store.sauver();
  history.pushState(null, '', '#/paquet');
  router();
  bouclePaquet();
}

const tempsJoueP = () => sprintP.joueMs + (sprintP.pause ? 0 : Date.now() - sprintP.top);

function bouclePaquet() {
  clearInterval(bouclePaquet.t);
  bouclePaquet.t = setInterval(() => {
    const S = sprintP;
    if (!S || S.fini) { clearInterval(bouclePaquet.t); return; }
    const t = tempsJoueP(), el = $('#chrono');
    if (S.duree) {
      const reste = S.duree * 1000 - t;
      if (el) { el.textContent = chrono(reste); el.classList.toggle('urgent', reste < 30000); }
      if (reste <= 0) finirPaquet();
    } else if (el) el.textContent = chrono(t);
  }, 200);
}

function pausePaquet(oui) {
  const S = sprintP;
  if (!S || S.fini || S.pause === oui) return;
  if (oui) { S.joueMs += Date.now() - S.top; S.pause = true; S.pauses++; }
  else { S.top = Date.now(); S.pause = false; }
  ecranPaquet();
}

function htmlRectoVerso(pc, S) {
  const p = S.paquet, reg = store.get().reglages;
  const leg = (ipa) => { const l = legende(ipa, LANGUE.symboles, reg.legendeComplete); return l.length ? `<button class="legende" data-legende>${l.map(x => `<span><b>${ipaHtml(x.s)}</b>${h(x.ex)}</span>`).join('')}</button>` : ''; };
  const actions = `<div class="fiche-actions"><button data-dire="1">${ICONES.son}<span>Écouter</span></button><button data-dire="lent">${ICONES.lent}<span>Lent</span></button><button data-sens>${ICONES.sens}<span>Sens</span></button></div>`;
  if (p.genre === 'paires') {
    const ligneP = (k) => {
      const t = TEMPS.temps.find(x => x.id === pc['t' + k]);
      const cl = S.retournee ? (pc.rep === k ? 'bonne' : 'autre') : '';
      return `<div class="paire ${cl}"><div class="paire-tete"><b>${k.toUpperCase()}</b><span>${h(pc[k])}</span><button class="btn-rond petit" data-dire-texte="${h(pc[k])}">${ICONES.son}</button></div>
        ${S.retournee ? `<div class="paire-schema">${schema(pc['t' + k])}<small>${h(t.nom)}</small></div>` : ''}</div>`;
    };
    return `<div class="fiche-type">Temps</div><p class="question-paire">${h(pc.question)}</p>${ligneP('a')}${ligneP('b')}
      ${S.retournee ? `<p class="reponse-paire">Réponse : <b>${pc.rep.toUpperCase()}</b></p><div class="regle">${h(pc.aide)}</div>` : '<div class="fiche-indice">Choisis A ou B dans ta tête, puis retourne</div>'}`;
  }
  if (p.genre === 'soutenu') {
    const recto = h(pc.recto).replace(/\[([^\]]+)\]/, '<mark>$1</mark>');
    if (!S.retournee) return `<div class="fiche-type">Phrasal verb</div><div class="consigne">Redis-le avec un phrasal verb</div><div class="fiche-texte long">${recto}</div><div class="fiche-indice">Dis ta version à voix haute, puis retourne</div>`;
    return `<div class="fiche-type">Phrasal verb</div><div class="rappel-recto">${recto}</div><div class="fiche-texte long">${h(pc.texte)}</div>
      <div class="fiche-ipa${pc.ipa.length > 24 ? ' long' : ''}">/${ipaHtml(pc.ipa)}/</div>${actions}<div class="regle">${h(pc.aide)}</div>${leg(pc.ipa)}`;
  }
  if (p.genre === 'particules') {
    if (!S.retournee) return `<div class="fiche-type">Particule</div><div class="fiche-texte long">${h(pc.recto).replace('___', '<span class="trou-p">___</span>')}</div><div class="fiche-indice">Dis la phrase complète, puis retourne</div>`;
    return `<div class="fiche-type">Particule</div><div class="fiche-texte long">${h(pc.recto).replace('___', `<mark>${h(pc.particule)}</mark>`)}</div>
      <div class="fiche-ipa${pc.ipa.length > 24 ? ' long' : ''}">/${ipaHtml(pc.ipa)}/</div>${actions}<div class="regle">${h(pc.aide)}</div>${leg(pc.ipa)}`;
  }
  // Cartes de vocabulaire et de phrases
  const long = pc.cat === 'phrase' || pc.texte.length > 22 ? ' long' : '';
  if (!S.retournee) {
    if (S.recto === 'audio') return `<div class="fiche-type">Écoute</div><button class="btn-ecoute" data-dire="1">${ICONES.son}</button><div class="fiche-indice">Écoute, répète, puis retourne<br><button class="lien-lent" data-dire="lent">écouter lentement</button></div>`;
    return `<div class="fiche-texte${long}">${h(pc.texte)}</div><div class="fiche-indice">Prononce, puis retourne</div>`;
  }
  return `<div class="fiche-texte${long}">${h(pc.texte)}</div><div class="fiche-ipa${pc.ipa.length > 24 ? ' long' : ''}">/${ipaHtml(pc.ipa)}/</div>${actions}
    ${pc.note ? `<div class="note-carte">${h(pc.note)}</div>` : ''}${leg(pc.ipa)}`;
}

function ecranPaquet() {
  nav.hidden = true;
  const S = sprintP;
  if (!S) return router();
  const pc = S.parId.get(S.courante);
  const total = S.paquet.cartes.length, t = tempsJoueP();
  vue.innerHTML = `<div class="jeu">
    <div class="jeu-tete">
      <button class="btn-rond" id="btn-pause" aria-label="Pause">${ICONES.pause}</button>
      <div class="jeu-chrono"><span id="chrono">${chrono(S.duree ? S.duree * 1000 - t : t)}</span><small>${h(S.paquet.titre)} · tour ${S.boucle.tour}</small></div>
      <div class="jeu-score"><b>${S.boucle.reussies}/${total}</b><small>OK</small></div>
      <div class="barre"><div style="width:${100 * S.boucle.reussies / total}%"></div></div>
    </div>
    <div class="jeu-zone">
      <div class="fiche ${S.retournee ? 'verso' : 'recto'}" id="fiche">${pc ? htmlRectoVerso(pc, S) : ''}
        ${S.retournee && S.rateesPartie.has(pc.id) ? '<div class="deja">Ratée plus tôt dans cette partie</div>' : ''}</div>
    </div>
    <div class="jeu-bas">
      ${S.retournee ? `<div class="notes deux"><button class="n1" data-ok="0">Raté</button><button class="n4" data-ok="1">OK</button></div>`
        : '<button class="btn-principal" id="retourner">Retourner</button>'}
    </div>
    ${S.pause ? `<div class="voile-pause"><div class="boite"><h2>Pause</h2><p>Le chrono est arrêté.</p>
      <button class="btn-principal" id="reprendre">Reprendre</button><button class="btn-second" id="terminer">Terminer la partie</button></div></div>` : ''}
  </div>`;
  $('#btn-pause').onclick = () => pausePaquet(true);
  if (S.pause) { $('#reprendre').onclick = () => pausePaquet(false); $('#terminer').onclick = () => finirPaquet(); }
  const fiche = $('#fiche');
  const r = store.get().reglages;
  fiche.querySelectorAll('[data-dire]').forEach(b => b.onclick = (ev) => {
    ev.stopPropagation();
    if (!dire(pc.texte, { vitesse: b.dataset.dire === 'lent' ? r.vitesseLente : 1, nom: r.voix })) toast('Synthèse vocale indisponible sur ce navigateur.');
  });
  fiche.querySelectorAll('[data-dire-texte]').forEach(b => b.onclick = (ev) => { ev.stopPropagation(); dire(b.dataset.direTexte, { nom: r.voix }); });
  const sens = fiche.querySelector('[data-sens]');
  if (sens) sens.onclick = (ev) => { ev.stopPropagation(); feuilleSens(versCarte(pc, S.paquet)); };
  const lg = fiche.querySelector('[data-legende]');
  if (lg) lg.onclick = (ev) => { ev.stopPropagation(); feuilleLegende(); };
  if (!S.retournee) {
    const tourner = () => { S.retournee = true; ecranPaquet(); };
    fiche.onclick = tourner; $('#retourner').onclick = tourner;
  } else vue.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => repondrePaquet(b.dataset.ok === '1'));
}

function repondrePaquet(ok) {
  const S = sprintP, P = etatPaquets(), now = Date.now();
  const t = tempsJoueP();
  noterCarteP(P.stats, S.courante, ok, now);
  S.cartes.push([S.courante, ok ? 1 : 0, Math.round(t - S.depuis)]);
  if (ok) S.boucle.ok(S.courante); else { S.rates++; S.rateesPartie.add(S.courante); }
  store.sauver();
  S.courante = S.boucle.suivante();
  S.depuis = t;
  S.retournee = false;
  if (!S.courante) { finirPaquet(); return; }
  ecranPaquet();
}

function finirPaquet() {
  const S = sprintP;
  if (!S || S.fini) return;
  if (!S.pause) { S.joueMs += Date.now() - S.top; S.pause = true; }
  S.fini = true;
  clearInterval(bouclePaquet.t);
  const e = store.get(), total = S.paquet.cartes.length, complet = S.boucle.reussies === total;
  const s = {
    id: 'q' + S.debut, mode: 'paquet', paquetId: S.paquet.id, titre: S.paquet.titre, duree: S.duree, hasard: S.hasard, recto: S.recto,
    debut: S.debut, fin: Date.now(), joue: Math.min(Math.round(S.joueMs), S.duree ? S.duree * 1000 : Infinity),
    complet, ok: S.boucle.reussies, total, rates: S.rates, tours: S.boucle.tour, pauses: S.pauses,
    passees: S.cartes.length, notes: {}, cartes: S.cartes
  };
  const avant = meilleurePartie(partiesDe(S.paquet.id, S.duree));
  if (s.cartes.length) e.sessions.push(s);
  store.sauver();
  bilanP = s.cartes.length ? { s, avant, record: bat(s, avant), S } : null;
  sprintP = null;
  location.replace(bilanP ? '#/bilan-paquet' : '#/');
}

function ecranBilanPaquet() {
  dessinerNav('maison');
  const { s, avant, record, S } = bilanP;
  const ratees = [...S.rateesPartie];
  vue.innerHTML = `${entete(s.complet ? 'Paquet réussi !' : 'Temps écoulé', `${s.titre} · ${libDuree(s.duree)}${s.hasard ? ' · hasard' : ''}`)}
  <main class="page">
    <section class="bloc bilan">
      ${record && (avant || s.complet) ? '<div class="badge-record">Nouveau record !</div>' : ''}
      <div class="gros"><b>${s.ok}/${s.total}</b><span>cartes réussies</span></div>
      <p class="sous">${s.complet ? `en ${chrono(s.joue)}` : `en ${chrono(s.joue)} · il en restait ${s.total - s.ok}`}</p>
      <p class="info centre">${pluriel(s.rates, 'raté')} · ${pluriel(s.tours, 'tour')}${s.pauses ? ` · ${pluriel(s.pauses, 'pause')}` : ''}</p>
      ${avant && !record ? `<p class="info centre">Record : ${libRecord(avant, s.total)}</p>` : ''}
    </section>
    ${ratees.length ? `<section class="bloc liste"><div class="bloc-titre"><h2>Ratées pendant la partie</h2><span>Touche une carte pour revoir son sens et ses liens.</span></div>
      ${ratees.map(id => { const pc = S.parId.get(id); return `<button class="ligne-carte" data-revoir="${id}"><div><b>${h(pc.texte)}</b>${pc.ipa ? `<span class="ipa-mini">/${ipaHtml(pc.ipa)}/</span>` : ''}</div></button>`; }).join('')}</section>` : ''}
    <div class="boutons">
      <button class="btn-principal" id="rejouer-p">${ICONES.jouer} Rejouer</button>
      <a class="btn-second" href="#/">Accueil</a>
    </div>
  </main>`;
  vue.querySelectorAll('[data-revoir]').forEach(b => b.onclick = () => feuilleSens(versCarte(S.parId.get(b.dataset.revoir), S.paquet)));
  $('#rejouer-p').onclick = () => lancerPaquet(s.paquetId);
}

demarrer().catch(err => {
  vue.innerHTML = `<main class="page"><p class="info">Erreur de chargement : ${h(err.message)}</p></main>`;
});
