# English — logique de l'appli et esprit à conserver

Ce document accompagne le code. Il explique **pourquoi** l'appli est faite ainsi, pour qu'une personne (ou une IA) qui reprend le projet comprenne la démarche et puisse continuer, ou l'adapter à une autre langue, sans en perdre l'esprit.

Ouvert le 3 novembre 2026. Application personnelle d'un francophone de bon niveau qui apprend l'anglais américain.

---

## 1. L'idée de départ

Avec Anki, réviser 1000 mots en voyant le mot écrit au recto, puis l'IPA américaine (flaps notés) et l'audio au verso, a fait faire un bond en prononciation. English reprend cette expérience, en mieux :

- **plus que des mots isolés** : des combinaisons de mots qui ont du sens (*could afford*, *figure it out*), des phrasal verbs et des phrases courtes, pour travailler l'**enchaînement** (liaisons, formes faibles, réductions) et la **compréhension à l'oral** ;
- **pas de paquets à gérer** : un seul stock, des filtres si besoin ;
- **le sens à portée de main**, sans quitter l'appli : une définition courte et des liens directs vers les bons dictionnaires ;
- **un jeu** plutôt qu'une corvée.

Le but n'est pas d'apprendre des règles, mais que leur **application devienne automatique** : on finit par savoir sans se souvenir de la règle.

## 2. Le cœur : le Sprint

Le jeu phare est un **contre-la-montre** : en 5, 10, 15 ou 20 minutes, passer le plus de cartes possible. Les 15 minutes quotidiennes ne sont plus « à tenir » mais un défi : « je n'ai que 15 minutes pour en faire un maximum ».

- On lit le recto, on **prononce à voix haute**, on retourne, on écoute si besoin, on se note.
- **Score = nombre de cartes passées**, jamais le nombre de réussites. La note donnée n'a donc aucun effet sur le score : on n'a jamais intérêt à se noter trop gentiment. La pression vient de la vitesse, l'honnêteté de la notation est préservée. C'est essentiel si l'appli est prêtée : le système ne doit pas reposer sur la bonne foi.
- Le détail des notes (Facile, Bien, Difficile, Raté) est un **sous-score discret**, toujours affiché.
- Une carte **ratée revient** 4 à 6 cartes plus loin et **compte de nouveau** quand elle repasse (marquée « retour »). Se noter Raté ne coûte donc rien au score : seulement le temps passé.
- **Éjecter** (« trop facile, ne plus montrer ») retire la carte du stock pour toujours (réversible depuis l'écran Cartes). Elle **ne compte pas** dans le score : « x cartes exclues ».
- **Records** par durée et par tirage, sur les parties **complètes** seulement. Terminer avant la fin enregistre la partie, hors record.
- **Pause** : arrête le chrono et masque la carte. Le bouton retour du téléphone met en pause au lieu de quitter.
- Ouvrir la définition ou un lien **fait partie du jeu** : le chrono continue. Prendre du temps sur une carte est une information, que les stats reflètent (« celles qui prennent du temps »).

**Mode libre** : mêmes cartes, sans chrono ni record, pour prendre son temps. Les réponses comptent quand même pour la mémoire (FSRS) et le temps cumulé.

## 3. La carte

- **Recto** : le mot ou la combinaison, écrit normalement. Rien d'autre.
- **Verso** : l'IPA en grand ; boutons **Écouter**, **Lent**, **Sens**. L'audio n'est **jamais lu automatiquement**.
- **Notation** : l'IPA américaine du **Cambridge Dictionary** (le flap s'écrit **t̬**), pour retrouver les mêmes signes hors de l'appli. Merriam-Webster n'utilise pas l'IPA. Deux signes de l'oral enchaîné s'ajoutent, que Cambridge ne note pas : **‿** (liaison) et **ʔ** (coup de glotte).
- **Légende contextuelle** : sous la carte, seulement les signes présents, chacun avec un mot repère (« æ cat · t̬ water »). Les symboles évidents (p, b, t…) sont masqués par défaut. Un toucher ouvre la légende complète. À force de la voir, elle s'ancre.
- **Pastilles** : sous l'IPA, elles nomment les phénomènes (Flap T, Liaison, Forme faible, Réduction, Élision, Assimilation, Coup de glotte, Accent mobile, Lettre muette, Piège). Un toucher surligne la zone concernée dans l'IPA ou dans le mot, et affiche la règle en deux lignes. Elles peuvent être masquées dans les réglages, une fois devenues inutiles.
- **Sens** (bouton « ? ») : une définition courte en anglais, un exemple d'usage, puis des liens qui s'ouvrent directement sur le mot : **Cambridge**, **Merriam-Webster**, **YouGlish** (le mot dans de vraies vidéos), **Forvo** (prononcé par des natifs), **PlayPhrase** (extraits de films, idéal pour les expressions). Le bouton retour du téléphone ramène sur la carte.
- **La voix** est celle du téléphone (synthèse vocale en-US), gratuite et disponible hors ligne. Les voix récentes font naturellement flaps et liaisons, y compris sur les combinaisons.

## 4. Le contenu

- **Mots** : pas de mots ultra-basiques (*you*, *the*) ; des mots fréquents **dont la prononciation piège** (*often*, *women*, *comfortable*, *Wednesday*) et des mots moins fréquents mais utiles. Le bouton Éjecter rattrape ce qui serait trop simple.
- **Combinaisons** : un **stock fini et choisi**, jamais généré au hasard. Chacune doit avoir un **sens** et un **phénomène oral** à travailler (*could afford* oui, *shoes perhaps* non). Le texte est toujours correctement orthographié : la forme réduite n'apparaît que dans l'IPA.
- **Phrasal verbs** : de préférence avec leur objet (*figure it out*, *pick it up*), là où l'enchaînement se joue.
- **Phrases courtes** : 5 à 10 mots de la vie courante, transcrites en entier avec leurs liaisons.
- Les définitions sont **écrites pour l'appli** (jamais copiées d'un dictionnaire). Le dépôt est public : aucun texte protégé, aucune donnée personnelle.

## 5. Révisions : FSRS + hasard + timer

- **FSRS-4.5** (paramètres par défaut, rétention visée 90 %) calcule pour chaque carte sa stabilité, sa difficulté et sa date de révision.
- **Toutes les réponses comptent, quel que soit le mode.** Une révision « trop tôt » (hasard, retour dans la partie) est gérée par FSRS : la stabilité bouge à peine. Le mode hasard ne fausse donc pas le modèle.
- **Le timer règle l'accumulation** : la séance dure le temps choisi, quoi qu'il arrive. Il n'y a jamais de pile à finir, seulement une file où l'on pioche dans le meilleur ordre.
- **Tirage « Mélange »** (défaut) : d'abord les cartes **en danger d'oubli** (rétention la plus basse), une **nouvelle carte toutes les 4**, puis du **hasard pondéré par la difficulté** quand tout le reste est épuisé.
- **Autres tirages** : Hasard (toutes les cartes vues + le quota de nouvelles), À revoir, Nouvelles. Filtres par type (mots, combinaisons, phrasal verbs, phrases).
- **Quota de nouvelles par jour** (10 par défaut) : le seul garde-fou, car chaque nouvelle carte crée des révisions futures. Il est divisé par deux au-delà d'un seuil de retard (60 cartes à revoir), et coupé au double.
- **Difficulté estimée** pour les cartes jamais vues, d'après les cartes vues qui partagent les mêmes phénomènes (pastilles) et le même type. L'appli apprend peu à peu ce qui est dur sur tout le stock.

## 6. Stats

Comme dans Geoquiz : série de jours (et record), cartes du jour, **temps cumulé**. Records par durée et tirage, 14 derniers jours, stock (vues, bien ancrées, à revoir, éjectées), répartition des notes, cartes les plus dures, cartes qui prennent du temps, historique des parties. Chaque carte a sa fiche (passages, difficulté, temps moyen, mémoire, prochaine révision, oublis).

## 7. Architecture

Une **web app installable (PWA)**, hébergée sur GitHub Pages, sans serveur, sans framework, sans compilation : du JavaScript simple servi tel quel. Les données personnelles restent dans le navigateur du téléphone (`localStorage`).

| Fichier | Rôle |
| --- | --- |
| `index.html`, `css/app.css` | Page unique et design |
| `js/app.js` | Interface : écrans, partie, bilan, stats, cartes, réglages, export |
| `js/fsrs.js` | Algorithme FSRS (pur) |
| `js/tirage.js` | Choix des cartes pendant une partie, quota, difficulté estimée (pur) |
| `js/store.js` | État local, séries, records, fusion d'import (calculs purs) |
| `js/ipa.js` | Découpage IPA, légende contextuelle, zones à surligner (pur) |
| `js/voix.js` | Synthèse vocale |
| `js/dictee.js` | Dictées : découpage en phrases, comparaison mot à mot (pur) |
| `data/langue.json` | **Tout ce qui dépend de la langue** : symboles et légende, pastilles et règles, liens, voix |
| `data/lots.json` + `data/lots/*.json` | Les cartes, par lots |
| `data/dictees/*.json` | Les textes de dictée, par lots (listés dans `lots.json`, clé `dictees`) |
| `tools/sources/*.txt`, `tools/construire.py`, `tools/ipa_us.py` | Fabrication des lots (voir § 8) |
| `sw.js` | Hors ligne (réseau d'abord, cache en secours). Tout nouveau fichier va dans `CORE` |
| `tools/check.mjs` | Vérification : `node tools/check.mjs` |

**Sauvegarde** : fichier `AAAAMMJJ - Export English.txt` (du JSON en .txt, car le menu de partage d'Android refuse les .json), envoyé par le menu de partage (Proton Drive, Drive…). L'import **fusionne** sans doublon : le même fichier sert à passer du téléphone au PC. Rappel tous les N jours.

## 8. Ajouter du contenu

Tout ce qui s'apprend vit dans des **lots** ; le code ne change pas.

**Fabrication (recommandée)** : les lots 002 à 005 sont écrits dans des fichiers texte simples, une carte par ligne, dans `tools/sources/` :

```
mot | ipa | définition | exemple | pastilles                       (mots_*.txt)
mot | (nom) | ipa | définition | exemple | pastilles              (paires_*.txt)
texte | ipa | définition | exemple | lemme | pastilles            (combis_*.txt, phrasal_*.txt)
texte | ipa | usage | pastilles                                   (phrases_*.txt)
```

Pastilles : `flap`, `glotte`, `liaison` seules (cible automatique : t̬, ʔ, ‿) ; sinon `type@m:zone` (dans le mot) ou `type@i:zone` (dans l'IPA), séparées par `;`. Puis `python3 tools/construire.py` régénère les JSON. `python3 tools/ipa_us.py mot…` propose une transcription à partir de CMUdict (`pip install cmudict`), convertie à la notation Cambridge (t̬, ɚ, ɝː, ɑː, syllabes, coup de glotte) : **toujours relire à la main**.

**Directement en JSON** :

1. Créer `data/lots/lot-00X.json` sur le modèle de `lot-001.json`.
2. L'ajouter à `data/lots.json` et à la liste `CORE` de `sw.js`.
3. Lancer `node tools/check.mjs` : identifiants uniques, champs présents, chaque symbole IPA présent dans la légende, chaque pastille qui surligne bien quelque chose.

**Une dictée** : `{ "id": "d-…", "titre": "…", "genre": "Récit", "phrases": ["…", "…"] }` dans un fichier de `data/dictees/`. Le texte est découpé à l'avance en phrases, toujours correctement écrites. Pas de chiffres : on écrit les nombres en lettres (« five forty »).

Une carte :

```json
{ "id": "p-figure-it-out", "type": "phrasal", "texte": "figure it out",
  "ipa": "ˈfɪɡ.jɚ‿ɪt̬‿aʊt",
  "def": "Find the answer or understand something by thinking.",
  "ex": "Don't worry, we'll figure it out.",
  "lemme": "figure out",
  "p": [{ "t": "liaison", "ipa": "‿" }, { "t": "flap", "ipa": "t̬" }] }
```

- `id` : **stable à vie** (la progression y est rattachée). Préfixes : `m-` mot, `c-` combinaison, `p-` phrasal verb, `f-` phrase.
- `type` : `mot`, `combi`, `phrasal`, `phrase`.
- `ipa` : sans barres obliques ; `ɡ` (IPA, pas le g latin), `ː` (pas les deux-points).
- `lemme` (facultatif) : la forme cherchée dans les dictionnaires (*figure out* pour *figure it out*).
- `note` (facultatif) : entre parenthèses, elle s'affiche sous le mot (« (verbe) ») ; sinon, dans le panneau Sens.
- `p` : pastilles. `ipa` ou `mot` désigne la zone à surligner : une sous-chaîne (toutes ses occurrences), ou le texte entier avec la zone entre crochets (`"veg[e]table"`).

## 9. Adapter à une autre langue

Le moteur (Sprint, FSRS, tirage, stats, sauvegarde, rendu des cartes) ne dépend pas de la langue. Pour une autre langue :

1. **`data/langue.json`** : code de voix (`fr-FR`, `es-ES`…), symboles IPA avec mots repères, pastilles et leurs règles, liens (Larousse, CNRTL ou Le Robert pour le français ; RAE pour l'espagnol), noms des types.
2. **Le contenu** : de nouveaux lots. C'est le gros du travail.
3. **Les phénomènes changent** :
   - français : liaisons obligatoires, facultatives ou interdites, enchaînements, e muet ;
   - espagnol : la prononciation se lit presque à l'écrit, les cartes IPA servent moins ; la conjugaison devient le terrain principal.
4. **Le rendu spécial du flap** (`ipaHtml` dans `app.js`) est propre à l'anglais : à retirer ou à remplacer.
5. Les textes de l'interface sont en français, dans `app.js`.

## 10. Feuille de route

1. **Sprint** et cartes de prononciation : livré. 446 cartes (251 mots, 91 combinaisons, 59 phrasal verbs, 45 phrases).
2. **Dictées** : livré. Voir § 13.
3. **Verbes irréguliers** : la grille à remplir façon Geoquiz (saisie libre ou curseur), avec l'IPA.
4. **Timeline des temps** : une frise avec « maintenant » et un point de référence ; placer l'événement au doigt (point, durée close, action en cours qui traverse le repère) ; correction superposée avec le nom du temps. Variante inverse : conjuguer d'après le schéma. Grille des 12 temps en mode clic.
5. **Plus tard** : prépositions, faux amis, et ce qui viendra.

## 11. Design

Bleu roi franc (#3d63dd), grandes cartes blanches, coins très arrondis (24 à 28 px), ombres douces bleutées, en-têtes en dégradé bleu avec cercles en relief, bouton ▶ rond au centre de la barre du bas (il lance un Sprint avec les derniers réglages). Notes : Raté rouge doux, Difficile orange, Bien bleu, Facile vert. Conçu pour un téléphone de 360 à 384 px de large, tenu verticalement, boutons dans la zone du pouce. Icône : deux bulles « EN » blanches sur le dégradé bleu.

## 12. Leçons

- Le petit signe du flap (U+032C) est mal placé par certaines polices : il est dessiné en CSS (`.flap`).
- Une carte en attente de retour ne doit pas être piochée normalement, sinon le retour se perd.
- Le bouton retour d'Android pendant une partie : pause, pas sortie.
- Barre du navigateur mobile : les écrans de jeu (Sprint, dictée) sont fixés et calés sur `visualViewport` (hauteur visible, clavier déduit), et la page ne défile pas pendant le jeu. Sinon la barre se replie, la hauteur change et tout se décale.

## 13. Les dictées

L'écoute est le vrai point faible visé : entendre « whaddaya » et écrire « what do you ». On n'écrit **jamais** de forme fautive : le texte de référence est toujours correct.

- **Textes** : ceux de l'appli (par lots, écrits en anglais américain naturel, riches en liaisons et formes réduites : message vocal, dialogue, récit, actualité, météo, podcast), ou un texte **collé** (article, livre libre de droits, réplique), découpé automatiquement en phrases et gardé sur l'appareil seulement.
- **Déroulé** : phrase par phrase. Écouter (ou Lent) autant de fois que voulu, taper, Vérifier, puis la phrase suivante.
- **Comparaison mot à mot** (plus longue sous-suite commune) : juste ; **orthographe** (le bon mot à une ou deux lettres près : orange) ; **faux** (autre mot : rouge) ; **oublié** (encadré pointillé) ; **en trop** (barré). Majuscules, ponctuation, accents, apostrophes typographiques et tirets sont pardonnés. Les contractions comptent (« I'm » ≠ « Im »).
- **Bilan** : % de mots justes, détail par catégorie, temps, nombre d'écoutes, correction complète avec réécoute de chaque phrase. Meilleur score affiché à côté de chaque texte.
- Une dictée compte pour la **série de jours** et le **temps cumulé**, pas pour les records du Sprint. Quitter en cours enregistre les phrases déjà vérifiées.
- Le chrono mesure seulement : pas de pression ici, l'écoute demande du calme.
