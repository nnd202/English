// État local de l'appli (navigateur du téléphone) : progression des cartes,
// parties jouées, réglages. Les fonctions de calcul sont pures et testées
// par tools/check.mjs ; seules charger/sauver touchent au stockage.
import { noter } from './fsrs.js';

const CLE = 'english:v1';

export const REGLAGES_DEFAUT = {
  partNouvelles: 0.6,       // Brassage : part des cartes jamais vues dans une partie
  nouvellesMax: 0,          // plafond de nouvelles cartes par jour (0 = aucun)
  poidsDifficulte: 0.6,     // 0 = hasard uniforme, 1 = les cartes dures sortent beaucoup plus
  vitesseLente: 0.7,        // vitesse du bouton « lent »
  voix: '',                 // nom de la voix choisie (vide = meilleure voix en-US trouvée)
  legendeComplete: false,   // afficher aussi les symboles évidents (p, b, t…)
  pastilles: true,          // afficher les pastilles
  rappelJours: 7            // rappel de sauvegarde (0 = jamais)
};

export const TYPES = ['mot', 'combi', 'phrasal', 'phrase'];

export const DICTEE_DEFAUT = {
  niveau: 'B2',       // B1, B2, C1, C2
  nb: 6,              // phrases par dictée
  vitesse: 'normale', // lente, normale, rapide
  ecoutes: 0,         // écoutes par phrase : 0 = illimitées
  aideMots: false,    // afficher le nombre de mots
  aideMorceaux: false // écouter la phrase par morceaux
};

export function etatVide() {
  return {
    v: 1,
    cartes: {},
    sessions: [],
    reglages: { ...REGLAGES_DEFAUT },
    sprint: { duree: 900, tirage: 'melange', types: [...TYPES] },
    derniereSauvegarde: null,
    enCours: null,
    textes: [],               // textes de dictée collés (restent sur l'appareil)
    dictee: { ...DICTEE_DEFAUT },
    phrasesDictee: {}         // suivi des phrases de la banque : { id: { n, best, last } }
  };
}

export function jourCle(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let etat = null;

export function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    etat = brut ? JSON.parse(brut) : etatVide();
  } catch { etat = etatVide(); }
  const vide = etatVide();
  etat.reglages = { ...vide.reglages, ...(etat.reglages || {}) };
  etat.sprint = { ...vide.sprint, ...(etat.sprint || {}) };
  etat.cartes ||= {};
  etat.sessions ||= [];
  etat.textes ||= [];
  etat.phrasesDictee ||= {};
  etat.dictee = { ...DICTEE_DEFAUT, ...(etat.dictee || {}) };
  // Partie interrompue (appli fermée en pleine partie) : enregistrée telle quelle, hors records.
  if (etat.enCours) {
    const s = etat.enCours;
    if (s.cartes && s.cartes.length) etat.sessions.push({ ...s, fin: s.fin || s.derniere || s.debut, complet: false, interrompue: true });
    etat.enCours = null;
    sauver();
  }
  return etat;
}

export function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { console.warn('Sauvegarde locale impossible', e); }
}

export const get = () => etat;

// Note une carte : met à jour FSRS, le temps passé et la date d'introduction.
export function noterCarte(id, g, ms, maintenant = Date.now()) {
  const avant = etat.cartes[id] || {};
  const e = noter(avant, g, maintenant);
  e.t = (avant.t || 0) + ms;
  e.g = g;
  e.intro = avant.intro || maintenant;
  if (avant.ej) e.ej = avant.ej;
  etat.cartes[id] = e;
  sauver();
  return e;
}

export function ejecter(id, oui = true, maintenant = Date.now()) {
  const e = { ...(etat.cartes[id] || {}) };
  if (oui) e.ej = maintenant; else delete e.ej;
  etat.cartes[id] = e;
  sauver();
}

export function introduitesLe(cartes, jour) {
  return Object.values(cartes).filter(e => e.intro && jourCle(e.intro) === jour).length;
}

// Série de jours : un jour compte s'il contient au moins une carte notée, une dictée ou un exercice des temps.
export function series(sessions, aujourdhui = jourCle(Date.now())) {
  const jours = new Set(sessions.filter(s => (s.cartes && s.cartes.length) || s.mode === 'dictee' || s.mode === 'temps').map(s => jourCle(s.debut)));
  const tries = [...jours].sort();
  let record = 0, courant = 0, prec = null;
  for (const j of tries) {
    courant = prec && diffJours(prec, j) === 1 ? courant + 1 : 1;
    record = Math.max(record, courant);
    prec = j;
  }
  // Série en cours : vivante si aujourd'hui ou hier a été joué.
  let enCours = 0;
  if (prec && diffJours(prec, aujourdhui) <= 1) {
    enCours = 1;
    for (let i = tries.length - 1; i > 0; i--) { if (diffJours(tries[i - 1], tries[i]) === 1) enCours++; else break; }
  }
  return { enCours, record };
}
function diffJours(a, b) {
  const [ya, ma, da] = a.split('-').map(Number), [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export const cleRecord = (s) => `${s.duree}|${s.tirage}`;

// Meilleure partie complète pour chaque couple durée + tirage.
export function records(sessions) {
  const out = {};
  for (const s of sessions) {
    if (s.mode !== 'sprint' || !s.complet) continue;
    const k = cleRecord(s);
    if (!out[k] || s.passees > out[k].passees) out[k] = s;
  }
  return out;
}

// Fusion de deux états (import d'une sauvegarde) : rien n'est perdu.
// Cartes : on garde l'état révisé le plus récemment. Parties : union par identifiant.
export function fusionner(a, b) {
  const out = { ...a, cartes: { ...a.cartes }, sessions: [...a.sessions] };
  for (const [id, e] of Object.entries(b.cartes || {})) {
    const x = out.cartes[id];
    if (!x || (e.last || 0) > (x.last || 0)) out.cartes[id] = { ...e, ej: e.ej || (x && x.ej) };
    else if (e.ej && !x.ej) out.cartes[id] = { ...x, ej: e.ej };
  }
  const ids = new Set(out.sessions.map(s => s.id));
  for (const s of b.sessions || []) if (!ids.has(s.id)) out.sessions.push(s);
  out.sessions.sort((x, y) => x.debut - y.debut);
  const tids = new Set((a.textes || []).map(t => t.id));
  out.textes = [...(a.textes || []), ...(b.textes || []).filter(t => !tids.has(t.id))];
  out.phrasesDictee = { ...(a.phrasesDictee || {}) };
  for (const [id, x] of Object.entries(b.phrasesDictee || {})) {
    const y = out.phrasesDictee[id];
    if (!y || (x.last || 0) > (y.last || 0)) out.phrasesDictee[id] = { ...x, best: Math.max(x.best, y ? y.best : 0) };
  }
  return out;
}

export function remplacer(nouvel) { etat = nouvel; sauver(); }
