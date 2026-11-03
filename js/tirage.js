// Choix des cartes pendant une partie. Module pur.
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

// Quota de nouvelles cartes restant aujourd'hui, réduit si le retard s'accumule.
export function quotaNouvelles(reglages, introduitesAujourdhui, nbDues) {
  let q = Math.max(0, reglages.nouvellesParJour - introduitesAujourdhui);
  if (nbDues > 2 * reglages.seuilRetard) q = 0;
  else if (nbDues > reglages.seuilRetard) q = Math.floor(q / 2);
  return q;
}

// Crée la pioche d'une partie.
// options : { tirage: 'melange'|'hasard'|'dues'|'nouvelles', types: [..] }
export function creerPioche({ cartes, etats, reglages, options, maintenant, introduitesAujourdhui }) {
  const actives = cartes.filter(c => options.types.includes(c.type) && !(etats[c.id] && etats[c.id].ej));
  const vues = actives.filter(c => etats[c.id] && etats[c.id].s);
  const jamais = melanger(actives.filter(c => !(etats[c.id] && etats[c.id].s)));
  const dues = vues.filter(c => etats[c.id].due <= maintenant)
    .sort((a, b) => retenu(etats[a.id], maintenant) - retenu(etats[b.id], maintenant));
  const diff = difficultes(cartes, etats);
  const quota = options.tirage === 'nouvelles' ? jamais.length : quotaNouvelles(reglages, introduitesAujourdhui, dues.length);
  const nouvelles = jamais.slice(0, quota);

  const recentes = [];           // ids montrés récemment (anti-répétition)
  const retours = [];            // { id, dans } : cartes ratées à remontrer
  let compteur = 0;
  const memoire = Math.max(1, Math.min(10, Math.floor(actives.length / 2)));

  const poids = (c) => 0.15 + reglages.poidsDifficulte * (diff[c.id].d / 10);
  const tirerPondere = (liste) => {
    const libres = liste.filter(c => !bloquee(c.id));
    const pool = libres.length ? libres : liste;
    if (!pool.length) return null;
    const total = pool.reduce((s, c) => s + poids(c), 0);
    let r = Math.random() * total;
    for (const c of pool) { r -= poids(c); if (r <= 0) return c; }
    return pool[pool.length - 1];
  };
  const bloquee = (id) => recentes.includes(id) || retours.some(r => r.id === id);
  const prendre = (liste) => {
    const i = liste.findIndex(c => !bloquee(c.id));
    return i >= 0 ? liste.splice(i, 1)[0] : null;
  };
  const parId = new Map(cartes.map(c => [c.id, c]));

  function suivante() {
    compteur++;
    for (const r of retours) r.dans--;
    const pret = retours.findIndex(r => r.dans <= 0);
    let c = null, nouvelle = false, estRetour = false;
    if (pret >= 0) { c = parId.get(retours.splice(pret, 1)[0].id); estRetour = !!c; }
    else if (options.tirage === 'nouvelles') {
      c = prendre(nouvelles); nouvelle = !!c;
      if (!c) c = tirerPondere(vues);
    } else if (options.tirage === 'hasard') {
      const pool = vues.concat(nouvelles);
      const libres = pool.filter(x => !bloquee(x.id));
      c = libres.length ? libres[Math.floor(Math.random() * libres.length)] : (pool[0] || null);
      if (c && nouvelles.includes(c)) { nouvelles.splice(nouvelles.indexOf(c), 1); nouvelle = true; }
    } else {
      // Mélange (défaut) et Dues : les cartes en danger d'abord,
      // une nouvelle environ toutes les 4 cartes (pas en mode Dues).
      if (options.tirage === 'melange' && compteur % 4 === 0) { c = prendre(nouvelles); nouvelle = !!c; }
      if (!c) c = prendre(dues);
      if (!c && options.tirage === 'melange') { c = prendre(nouvelles); nouvelle = !!c; }
      if (!c) c = tirerPondere(vues.length ? vues : actives);
    }
    if (!c) c = tirerPondere(actives);
    if (!c) return null;
    recentes.push(c.id);
    while (recentes.length > memoire) recentes.shift();
    return { carte: c, nouvelle, retour: estRetour };
  }

  // Une carte ratée revient 4 à 6 cartes plus loin.
  function retour(id) {
    if (!retours.some(r => r.id === id)) retours.push({ id, dans: 4 + Math.floor(Math.random() * 3) });
  }

  return {
    suivante, retour,
    infos: { actives: actives.length, dues: dues.length, nouvelles: nouvelles.length, quota }
  };
}
