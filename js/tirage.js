// Choix des cartes pendant une partie. Module pur.
//
// Algorithme « Brassage » (3 novembre 2026, à la demande de l'utilisateur) :
// beaucoup de nouveauté, des révisions régulières, aucune rigidité.
// - Une part réglable des cartes est nouvelle (60 % par défaut), répartie
//   régulièrement dans la partie. Pas de plafond par jour, sauf si on en fixe un.
// - Le reste est de la révision, tirée au hasard parmi les cartes déjà vues,
//   avec plus de chances pour celles qu'on risque d'oublier (mémoire FSRS basse),
//   les difficiles et les ratées la dernière fois ; moins pour celles déjà revues aujourd'hui.
// - Une carte ne revient JAMAIS dans la même partie, sauf une ratée, une seule fois,
//   8 à 12 cartes plus tard. Si tout le stock filtré a été vu, on reprend la plus ancienne.
// FSRS reste le modèle de mémoire (rétention, difficulté) mais ne dicte plus l'ordre.
import { retenu } from './fsrs.js';

// Difficulté de chaque carte : réelle si vue (FSRS), estimée sinon,
// d'après les cartes vues qui partagent ses phénomènes (pastilles) et son type.
export function difficultes(cartes, etats) {
  const parTrait = new Map();
  const ajouter = (k, d) => { const x = parTrait.get(k) || [0, 0]; x[0] += d; x[1]++; parTrait.set(k, x); };
  for (const c of cartes) {
    const e = etats[c.id];
    if (!e || !e.s) continue;
    ajouter('type:' + c.type, e.d);
    for (const p of c.p || []) ajouter('p:' + p.t, e.d);
  }
  const moy = (k) => { const x = parTrait.get(k); return x && x[1] >= 2 ? x[0] / x[1] : null; };
  const out = {};
  for (const c of cartes) {
    const e = etats[c.id];
    if (e && e.s) { out[c.id] = { d: e.d, estimee: false }; continue; }
    const vals = (c.p || []).map(p => moy('p:' + p.t)).filter(v => v != null);
    const t = moy('type:' + c.type);
    let d = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : (t ?? 5);
    if (vals.length && t != null) d = (d * 2 + t) / 3;
    out[c.id] = { d, estimee: true };
  }
  return out;
}

const melanger = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Nouvelles cartes encore autorisées aujourd'hui (Infinity sans plafond).
export function quotaNouvelles(reglages, introduitesAujourdhui) {
  return reglages.nouvellesMax > 0 ? Math.max(0, reglages.nouvellesMax - introduitesAujourdhui) : Infinity;
}

// Poids de révision d'une carte vue : plus elle est fragile, plus elle a de chances de sortir.
export function poidsRevision(etat, d, maintenant, debutJour, reglages) {
  const R = retenu(etat, maintenant);
  let w = 0.15 + 2 * (1 - R) + reglages.poidsDifficulte * (d / 10);
  if (etat.g === 1) w += 0.6;          // ratée la dernière fois
  else if (etat.g === 2) w += 0.25;    // difficile la dernière fois
  if (etat.last >= debutJour) w *= 0.3; // déjà revue aujourd'hui
  return w;
}

// Crée la pioche d'une partie.
// options : { tirage: 'melange' (Brassage) | 'hasard' | 'dues' | 'nouvelles', types: [..] }
export function creerPioche({ cartes, etats, reglages, options, maintenant, introduitesAujourdhui, debutJour = maintenant - 86400000 }) {
  const actives = cartes.filter(c => options.types.includes(c.type) && !(etats[c.id] && etats[c.id].ej));
  const vues = actives.filter(c => etats[c.id] && etats[c.id].s);
  const jamais = melanger(actives.filter(c => !(etats[c.id] && etats[c.id].s)));
  const quota = quotaNouvelles(reglages, introduitesAujourdhui);
  const nouvelles = jamais.slice(0, quota === Infinity ? jamais.length : quota);
  const diff = difficultes(cartes, etats);
  const dues = vues.filter(c => etats[c.id].due <= maintenant).length;
  const part = options.tirage === 'nouvelles' ? 1 : options.tirage === 'dues' ? 0 : reglages.partNouvelles;

  const vuesPartie = new Map();   // id -> rang du dernier passage dans la partie
  const retours = [];             // { id, dans }
  const retourFait = new Set();
  let rang = 0, credit = 0.5;
  const parId = new Map(cartes.map(c => [c.id, c]));
  const enAttente = (id) => retours.some(r => r.id === id);

  const tirerPondere = (liste, poids) => {
    const total = liste.reduce((s, c) => s + poids(c), 0);
    let r = Math.random() * total;
    for (const c of liste) { r -= poids(c); if (r <= 0) return c; }
    return liste[liste.length - 1];
  };
  const revision = () => {
    const libres = vues.filter(c => !vuesPartie.has(c.id) && !enAttente(c.id));
    if (!libres.length) return null;
    if (options.tirage === 'hasard') return libres[Math.floor(Math.random() * libres.length)];
    return tirerPondere(libres, c => poidsRevision(etats[c.id], diff[c.id].d, maintenant, debutJour, reglages));
  };
  const nouvelle = () => {
    const i = nouvelles.findIndex(c => !vuesPartie.has(c.id));
    return i >= 0 ? nouvelles.splice(i, 1)[0] : null;
  };
  // Tout a été vu dans la partie : la carte passée il y a le plus longtemps.
  const plusAncienne = () => {
    const pool = actives.filter(c => !enAttente(c.id));
    if (!pool.length) return null;
    return pool.reduce((a, b) => (vuesPartie.get(a.id) ?? -1) <= (vuesPartie.get(b.id) ?? -1) ? a : b);
  };

  function suivante() {
    rang++;
    for (const r of retours) r.dans--;
    let c = null, estNouvelle = false, estRetour = false;
    const pret = retours.findIndex(r => r.dans <= 0);
    if (pret >= 0) { c = parId.get(retours.splice(pret, 1)[0].id); estRetour = !!c; }
    if (!c) {
      credit += part;
      const veutNouvelle = credit >= 1;
      if (veutNouvelle) { c = nouvelle(); if (c) { estNouvelle = true; credit -= 1; } }
      if (!c) c = revision();
      if (!c && !veutNouvelle) { c = nouvelle(); estNouvelle = !!c; }
      if (!c) c = plusAncienne();
    }
    if (!c) return null;
    vuesPartie.set(c.id, rang);
    return { carte: c, nouvelle: estNouvelle, retour: estRetour };
  }

  // Une carte ratée revient une seule fois, 8 à 12 cartes plus loin.
  function retour(id) {
    if (retourFait.has(id) || enAttente(id)) return;
    retourFait.add(id);
    retours.push({ id, dans: 8 + Math.floor(Math.random() * 5) });
  }

  return { suivante, retour, infos: { actives: actives.length, vues: vues.length, dues, nouvelles: nouvelles.length, quota } };
}
