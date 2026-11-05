// Decks : paquets fixes parcourus dans l'ordre, sans FSRS. Module pur.
// Chaque carte notée reçoit une « moyenne récente » de difficulté (0 = facile, 1 = moyen, 2 = dur) :
// moyenne mobile qui suit la progression (une carte dure redevenue facile redescend).

export const NOTES_DECK = { 0: 'Facile', 1: 'Moyen', 2: 'Dur' };

export function noterDeck(evals, id, g, maintenant) {
  const x = evals[id];
  const m = x && x.n ? x.m * 0.6 + g * 0.4 : g;
  evals[id] = { n: (x ? x.n : 0) + 1, m, g, last: maintenant };
  return evals[id];
}

// Ordre d'un tour : fixe, ou mélangé différemment à chaque tour (mais stable pendant le tour).
export function ordreTour(ids, ordre, tour) {
  if (ordre !== 'melange') return [...ids];
  const a = [...ids];
  let s = (tour + 1) * 2654435761 % 4294967296;
  const alea = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Les cartes les plus dures parmi des identifiants : notées, moyenne ≥ seuil, la plus dure d'abord.
export function plusDures(ids, evals, n = Infinity, seuil = 0.8) {
  return ids.filter(id => evals[id] && evals[id].m >= seuil)
    .sort((a, b) => evals[b].m - evals[a].m || evals[b].last - evals[a].last)
    .slice(0, n);
}

// Répartition des dernières notes d'un deck (pour la barre de couleur).
export function repartition(ids, evals) {
  const r = { 0: 0, 1: 0, 2: 0, jamais: 0 };
  for (const id of ids) { const x = evals[id]; if (!x) r.jamais++; else r[x.g]++; }
  return r;
}
