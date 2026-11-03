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
    .filter(m => m.n);
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
export function comparer(reference, saisie) {
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
      out.push({ k: distance(r.n, s.n) <= tol ? 'faute' : 'faux', ref: r.brut, saisi: s.brut });
    }
    for (const r of refEnAttente.slice(n)) out.push({ k: 'manque', ref: r.brut });
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
    if (e.k === 'ok') c.justes++;
    else if (e.k === 'faute') c.fautes++;
    else if (e.k === 'faux') c.faux++;
    else if (e.k === 'manque') c.manques++;
    else c.ajouts++;
  }
  return c;
}
