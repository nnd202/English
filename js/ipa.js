// Outils IPA : découpage en symboles, légende contextuelle, zones à surligner.
// Module pur (sans DOM) : utilisé par l'appli et par tools/check.mjs.

// Découpe une transcription en symboles connus (plus long d'abord).
// Retourne { jetons: [{ s, i }], inconnus: [caractères] }.
export function decouper(ipa, symboles) {
  const liste = symboles.map(x => x.s).sort((a, b) => b.length - a.length);
  const jetons = [], inconnus = [];
  let i = 0;
  while (i < ipa.length) {
    const c = ipa[i];
    if (c === ' ') { i++; continue; }
    const s = liste.find(x => ipa.startsWith(x, i));
    if (s) { jetons.push({ s, i }); i += s.length; }
    else { inconnus.push(c); i++; }
  }
  return { jetons, inconnus };
}

// Symboles présents, dans l'ordre d'apparition, sans doublon.
export function legende(ipa, symboles, avecEvidents = false) {
  const parS = new Map(symboles.map(x => [x.s, x]));
  const vus = new Set(), out = [];
  for (const j of decouper(ipa, symboles).jetons) {
    if (vus.has(j.s)) continue;
    vus.add(j.s);
    const x = parS.get(j.s);
    if (x && (avecEvidents || !x.evident)) out.push(x);
  }
  return out;
}

// Zones [début, fin) désignées par une spécification de surlignage.
// - « t̬ » : toutes les occurrences de la sous-chaîne ;
// - « veg[e]table » : le texte entier, les crochets marquent la zone.
export function zones(texte, spec) {
  if (!spec) return [];
  if (spec.includes('[')) {
    const brut = spec.replace(/[[\]]/g, '');
    const debut = texte.indexOf(brut);
    if (debut < 0) return [];
    const out = [];
    let pos = 0, ouvert = -1;
    for (const c of spec) {
      if (c === '[') ouvert = pos;
      else if (c === ']') { out.push([debut + ouvert, debut + pos]); ouvert = -1; }
      else pos++;
    }
    return out;
  }
  const out = [];
  let i = texte.indexOf(spec);
  while (i >= 0 && spec.length) { out.push([i, i + spec.length]); i = texte.indexOf(spec, i + spec.length); }
  return out;
}

// Découpe le texte en morceaux { t, on } selon des zones.
export function morceaux(texte, zs) {
  if (!zs.length) return [{ t: texte, on: false }];
  const marque = new Array(texte.length).fill(false);
  for (const [a, b] of zs) for (let k = a; k < b; k++) marque[k] = true;
  // Ne jamais séparer un caractère combinant de sa base (t̬).
  for (let k = 1; k < texte.length; k++) if (/\p{M}/u.test(texte[k])) marque[k] = marque[k - 1] = marque[k] || marque[k - 1];
  const out = [];
  for (let k = 0; k < texte.length; k++) {
    const der = out[out.length - 1];
    if (der && der.on === marque[k]) der.t += texte[k];
    else out.push({ t: texte[k], on: marque[k] });
  }
  return out;
}
