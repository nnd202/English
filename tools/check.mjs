// Vérification du projet : node tools/check.mjs
// 1. Fichiers servis tous présents dans la liste CORE de sw.js (hors ligne).
// 2. Lots de cartes : champs, identifiants uniques, IPA entièrement reconnue,
//    pastilles connues et qui surlignent bien quelque chose.
// 3. Tests du moteur : FSRS, pioche, séries, records, fusion d'import.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decouper, zones } from '../js/ipa.js';
import { noter, retenu, W, JOUR } from '../js/fsrs.js';
import { creerPioche, quotaNouvelles, difficultes } from '../js/tirage.js';
import { series, records, fusionner, REGLAGES_DEFAUT, TYPES } from '../js/store.js';
import { decouperPhrases, comparer, compter } from '../js/dictee.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => readFileSync(join(RACINE, p), 'utf8');
const json = (p) => JSON.parse(lire(p));
let erreurs = 0, controles = 0;
const ko = (msg) => { erreurs++; console.log('  ✗ ' + msg); };
const verifier = (cond, msg) => { controles++; if (!cond) ko(msg); };

// ---------- 1. Cache hors ligne ----------
console.log('Cache hors ligne (sw.js)');
const sw = lire('sw.js');
const bloc = sw.slice(sw.indexOf('const CORE = ['), sw.indexOf('];', sw.indexOf('const CORE = [')));
const core = [...bloc.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(x => x !== './');
const servis = ['index.html', 'manifest.webmanifest'];
for (const dossier of ['js', 'css', 'icons', 'data', 'data/lots', 'data/dictees']) {
  for (const f of readdirSync(join(RACINE, dossier), { withFileTypes: true })) if (f.isFile()) servis.push(`${dossier}/${f.name}`);
}
for (const f of servis) verifier(core.includes(f), `${f} absent de CORE`);
for (const f of core) verifier(existsSync(join(RACINE, f)), `${f} listé dans CORE mais introuvable`);

// ---------- 2. Données ----------
console.log('Données');
const langue = json('data/langue.json');
const { lots, dictees = [] } = json('data/lots.json');
const ids = new Set();
let nb = 0;
const parType = {};
for (const nom of lots) {
  const lot = json(`data/lots/${nom}.json`);
  verifier(lot.lot === nom, `${nom} : champ « lot » différent du nom de fichier`);
  verifier(sw.includes(`data/lots/${nom}.json`), `${nom} absent de CORE`);
  for (const c of lot.cartes) {
    nb++;
    const ou = `${nom} › ${c.id}`;
    verifier(c.id && !ids.has(c.id), `${ou} : identifiant manquant ou en double`);
    ids.add(c.id);
    verifier(TYPES.includes(c.type), `${ou} : type inconnu « ${c.type} »`);
    parType[c.type] = (parType[c.type] || 0) + 1;
    for (const champ of ['texte', 'ipa', 'def']) verifier(c[champ], `${ou} : champ « ${champ} » manquant`);
    if (!c.ipa) continue;
    verifier(!/[g:/]/.test(c.ipa), `${ou} : IPA avec g latin, deux-points ou barre (utiliser ɡ, ː, sans /)`);
    const { inconnus } = decouper(c.ipa, langue.symboles);
    verifier(!inconnus.length, `${ou} : symboles IPA inconnus de la légende : ${[...new Set(inconnus)].join(' ')}`);
    for (const p of c.p || []) {
      verifier(langue.pastilles[p.t], `${ou} : pastille inconnue « ${p.t} »`);
      verifier(p.ipa || p.mot, `${ou} : pastille « ${p.t} » sans cible`);
      if (p.ipa) verifier(zones(c.ipa, p.ipa).length, `${ou} : pastille « ${p.t} » : « ${p.ipa} » introuvable dans l'IPA`);
      if (p.mot) verifier(zones(c.texte, p.mot).length, `${ou} : pastille « ${p.t} » : « ${p.mot} » introuvable dans le texte`);
    }
  }
}
let nbTextes = 0;
for (const nom of dictees) {
  const lot = json(`data/dictees/${nom}.json`);
  verifier(lot.lot === nom && sw.includes(`data/dictees/${nom}.json`), `${nom} : nom ou CORE incorrect`);
  for (const t of lot.textes) {
    nbTextes++;
    verifier(t.id && !ids.has(t.id), `${nom} › ${t.id} : identifiant manquant ou en double`);
    ids.add(t.id);
    verifier(t.titre && Array.isArray(t.phrases) && t.phrases.length, `${nom} › ${t.id} : titre ou phrases manquants`);
    for (const p of t.phrases || []) verifier(compter(comparer(p, p)).justes === compter(comparer(p, p)).mots, `${nom} › ${t.id} : phrase non auto-comparable « ${p} »`);
  }
}
for (const l of langue.liens) for (const t of l.types) verifier(TYPES.includes(t), `lien ${l.nom} : type inconnu ${t}`);

// ---------- 3. Moteur ----------
console.log('Moteur');
const T0 = Date.UTC(2026, 10, 3, 9);
// FSRS
let e = noter({}, 3, T0);
verifier(Math.abs(e.s - W[2]) < 1e-9 && e.n === 1, 'FSRS : première note « Bien » → stabilité initiale');
verifier(Math.abs((e.due - T0) / JOUR - W[2]) < 0.01, 'FSRS : à 90 % de rétention, intervalle = stabilité');
const apres = noter(e, 3, e.due);
verifier(apres.s > e.s * 2, 'FSRS : réussite à l\'échéance → stabilité nettement plus grande');
const tot = noter(e, 3, T0 + 60000);
verifier(tot.s >= e.s && tot.s < e.s * 1.05, 'FSRS : révision une minute après → stabilité presque inchangée (mode Hasard sans effet pervers)');
const rate = noter(apres, 1, apres.due);
verifier(rate.s < apres.s && rate.l === 1, 'FSRS : raté → stabilité réduite, un oubli compté');
verifier(noter({}, 1, T0).d > noter({}, 4, T0).d, 'FSRS : « Raté » donne une difficulté plus haute que « Facile »');
verifier(Math.abs(retenu(e, e.due) - 0.9) < 0.001, 'FSRS : rétention de 90 % à l\'échéance');

// Pioche
const cartesTest = Array.from({ length: 30 }, (_, i) => ({ id: 'x' + i, type: TYPES[i % 4], p: i % 2 ? [{ t: 'flap' }] : [] }));
const etatsTest = {};
for (let i = 0; i < 10; i++) etatsTest['x' + i] = noter({}, 3, T0 - 20 * JOUR);       // 10 vues, dues
etatsTest.x10 = { ej: T0 };                                                        // éjectée jamais vue
const reg = { ...REGLAGES_DEFAUT, nouvellesParJour: 5 };
const pioche = creerPioche({ cartes: cartesTest, etats: etatsTest, reglages: reg, options: { tirage: 'melange', types: TYPES }, maintenant: T0, introduitesAujourdhui: 0 });
verifier(pioche.infos.dues === 10 && pioche.infos.nouvelles === 5 && pioche.infos.actives === 29, 'Pioche : 10 dues, quota de 5 nouvelles, éjectée exclue');
const tirées = Array.from({ length: 60 }, () => pioche.suivante());
verifier(tirées.every(x => x && x.carte.id !== 'x10'), 'Pioche : jamais de carte éjectée, jamais de fin de pioche');
verifier(tirées.filter(x => x.nouvelle).length === 5, 'Pioche : exactement le quota de nouvelles');
verifier(new Set(tirées.slice(0, 15).map(x => x.carte.id)).size === 15, 'Pioche : pas de répétition rapprochée');
const premieres = tirées.slice(0, 13).filter(x => !x.nouvelle).map(x => x.carte.id);
verifier(premieres.every(id => +id.slice(1) < 10), 'Pioche : les cartes dues passent en premier');
pioche.retour('x3');
const suite = Array.from({ length: 12 }, () => pioche.suivante());
verifier(suite.some(x => x.carte.id === 'x3' && x.retour), 'Pioche : une carte ratée revient dans la partie, marquée comme retour');
const filtre = creerPioche({ cartes: cartesTest, etats: etatsTest, reglages: reg, options: { tirage: 'hasard', types: ['mot'] }, maintenant: T0, introduitesAujourdhui: 0 });
verifier(Array.from({ length: 20 }, () => filtre.suivante()).every(x => x.carte.type === 'mot'), 'Pioche : le filtre par type est respecté');
verifier(quotaNouvelles(reg, 0, 61) === 2 && quotaNouvelles(reg, 0, 121) === 0 && quotaNouvelles(reg, 3, 0) === 2, 'Quota : réduit avec le retard, décompté des nouvelles du jour');
const est = difficultes(cartesTest, etatsTest);
verifier(est.x29.estimee && est.x29.d > 0 && !est.x1.estimee, 'Difficulté : réelle si vue, estimée sinon');

// Dictées
const cmp = (r, s) => comparer(r, s).map(e => e.k).join(',');
verifier(cmp("I'm running a little late.", 'im running a litle late') === 'faute,ok,ok,faute,ok', 'Dictée : apostrophe oubliée et lettre manquante = fautes d\'orthographe');
verifier(cmp('What do you want to do?', 'what you want do') === 'ok,manque,ok,ok,manque,ok', 'Dictée : mots oubliés repérés');
verifier(cmp('Hold on a second.', 'hold on on a second') === 'ok,ok,ajout,ok,ok' || cmp('Hold on a second.', 'hold on on a second') === 'ok,ajout,ok,ok,ok', 'Dictée : mot en trop repéré');
verifier(cmp('I could use some help.', 'I could use some health') === 'ok,ok,ok,ok,faux', 'Dictée : mot différent = faux');
verifier(cmp('It’s bike-sharing, OK?', "it's bike sharing ok") === 'ok,ok,ok,ok', 'Dictée : apostrophes typographiques, tirets, majuscules et ponctuation pardonnés');
verifier(decouperPhrases('Hi there. How are you?\nFine! Thanks… bye. Mr. Smith left.')[4] === 'Mr. Smith left.', 'Dictée : découpage en phrases d\'un texte collé');

// Séries, records, fusion
const s = (id, jour, extra = {}) => ({ id, debut: Date.UTC(2026, 10, jour, 10), cartes: [['a', 3, 1000]], passees: 10, mode: 'sprint', duree: 900, tirage: 'melange', complet: true, ...extra });
const ses = [s('a', 1), s('b', 2), s('c', 3), s('d', 5, { passees: 30 }), s('e', 6, { passees: 50, complet: false })];
const ser = series(ses, '2026-11-06');
verifier(ser.enCours === 2 && ser.record === 3, 'Séries : en cours 2 jours, record 3');
verifier(series(ses, '2026-11-08').enCours === 0, 'Séries : cassée après un jour sans partie');
verifier(records(ses)['900|melange'].id === 'd', 'Records : seules les parties complètes comptent');
const A = { cartes: { k: { last: 5, s: 1 }, m: { last: 9, s: 2 } }, sessions: [ses[0], ses[1]] };
const B = { cartes: { k: { last: 7, s: 3 }, m: { last: 1, s: 9, ej: 4 }, n: { last: 2 } }, sessions: [ses[1], ses[2]] };
const F = fusionner(A, B);
verifier(F.cartes.k.s === 3 && F.cartes.m.s === 2 && F.cartes.m.ej === 4 && F.cartes.n, 'Fusion : état le plus récent gardé, éjection conservée');
verifier(F.sessions.length === 3, 'Fusion : parties sans doublon');
verifier(series([{ id: 'z', debut: Date.UTC(2026, 10, 6, 10), mode: 'dictee', cartes: [] }], '2026-11-06').enCours === 1, 'Séries : une dictée compte comme un jour joué');

console.log(`\n${nb} cartes, ${nbTextes} dictées (${Object.entries(parType).map(([k, v]) => `${k} ${v}`).join(', ')}), ${controles} contrôles, ${erreurs ? erreurs + ' erreur(s)' : 'tout est bon'}.`);
process.exit(erreurs ? 1 : 0);
