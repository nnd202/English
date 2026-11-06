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
import { noterDeck, ordreTour, plusDures } from '../js/decks.js';
import { creerBoucle, noterCarte as noterCarteP, plusRatees, meilleure, bat } from '../js/paquet.js';
import { decouper as decouperTemps, estJuste, distracteurs, schema, tirerQuestions } from '../js/temps.js';
import { decouperPhrases, comparer, compter, choisirPhrases, morceaux, phrasesWiki } from '../js/dictee.js';

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
let nbTextes = 0, nbBanque = 0;
for (const nom of dictees) {
  const lot = json(`data/dictees/${nom}.json`);
  verifier(lot.lot === nom && sw.includes(`data/dictees/${nom}.json`), `${nom} : nom ou CORE incorrect`);
  for (const x of lot.banque || []) {
    nbBanque++;
    verifier(x.id && !ids.has(x.id) && ['B1', 'B2', 'C1', 'C2'].includes(x.niveau) && x.texte, `${nom} › ${x.id} : phrase de banque incomplète ou en double`);
    ids.add(x.id);
    verifier(!/\d/.test(x.texte), `${nom} › ${x.id} : chiffres à écrire en lettres`);
  }
  for (const t of lot.textes || []) {
    nbTextes++;
    verifier(t.id && !ids.has(t.id), `${nom} › ${t.id} : identifiant manquant ou en double`);
    ids.add(t.id);
    verifier(t.titre && Array.isArray(t.phrases) && t.phrases.length, `${nom} › ${t.id} : titre ou phrases manquants`);
    for (const p of t.phrases || []) verifier(compter(comparer(p, p)).justes === compter(comparer(p, p)).mots, `${nom} › ${t.id} : phrase non auto-comparable « ${p} »`);
  }
}
// Decks
const DK = json('data/decks.json').decks;
const toutesIds = new Set();
for (const nom of lots) for (const c of json(`data/lots/${nom}.json`).cartes) toutesIds.add(c.id);
for (const d of DK) {
  verifier(d.id && d.titre && d.cartes.length >= 20, `Deck ${d.id} : titre ou cartes manquants`);
  verifier(new Set(d.cartes).size === d.cartes.length && d.cartes.every(id => toutesIds.has(id)), `Deck ${d.id} : carte inconnue ou en double`);
}
verifier(new Set(DK.map(d => d.id)).size === DK.length, 'Decks : identifiants uniques');
for (const nom of lots) for (const c of json(`data/lots/${nom}.json`).cartes) if (c.type === 'temps') verifier(json('data/temps.json').temps.some(t => t.id === c.temps), `${c.id} : temps inconnu`);

// Paquets du Sprint
const PQ = json('data/paquets.json').paquets;
const tempsIds = json('data/temps.json').temps.map(t => t.id);
verifier(new Set(PQ.map(p => p.id)).size === PQ.length, 'Paquets : identifiants uniques');
for (const p of PQ) {
  verifier(p.titre && p.accroche && p.groupe && ['cartes', 'soutenu', 'particules', 'paires'].includes(p.genre) && p.cartes.length >= 15, `Paquet ${p.id} : champs ou cartes manquants`);
  for (const c of p.cartes) {
    const ou = `Paquet ${p.id} › ${c.id}`;
    verifier(!ids.has(c.id), `${ou} : identifiant en double`); ids.add(c.id);
    verifier(c.texte && c.aide, `${ou} : texte ou aide manquant`);
    if (p.genre === 'paires') { verifier(tempsIds.includes(c.ta) && tempsIds.includes(c.tb) && ['a', 'b'].includes(c.rep) && c.question, `${ou} : paire incomplète`); continue; }
    verifier(c.ipa && !/[g:/]/.test(c.ipa), `${ou} : IPA manquante ou avec g latin, deux-points ou barre`);
    const { inconnus } = decouper(c.ipa || '', langue.symboles);
    verifier(!inconnus.length, `${ou} : symboles IPA inconnus : ${[...new Set(inconnus)].join(' ')}`);
    if (p.genre === 'cartes') verifier(['mot', 'expr', 'phrasal', 'phrase'].includes(c.cat), `${ou} : catégorie inconnue`);
    if (p.genre === 'soutenu') verifier(/\[[^\]]+\]/.test(c.recto) && c.lemme, `${ou} : verbe soutenu entre crochets ou lemme manquant`);
    if (p.genre === 'particules') verifier(c.recto.includes('___') && c.texte.includes(c.particule), `${ou} : trou ou particule`);
  }
}
verifier(sw.includes('data/paquets.json'), 'paquets.json absent de CORE');

// Exercice des temps
const TP = json('data/temps.json');
verifier(TP.temps.length === 12 && new Set(TP.temps.map(t => `${t.epoque}|${t.aspect}`)).size === 12, 'Temps : 12 temps, un par case de la grille');
for (const t of TP.temps) verifier(schema(t.id).includes('sx-ev'), `Temps : schéma manquant pour ${t.id}`);
for (const p of TP.phrases) {
  verifier(TP.temps.some(t => t.id === p.t) && decouperTemps(p.p).verbe && p.base && !ids.has(p.id), `Temps › ${p.id} : temps, verbe entre crochets, base ou identifiant`);
  ids.add(p.id);
  verifier(estJuste(decouperTemps(p.p).verbe, decouperTemps(p.p).verbe), `Temps › ${p.id} : la réponse doit se valider elle-même`);
}
for (const t of TP.temps) verifier(TP.phrases.filter(p => p.t === t.id).length >= 5, `Temps : au moins 5 phrases pour ${t.id}`);
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

// Pioche (Brassage)
const cartesTest = Array.from({ length: 80 }, (_, i) => ({ id: 'x' + i, type: TYPES[i % 4], p: i % 2 ? [{ t: 'flap' }] : [] }));
const etatsTest = {};
for (let i = 0; i < 20; i++) etatsTest['x' + i] = noter({}, i < 5 ? 1 : 3, T0 - 20 * JOUR);   // 20 vues, dont 5 ratées
etatsTest.x20 = { ej: T0 };                                                              // éjectée jamais vue
const reg = { ...REGLAGES_DEFAUT, partNouvelles: 0.6, nouvellesMax: 0 };
const piocher = (opts = {}) => creerPioche({ cartes: cartesTest, etats: etatsTest, reglages: { ...reg, ...(opts.reg || {}) }, options: { tirage: opts.tirage || 'melange', types: opts.types || TYPES }, maintenant: T0, introduitesAujourdhui: opts.intro || 0 });
const pioche = piocher();
verifier(pioche.infos.vues === 20 && pioche.infos.nouvelles === 59 && pioche.infos.actives === 79, 'Pioche : 20 vues, 59 nouvelles sans plafond, éjectée exclue');
const tirées = Array.from({ length: 50 }, () => pioche.suivante());
verifier(tirées.every(x => x && x.carte.id !== 'x20'), 'Pioche : jamais de carte éjectée, jamais de fin de pioche');
verifier(new Set(tirées.map(x => x.carte.id)).size === 50, 'Pioche : aucune carte deux fois dans une partie (sans ratée)');
const nbNouv = tirées.filter(x => x.nouvelle).length;
verifier(nbNouv >= 29 && nbNouv <= 31, `Pioche : 60 % de nouveautés, régulièrement réparties (${nbNouv}/50)`);
verifier(tirées.slice(0, 10).filter(x => x.nouvelle).length >= 5, 'Pioche : les nouveautés arrivent dès le début');
const p2 = piocher();
const premiere = p2.suivante();
p2.retour(premiere.carte.id); p2.retour(premiere.carte.id);
const suite = Array.from({ length: 30 }, () => p2.suivante());
const ret = suite.map((x, i) => x.carte.id === premiere.carte.id ? i : -1).filter(i => i >= 0);
verifier(ret.length === 1 && ret[0] >= 7 && ret[0] <= 11 && suite[ret[0]].retour, 'Pioche : une ratée revient une seule fois, 8 à 12 cartes plus loin');
const plaf = piocher({ reg: { nouvellesMax: 15 }, intro: 12 });
verifier(Array.from({ length: 40 }, () => plaf.suivante()).filter(x => x.nouvelle).length === 3, 'Pioche : le plafond optionnel de nouvelles est respecté');
const rev = piocher({ tirage: 'dues' });
verifier(Array.from({ length: 20 }, () => rev.suivante()).every(x => !x.nouvelle && +x.carte.id.slice(1) < 20), 'Pioche : mode Révisions = cartes déjà vues uniquement');
const filtre = piocher({ tirage: 'hasard', types: ['mot'] });
verifier(Array.from({ length: 20 }, () => filtre.suivante()).every(x => x.carte.type === 'mot'), 'Pioche : le filtre par type est respecté');
const petit = creerPioche({ cartes: cartesTest.slice(0, 6), etats: {}, reglages: reg, options: { tirage: 'melange', types: TYPES }, maintenant: T0, introduitesAujourdhui: 0 });
const ps = Array.from({ length: 12 }, () => petit.suivante().carte.id);
verifier(new Set(ps.slice(0, 6)).size === 6 && ps[6] === ps[0], 'Pioche : stock épuisé → on reprend la carte vue il y a le plus longtemps');
let ratéesTirées = 0;
for (let k = 0; k < 1000; k++) { const pk = piocher({ reg: { partNouvelles: 0 } }); if (+pk.suivante().carte.id.slice(1) < 5) ratéesTirées++; }
verifier(ratéesTirées > 310, `Pioche : en révision, les cartes ratées sortent plus souvent (${ratéesTirées}/1000, hasard pur ≈ 250)`);
verifier(quotaNouvelles(reg, 5) === Infinity && quotaNouvelles({ nouvellesMax: 10 }, 3) === 7, 'Quota : aucun plafond par défaut, plafond optionnel décompté');
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

const banqueTest = Array.from({ length: 20 }, (_, i) => ({ id: 'q' + i, niveau: 'C1', texte: 'x' }));
const etatsQ = { q0: { n: 1, best: 0.5, last: T0 - 3 * JOUR }, q1: { n: 1, best: 1, last: T0 - 3 * JOUR }, q2: { n: 1, best: 0.2, last: T0 - 3600000 } };
const ch = choisirPhrases(banqueTest, etatsQ, 'C1', 8, T0).map(p => p.id);
verifier(ch.length === 8 && new Set(ch).size === 8 && ch.includes('q0') && !ch.includes('q1') && !ch.includes('q2'), 'Banque : phrases neuves + une ratée à revoir ; ni réussie, ni vue dans la journée');
verifier(morceaux('Had I known the project would drag on this long, I would never have signed up for it.').length === 3, 'Dictée : découpage par morceaux');
verifier(phrasesWiki('Paris (French: [paʁi]) is the capital and largest city of France. It is old.', 5)[0] === 'Paris is the capital and largest city of France.', 'Wikipédia : parenthèses retirées, phrases trop courtes écartées');
verifier(comparer('It was signed by Clemenceau in Paris.', 'it was signed by clemenso in pari', { indulgenceNoms: true }).filter(e => e.k === 'nom').length === 2, 'Dictée : noms propres pardonnés sur demande');

// Temps : réponses et choix
verifier(estJuste("'ll have left", 'will have left') && estJuste('hadn’t flown', 'had not flown') && estJuste("won't tell", 'will not tell') && estJuste('  Had Left. ', 'had left'), 'Temps : contractions, majuscules et ponctuation acceptées');
verifier(!estJuste('has left', 'had left') && !estJuste('left', 'had left'), 'Temps : une autre forme est refusée');
const ds = distracteurs(TP.temps, 'pasp');
verifier(ds.length === 4 && new Set(ds).size === 4 && ds.includes('pasp'), 'Temps : quatre schémas au choix dont le bon');
const tq = tirerQuestions(TP.phrases, 10, ['t-ps-1', 't-pc-1']);
verifier(tq.length === 10 && new Set(tq).size === 10 && tq.some(p => p.id === 't-ps-1'), 'Temps : 10 questions sans doublon, ratées reprises');

// Decks : moyenne récente, ordre, plus dures
const ev = {};
noterDeck(ev, 'a', 2, 1); noterDeck(ev, 'a', 0, 2); noterDeck(ev, 'b', 1, 3); noterDeck(ev, 'c', 2, 4); noterDeck(ev, 'd', 0, 5);
verifier(Math.abs(ev.a.m - 1.2) < 1e-9 && ev.a.n === 2 && ev.a.g === 0, 'Decks : moyenne récente (dur puis facile = 1,2)');
verifier(plusDures(['a', 'b', 'c', 'd', 'e'], ev).join() === 'c,a,b', 'Decks : les plus dures, la plus dure d\'abord, faciles et jamais vues exclues');
const ids6 = ['a', 'b', 'c', 'd', 'e', 'f'];
verifier(ordreTour(ids6, 'fixe', 3).join() === 'a,b,c,d,e,f', 'Decks : ordre fixe');
verifier(ordreTour(ids6, 'melange', 1).join() === ordreTour(ids6, 'melange', 1).join() && ordreTour(ids6, 'melange', 1).join() !== ordreTour(ids6, 'melange', 2).join() && ordreTour(ids6, 'melange', 1).slice().sort().join() === 'a,b,c,d,e,f', 'Decks : ordre mélangé stable pendant un tour, différent au tour suivant');

// Sprint par paquets : boucle, OK sort, raté revient au tour suivant
const bl = creerBoucle(['a', 'b', 'c', 'd']);
const seq = [];
for (const rep of [1, 0, 1, 0, 0, 1, 1]) { const id = bl.suivante(); seq.push(id); if (rep) bl.ok(id); }
verifier(seq.join() === 'a,b,c,d,b,d,b' && bl.suivante() === null && bl.reussies === 4 && bl.tour === 3, `Paquets : boucle (${seq.join()}, tour ${bl.tour})`);
const bh = creerBoucle(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
const vus8 = Array.from({ length: 8 }, () => bh.suivante());
verifier(new Set(vus8).size === 8 && bh.suivante() === 'a', 'Paquets : un tour complet sans répétition, puis on repart du début');
const bz = creerBoucle(Array.from({ length: 40 }, (_, i) => 'x' + i), true);
verifier(new Set(bz.ordre).size === 40 && bz.ordre.join() !== Array.from({ length: 40 }, (_, i) => 'x' + i).join(), 'Paquets : ordre au hasard tiré au démarrage, sans perte');
const stP = {};
noterCarteP(stP, 'a', false, 1); noterCarteP(stP, 'a', false, 2); noterCarteP(stP, 'a', true, 3); noterCarteP(stP, 'b', false, 4); noterCarteP(stP, 'c', true, 5);
verifier(stP.a.ok === 1 && stP.a.rate === 2 && stP.a.dernier === 1 && plusRatees(['a', 'b', 'c'], stP).join() === 'b,a', 'Paquets : stats par carte et plus ratées');
const pg = (complet, joue, ok) => ({ complet, joue, ok });
verifier(meilleure([pg(false, 600000, 30), pg(true, 500000, 40), pg(true, 420000, 40), pg(false, 600000, 38)]).joue === 420000 && bat(pg(false, 0, 39), pg(false, 0, 38)) && !bat(pg(false, 0, 39), pg(true, 590000, 40)), 'Paquets : record = gagnée la plus rapide, sinon le plus d\'OK');

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

console.log(`\n${nb} cartes, ${nbTextes} histoires, ${nbBanque} phrases de dictée (${Object.entries(parType).map(([k, v]) => `${k} ${v}`).join(', ')}), ${controles} contrôles, ${erreurs ? erreurs + ' erreur(s)' : 'tout est bon'}.`);
process.exit(erreurs ? 1 : 0);
