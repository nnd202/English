// Dictées : découpage en phrases et comparaison mot à mot. Module pur.

// Découpe un texte collé en phrases (ponctuation forte ou retour à la ligne).
const ABREV = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|e\.g|i\.e|U\.S|a\.m|p\.m)\.$/i;
export function decouperPhrases(texte) {
  const brut = texte
    .replace(/\r/g, '')
    .split(/\n+|(?<=[.!?…])\s+(?=["“'‘(]?[A-Z0-9])/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out = [];
  for (const s of brut) {
    if (out.length && ABREV.test(out[out.length - 1])) out[out.length - 1] += ' ' + s;
    else out.push(s);
  }
  return out.filter(s => /[A-Za-z0-9]/.test(s));
}

// Mots d'une phrase, avec leur forme affichée et leur forme normalisée.
export function mots(phrase) {
  return phrase
    .replace(/[’‘`´]/g, "'")
    .replace(/[-–—/]/g, ' ')
    .split(/\s+/)
    .map(brut => ({ brut, n: normaliser(brut) }))
    .filter(m => m.n)
    .map((m, i) => ({ ...m, i }));
}

export function normaliser(m) {
  return m.toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9']/g, '')
    .replace(/^'+|'+$/g, '');
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// Compare la saisie à la phrase de référence.
// Retourne une suite d'éléments :
//   { k: 'ok', ref }                 mot juste
//   { k: 'faute', ref, saisi }       bon mot, mal orthographié (1 ou 2 lettres)
//   { k: 'faux', ref, saisi }        autre mot
//   { k: 'manque', ref }             mot oublié
//   { k: 'ajout', saisi }            mot en trop
// Option indulgenceNoms : un nom propre (majuscule hors début de phrase) mal écrit
// compte comme juste, affiché à part (« nom »).
export function comparer(reference, saisie, { indulgenceNoms = false } = {}) {
  const R = mots(reference), S = mots(saisie);
  // Plus longue sous-suite commune sur les formes normalisées.
  const L = Array.from({ length: R.length + 1 }, () => Array(S.length + 1).fill(0));
  for (let i = R.length - 1; i >= 0; i--) for (let j = S.length - 1; j >= 0; j--)
    L[i][j] = R[i].n === S[j].n ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0, refEnAttente = [], saisiEnAttente = [];
  const vider = () => {
    const n = Math.min(refEnAttente.length, saisiEnAttente.length);
    for (let k = 0; k < n; k++) {
      const r = refEnAttente[k], s = saisiEnAttente[k];
      const tol = r.n.length > 6 ? 2 : 1;
      const nom = indulgenceNoms && r.i > 0 && /^["“'‘(]?[A-Z]/.test(r.brut);
      out.push({ k: nom ? 'nom' : distance(r.n, s.n) <= tol ? 'faute' : 'faux', ref: r.brut, saisi: s.brut });
    }
    for (const r of refEnAttente.slice(n)) out.push({ k: indulgenceNoms && r.i > 0 && /^[A-Z]/.test(r.brut) ? 'nom' : 'manque', ref: r.brut });
    for (const s of saisiEnAttente.slice(n)) out.push({ k: 'ajout', saisi: s.brut });
    refEnAttente = []; saisiEnAttente = [];
  };
  while (i < R.length || j < S.length) {
    if (i < R.length && j < S.length && R[i].n === S[j].n) { vider(); out.push({ k: 'ok', ref: R[i].brut }); i++; j++; }
    else if (j < S.length && (i >= R.length || L[i][j + 1] >= L[i + 1][j])) saisiEnAttente.push(S[j++]);
    else refEnAttente.push(R[i++]);
  }
  vider();
  return out;
}

// Bilan chiffré d'une comparaison.
export function compter(elements) {
  const c = { mots: 0, justes: 0, fautes: 0, faux: 0, manques: 0, ajouts: 0 };
  for (const e of elements) {
    if (e.k !== 'ajout') c.mots++;
    if (e.k === 'ok' || e.k === 'nom') c.justes++;
    else if (e.k === 'faute') c.fautes++;
    else if (e.k === 'faux') c.faux++;
    else if (e.k === 'manque') c.manques++;
    else c.ajouts++;
  }
  return c;
}

// ---------- Banque de phrases ----------

const melanger = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Choisit n phrases d'un niveau : surtout des phrases jamais vues,
// plus environ une sur quatre à retravailler (ratée, vue il y a plus d'un jour).
// etats : { id: { n, best, last } } (best = part de mots justes, de 0 à 1).
export function choisirPhrases(banque, etats, niveau, n, maintenant) {
  const pool = banque.filter(p => p.niveau === niveau);
  const jamais = melanger(pool.filter(p => !etats[p.id]));
  const aRevoir = pool.filter(p => etats[p.id] && etats[p.id].best < 1 && maintenant - etats[p.id].last > 86400000)
    .sort((a, b) => etats[a.id].best - etats[b.id].best);
  const nRevoir = Math.min(aRevoir.length, Math.max(aRevoir.length ? 1 : 0, Math.floor(n / 4)));
  const choix = aRevoir.slice(0, nRevoir);
  for (const p of jamais) { if (choix.length >= n) break; choix.push(p); }
  if (choix.length < n) {
    const reste = pool.filter(p => !choix.includes(p)).sort((a, b) => (etats[a.id]?.last || 0) - (etats[b.id]?.last || 0));
    for (const p of reste) { if (choix.length >= n) break; choix.push(p); }
  }
  return melanger(choix);
}

// Morceaux d'une phrase pour l'aide « par morceaux » : coupure à la ponctuation,
// puis les morceaux de plus de 9 mots sont coupés en deux.
export function morceaux(phrase) {
  const out = [];
  for (const m of phrase.split(/(?<=[,;:—])\s+/)) {
    const w = m.split(/\s+/);
    if (w.length > 9) { const k = Math.ceil(w.length / 2); out.push(w.slice(0, k).join(' '), w.slice(k).join(' ')); }
    else out.push(m);
  }
  return out.filter(Boolean);
}

// Nettoie un résumé Wikipédia : sans parenthèses ni crochets, en phrases.
export function phrasesWiki(extrait, max) {
  const propre = extrait.replace(/\s*\([^()]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  return decouperPhrases(propre).filter(p => p.split(' ').length >= 4).slice(0, max);
}
