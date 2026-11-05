// Exercice des temps : schémas de frise, réponses tolérantes aux contractions,
// tirage des questions. Module pur (les schémas sont du texte SVG).

// « the train [had left]. » → { avant, verbe, apres }
export function decouper(p) {
  const m = p.match(/^(.*)\[([^\]]+)\](.*)$/);
  return m ? { avant: m[1], verbe: m[2], apres: m[3] } : { avant: p, verbe: '', apres: '' };
}
export const phraseComplete = (p) => p.replace(/[[\]]/g, '');

// Toutes les formes développées possibles d'une réponse (contractions dépliées).
const SUBST = [
  [/\bwon't\b/g, ['will not']], [/\bcan't\b/g, ['cannot']], [/\bcannot\b/g, ['can not']], [/n't\b/g, [' not']],
  [/'ll\b/g, [' will']], [/'re\b/g, [' are']], [/'m\b/g, [' am']], [/'ve\b/g, [' have']],
  [/'d\b/g, [' had', ' would']], [/'s\b/g, [' is', ' has']]
];
export function formes(s) {
  let ens = [s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?,;]/g, ' ').replace(/\s+/g, ' ').trim()];
  for (const [re, remplacements] of SUBST) {
    const suivant = [];
    for (const x of ens) {
      if (re.test(x)) { re.lastIndex = 0; for (const r of remplacements) suivant.push(x.replace(re, r).replace(/\s+/g, ' ').trim()); }
      else suivant.push(x);
      re.lastIndex = 0;
    }
    ens = suivant;
  }
  return new Set(ens);
}
export function estJuste(saisie, reponse) {
  const a = formes(saisie), b = formes(reponse);
  for (const x of a) if (b.has(x)) return true;
  return false;
}

// Trois mauvais choix plausibles : deux de la même époque, un du même aspect.
export function distracteurs(temps, id) {
  const t = temps.find(x => x.id === id);
  const melange = (a) => a.sort(() => Math.random() - 0.5);
  const memeEpoque = melange(temps.filter(x => x.epoque === t.epoque && x.id !== id)).slice(0, 2);
  const memeAspect = melange(temps.filter(x => x.aspect === t.aspect && x.epoque !== t.epoque)).slice(0, 1);
  const choix = [t, ...memeEpoque, ...memeAspect];
  return melange(choix.map(x => x.id));
}

// n questions au hasard, les phrases ratées la dernière fois en priorité (au plus un tiers).
export function tirerQuestions(phrases, n, ratees = []) {
  const melange = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r = melange(phrases.filter(p => ratees.includes(p.id))).slice(0, Math.floor(n / 3));
  const reste = melange(phrases.filter(p => !r.includes(p)));
  return melange([...r, ...reste.slice(0, n - r.length)]);
}

// ---------- Schémas ----------
const AXE = 50, NOW = 150;
const point = (x) => `<circle class="sx-ev" cx="${x}" cy="${AXE}" r="7"/>`;
const barre = (x1, x2, raye = true) => `<rect class="sx-ev${raye ? ' raye' : ''}" x="${x1}" y="${AXE - 7}" width="${x2 - x1}" height="14" rx="7"/>`;
const lien = (x1, x2) => `<path class="sx-lien" d="M${x1} ${AXE - 8} Q${(x1 + x2) / 2} ${AXE - 34} ${x2} ${AXE - 8}"/><path class="sx-lien-fin" d="M${x2 - 5} ${AXE - 15} L${x2} ${AXE - 8} L${x2 + 3} ${AXE - 16}"/>`;
const repere = (x) => `<line class="sx-rep" x1="${x}" y1="${AXE - 26}" x2="${x}" y2="${AXE + 22}"/><text class="sx-rep-t" x="${x}" y="${AXE - 31}">repère</text>`;
const habitude = () => [40, 76, 112, 148, 184, 220, 256].map(x => `<circle class="sx-ev" cx="${x}" cy="${AXE}" r="5"/>`).join('');

const FORMES = {
  ps:   () => habitude(),
  pc:   () => barre(116, 184),
  pp:   () => point(68) + lien(68, NOW),
  ppc:  () => barre(58, NOW),
  pas:  () => point(80),
  pasc: () => repere(85) + barre(52, 118),
  pasp: () => repere(112) + point(52) + lien(52, 112),
  paspc:() => repere(112) + barre(42, 112),
  fs:   () => point(228),
  fc:   () => repere(225) + barre(192, 258),
  fp:   () => repere(258) + point(200) + lien(200, 258),
  fpc:  () => repere(258) + barre(NOW + 14, 258)
};

export function schema(id) {
  return `<svg class="schema" viewBox="0 0 300 92" role="img" aria-label="schéma">
    <defs><pattern id="rayures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" class="sx-fond"/><rect width="4" height="8" class="sx-raie"/></pattern></defs>
    <line class="sx-axe" x1="12" y1="${AXE}" x2="284" y2="${AXE}"/><path class="sx-axe" d="M278 ${AXE - 5} L286 ${AXE} L278 ${AXE + 5}"/>
    <line class="sx-now" x1="${NOW}" y1="${AXE - 14}" x2="${NOW}" y2="${AXE + 14}"/>
    <text class="sx-t" x="${NOW}" y="${AXE + 32}">now</text>
    <text class="sx-t pale" x="34" y="${AXE + 32}">past</text><text class="sx-t pale" x="262" y="${AXE + 32}">future</text>
    ${(FORMES[id] || (() => ''))()}
  </svg>`;
}
