// FSRS-4.5 (Free Spaced Repetition Scheduler), paramètres par défaut.
// Module pur. Notes : 1 Raté, 2 Difficile, 3 Bien, 4 Facile.
// Une révision « trop tôt » (mode Hasard, retour dans la même partie) est
// gérée naturellement : la rétention est proche de 1, donc la stabilité
// bouge peu. Toutes les réponses nourrissent donc le modèle, quel que soit le mode.

export const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031,
  1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81;
export const RETENTION = 0.9;
export const JOUR = 86400000;

const borne = (d) => Math.min(10, Math.max(1, d));

export function retention(jours, S) {
  return Math.pow(1 + FACTOR * Math.max(0, jours) / S, DECAY);
}

function d0(g) { return borne(W[4] - (g - 3) * W[5]); }
function dSuivante(D, g) {
  const d = D - W[6] * (g - 3);
  return borne(W[7] * d0(4) + (1 - W[7]) * d);
}
function sReussite(D, S, R, g) {
  const dur = g === 2 ? W[15] : 1, facile = g === 4 ? W[16] : 1;
  return S * (Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) * dur * facile + 1);
}
function sEchec(D, S, R) {
  return Math.min(S, W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)));
}

// Intervalle (jours) pour atteindre la rétention visée. À 90 %, intervalle = S.
export function intervalle(S) {
  return S / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1);
}

// Applique une note à l'état d'une carte. Retourne un nouvel état.
// etat : { s, d, last, due, n, l } (s stabilité en jours, d difficulté 1-10).
export function noter(etat, g, maintenant) {
  const e = { ...etat };
  if (!e.s) {
    e.s = W[g - 1];
    e.d = d0(g);
  } else {
    const R = retention((maintenant - e.last) / JOUR, e.s);
    const D = e.d;
    e.s = g === 1 ? sEchec(D, e.s, R) : sReussite(D, e.s, R, g);
    e.d = dSuivante(D, g);
    if (g === 1) e.l = (e.l || 0) + 1;
  }
  e.s = Math.max(0.01, e.s);
  e.last = maintenant;
  e.due = maintenant + Math.max(10 * 60000, intervalle(e.s) * JOUR);
  e.n = (e.n || 0) + 1;
  return e;
}

// Probabilité actuelle de se souvenir (1 pour une carte jamais vue).
export function retenu(etat, maintenant) {
  if (!etat || !etat.s) return 1;
  return retention((maintenant - etat.last) / JOUR, etat.s);
}
