// Sprint par paquets (6 novembre 2026), façon Geoquiz : réussir tout le paquet dans le temps donné.
// Module pur.
// - Le paquet tourne en boucle, dans l'ordre ou dans un ordre au hasard tiré au démarrage
//   (et gardé jusqu'à la fin de la partie).
// - OK : la carte sort de la boucle. Raté : elle reste et revient au tour suivant.
// - La partie est gagnée quand toutes les cartes sont OK ; sinon, le score est le nombre d'OK au gong.
// - Aucune répétition espacée : chaque réponse alimente seulement les stats de la carte.

const melanger = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function creerBoucle(ids, hasard = false) {
  const ordre = hasard ? melanger([...ids]) : [...ids];
  const restants = new Set(ordre);
  let pos = -1, tour = 1;
  return {
    ordre,
    get tour() { return tour; },
    get restants() { return restants.size; },
    get reussies() { return ordre.length - restants.size; },
    // Carte suivante encore à réussir, en poursuivant l'ordre ; null si tout est réussi.
    suivante() {
      if (!restants.size) return null;
      for (let k = 0; k < ordre.length; k++) {
        pos++;
        if (pos >= ordre.length) { pos = 0; tour++; }
        if (restants.has(ordre[pos])) return ordre[pos];
      }
      return null;
    },
    ok(id) { restants.delete(id); },
    estRestante(id) { return restants.has(id); }
  };
}

// Stats d'une carte : { ok, rate, last, dernier: 1 | 0 }.
export function noterCarte(stats, id, ok, maintenant) {
  const x = stats[id] || { ok: 0, rate: 0 };
  stats[id] = { ok: x.ok + (ok ? 1 : 0), rate: x.rate + (ok ? 0 : 1), last: maintenant, dernier: ok ? 1 : 0 };
  return stats[id];
}

// Taux d'échec (0 à 1) ; null si jamais jouée.
export function difficulte(x) {
  return x && x.ok + x.rate ? x.rate / (x.ok + x.rate) : null;
}

// Les cartes les plus ratées d'une liste (au moins un raté), la plus difficile d'abord.
export function plusRatees(ids, stats, n = 10) {
  return ids.filter(id => stats[id] && stats[id].rate)
    .sort((a, b) => difficulte(stats[b]) - difficulte(stats[a]) || stats[b].rate - stats[a].rate)
    .slice(0, n);
}

// Record d'un paquet pour une durée : une partie gagnée bat toujours une partie non gagnée ;
// entre gagnées, le meilleur temps ; entre non gagnées, le plus d'OK.
export function meilleure(parties) {
  let best = null;
  for (const p of parties) {
    if (!best) { best = p; continue; }
    if (p.complet && !best.complet) best = p;
    else if (p.complet && best.complet && p.joue < best.joue) best = p;
    else if (!p.complet && !best.complet && p.ok > best.ok) best = p;
  }
  return best;
}

// Partie p meilleure que le record r ?
export function bat(p, r) {
  if (!r) return true;
  if (p.complet !== r.complet) return p.complet;
  return p.complet ? p.joue < r.joue : p.ok > r.ok;
}
