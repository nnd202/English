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

## 5. Révisions : l'algorithme « Brassage »

Première version : FSRS dictait l'ordre (cartes dues d'abord, 10 nouvelles par jour). À l'usage (5 novembre 2026), l'utilisateur revoyait les mêmes cartes toutes les trois cartes en fin de Sprint : une fois le quota de nouvelles et les cartes dues épuisés, la pioche tournait sur une poignée de cartes. Il a besoin de **brasser beaucoup de nouveauté**, avec des révisions régulières mais sans rigidité. D'où l'algorithme actuel (`js/tirage.js`) :

- **Part de nouveautés réglable** (60 % par défaut) : en Brassage, 6 cartes sur 10 sont jamais vues, réparties régulièrement dès le début de la partie. **Pas de plafond par jour**, sauf si on en fixe un dans les réglages.
- **Le reste est de la révision**, tirée au hasard parmi les cartes déjà vues, avec un poids qui favorise : les cartes à la mémoire la plus basse (rétention FSRS), les plus difficiles, les ratées ou difficiles la dernière fois ; et qui défavorise celles déjà revues aujourd'hui.
- **Aucune carte ne revient dans la même partie**, sauf une ratée, **une seule fois**, 8 à 12 cartes plus loin. Si tout le stock filtré a été vu, on reprend la carte vue il y a le plus longtemps.
- **FSRS reste le modèle de mémoire** (stabilité, difficulté, rétention, prochaine révision affichées dans la fiche et les stats), mais il ne dicte plus l'ordre.
- **Tirages** : Brassage (défaut, clé interne `melange` pour garder les records), Hasard (révision uniforme, même part de nouveautés), Révisions (cartes déjà vues uniquement), Nouvelles (jamais vues d'abord).
- **Difficulté estimée** pour les cartes jamais vues, d'après les cartes vues qui partagent les mêmes phénomènes (pastilles) et le même type.

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

Pastilles : `flap`, `glotte`, `liaison` seules (cible automatique : t̬, ʔ, ‿) ; sinon `type@m:zone` (dans le mot) ou `type@i:zone` (dans l'IPA), séparées par `;`. Puis `python3 tools/construire.py` régénère les JSON. `python3 tools/ipa_phrase.py "phrase…"` propose la transcription d'une phrase entière (formes faibles des mots grammaticaux, liaisons, flaps par-dessus la frontière des mots). `python3 tools/ipa_us.py mot…` propose une transcription à partir de CMUdict (`pip install cmudict`), convertie à la notation Cambridge (t̬, ɚ, ɝː, ɑː, syllabes, coup de glotte) : **toujours relire à la main**.

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

1. **Sprint** et cartes de prononciation : livré. 665 cartes (372 mots dont 121 de vocabulaire C1-C2, 91 combinaisons, 59 phrasal verbs, 95 phrases dont 50 C1-C2, 48 phrases-temps).
2. **Dictées** : livré (banque de phrases B1-C2, dictée surprise Wikipédia, histoires, texte collé, difficulté réglable). Voir § 13.
3. **Les temps** : livré. Voir § 14.
4. **Verbes irréguliers** : la grille à remplir façon Geoquiz (saisie libre ou curseur), avec l'IPA.
5. **Plus tard** : prépositions, faux amis, et ce qui viendra.

## 11. Design

Bleu roi franc (#3d63dd), grandes cartes blanches, coins très arrondis (24 à 28 px), ombres douces bleutées, en-têtes en dégradé bleu avec cercles en relief, bouton ▶ rond au centre de la barre du bas (il lance un Sprint avec les derniers réglages). Notes : Raté rouge doux, Difficile orange, Bien bleu, Facile vert. Conçu pour un téléphone de 360 à 384 px de large, tenu verticalement, boutons dans la zone du pouce. Icône : deux bulles « EN » blanches sur le dégradé bleu.

## 12. Leçons

- Le petit signe du flap (U+032C) est mal placé par certaines polices : il est dessiné en CSS (`.flap`).
- Une carte en attente de retour ne doit pas être piochée normalement, sinon le retour se perd.
- Le bouton retour d'Android pendant une partie : pause, pas sortie.
- Barre du navigateur mobile : les écrans de jeu (Sprint, dictée) sont fixés et calés sur `visualViewport` (hauteur visible, clavier déduit), et la page ne défile pas pendant le jeu. Sinon la barre se replie, la hauteur change et tout se décale.

## 13. Les dictées

L'écoute est le vrai point faible visé : entendre « whaddaya » et écrire « what do you ». On n'écrit **jamais** de forme fautive : le texte de référence est toujours correct. Inspiration : Daily Dictation (vraies voix humaines), dont l'audio ne peut pas être repris ; il est proposé en lien.

**Le problème du contenu** : un texte que l'on colle soi-même, on l'a déjà lu ; un petit stock s'épuise. D'où quatre sources :

1. **Nouvelle dictée (banque de phrases)** : environ 380 phrases écrites pour l'appli, classées B1, B2, C1, C2 et par thème (`data/dictees/banque-001.json`, fabriqué depuis `tools/sources/banque_*.txt`). Chaque dictée tire 4 à 10 phrases : surtout des phrases **jamais vues**, plus environ une sur quatre **ratée** auparavant (vue il y a plus d'un jour). Une phrase réussie à 100 % ne revient plus tant qu'il reste du neuf. Suivi par phrase dans `phrasesDictee` (passages, meilleure part de mots justes, date). On ajoute des phrases par lots, sans rien changer d'autre.
2. **Dictée surprise** : un résumé d'article de Wikipédia (article du jour ou au hasard, plusieurs essais si l'article est trop court), récupéré en direct par l'API publique de Wikipédia. Contenu infini et inconnu, registre écrit (plutôt C1). Parenthèses retirées ; **noms propres pardonnés** (comptés justes, soulignés en pointillé). Lien vers l'article et mention de la licence CC BY-SA au bilan. Rien n'est stocké dans le dépôt.
3. **Histoires** : 10 textes suivis, plutôt B1-B2.
4. **Texte collé** : découpé en phrases, gardé sur l'appareil seulement.

**Difficulté réglable dans les deux sens** (mémorisée) :

- niveau B1 à C2 ; nombre de phrases (4, 6, 8, 10) ;
- vitesse de lecture lente (0,75), normale, rapide (1,15) ; le bouton « Lent » reste toujours disponible ;
- écoutes illimitées, 3 par phrase ou une seule ;
- aides : **nombre de mots** (des tirets, un par mot) et **écouter par morceaux** (la phrase coupée à la ponctuation, les morceaux de plus de 9 mots coupés en deux ; chaque morceau compte comme une écoute).

**Déroulé** : phrase par phrase ; écouter, taper, Vérifier, puis la phrase suivante (réécoute possible après correction).

**Comparaison mot à mot** (plus longue sous-suite commune) : juste ; **orthographe** (le bon mot à une ou deux lettres près : orange) ; **faux** (autre mot : rouge) ; **oublié** (encadré pointillé) ; **en trop** (barré). Majuscules, ponctuation, accents, apostrophes typographiques et tirets sont pardonnés. Les contractions comptent (« I'm » ≠ « Im »).

**Bilan** : % de mots justes, détail par catégorie, temps, nombre d'écoutes, niveau et réglages, correction complète avec réécoute de chaque phrase. Stats : % par niveau. Une dictée compte pour la **série de jours** et le **temps cumulé**, pas pour les records du Sprint. Quitter en cours enregistre les phrases déjà vérifiées. Pas de pression ici : le chrono mesure seulement.

## 14. Les temps

Le but : **voir** le temps avant de le nommer, pour que le choix devienne automatique.

- **Les schémas** (`schema()` dans `js/temps.js`, SVG) : une frise past → now → future. Un **point** = action ponctuelle ; une **barre rayée** = action en cours, qui dure ; un **arc pointillé** d'un point vers « now » ou vers un **repère** (trait orange) = action terminée mais reliée à ce moment (aspect parfait) ; des **points répétés** = habitude (présent simple). Les 12 temps ont chacun leur schéma, sans ambiguïté.
- **Placer sur la frise** : une phrase, le verbe surligné, quatre schémas au choix (deux de la même époque, un du même aspect : les confusions classiques).
- **Conjuguer** (variante inverse) : le schéma et la phrase à trous avec le verbe à l'infinitif ; on écrit la forme. Contractions acceptées dans les deux sens (*'ll / will*, *hadn't / had not*…).
- **La grille des 12 temps** : époques en lignes, aspects en colonnes ; on touche la case du temps de la phrase. La même grille, avec schéma, forme et règle de chaque temps, sert de fiche de révision.
- Séries de 10 questions ; les phrases ratées lors des 3 dernières séries reviennent en priorité (un tiers au plus). Correction immédiate : nom anglais et français, forme, règle en une ligne.
- Contenu : `data/temps.json` (12 temps, 60 phrases, 5 par temps ; le verbe entre crochets). Comptent pour la série de jours et le temps cumulé ; stats : % de justes et temps qui résistent.

## 15. Les decks (6 novembre 2026)

L'utilisateur cherche encore sa façon idéale d'apprendre ; les decks sont un **mode à part**, qui ne touche ni au Sprint ni à FSRS.

- **Un deck = un paquet fixe** de 45 à 63 cartes (`data/decks.json`, fabriqué par `tools/construire.py` : chaque groupe est mélangé une fois pour toutes puis découpé). On le parcourt **en entier, une carte après l'autre** ; la position est gardée (on reprend où on s'est arrêté) ; chaque passage complet est un **tour**.
- **Ordre** : toujours le même (défaut) ou mélangé à chaque tour (stable pendant le tour).
- **Après chaque carte** : Facile · Moyen · Dur (défaut) ou « Suivant » seulement. La note ne sert qu'à **repérer les cartes dures** : chaque carte a une **moyenne récente** (0 facile, 1 moyen, 2 dur ; moyenne mobile 60/40, pour qu'une carte maîtrisée redescende).
- **Rabâcher les dures** : par deck (« Que les dures ») ou tous decks confondus (« Les plus dures », 40 cartes au plus, moyenne ≥ 0,8, la plus dure d'abord). En fin de tour, le bilan propose de rabâcher les dures de la série.
- Les decks : Vocabulaire C1-C2 (2), Phrases C1-C2, Les temps en phrases, Combinaisons (2), Phrasal verbs, Phrases courantes, Pièges de prononciation (4). Une barre par deck montre la répartition des dernières notes.
- **Phrases-temps** (type `temps`) : une phrase par temps en contexte ; le verso montre le **schéma de frise** du temps, son nom et sa forme, pour associer la sonorité à l'image mentale.
- Les parties de deck comptent pour la série de jours, les cartes du jour et le temps cumulé (historique : « Deck »), pas pour les records du Sprint. Évaluations et progression sont dans la sauvegarde (`decks`), fusionnées à l'import.
- Le niveau visé est B2 au minimum, surtout C1-C2 (C2 est le niveau le plus haut du cadre européen) : les prochains lots iront dans ce sens.

## 16. Le Sprint par paquets (6 novembre 2026) : le cœur actuel

Le Sprint devient **le concept de l'appli** ; ce sont les thèmes (paquets) qui changent. Inspiration directe de Geoquiz : réussir tout le paquet dans un temps donné. Les anciens outils (Sprint classique, Brassage, decks, dictées, exercices des temps, mode libre) restent accessibles en bas de l'accueil, repliés sous « Autres outils ».

**Règles du jeu** (`js/paquet.js`) :
- Un paquet de 20 à 40 cartes tourne **en boucle**, dans l'ordre ou dans un **ordre au hasard tiré au démarrage** et gardé jusqu'à la fin de la partie.
- **OK** : la carte sort de la boucle. **Raté** : elle reste et revient au tour suivant. Notation binaire volontaire : c'est réussi ou c'est raté ; la répétition des réponses donne la nuance.
- **Gagné** quand toutes les cartes sont OK ; sinon, au gong, le score est le nombre d'OK. Durées : 5, 10, 15, 20 min ou Libre (chrono qui monte).
- **Records** par paquet et par durée : une partie gagnée bat toujours une partie non gagnée ; entre gagnées, le meilleur temps ; sinon, le plus d'OK. Pas de garde-fou : l'utilisateur joue honnête.
- **Plus de FSRS ici** : chaque réponse alimente seulement les stats de la carte (`paquets.stats` : ok, rate, dernier résultat), d'où la difficulté (taux d'échec) et « les plus ratées » par paquet.
- **Recto au choix** : le texte, ou l'audio (gros bouton Écouter ; on écoute, on répète, on retourne).

**La carte épurée** : recto = le mot ou la phrase ; verso = IPA US (Cambridge, t̬, ‿, ʔ), Écouter / Lent / Sens (définition courte en aide + Cambridge, Merriam-Webster, YouGlish, Forvo, PlayPhrase), légende des symboles. Plus de pastilles. Puis Raté / OK.

**Les paquets** (`data/paquets.json`, fabriqué par `python3 tools/construire_paquets.py` depuis `tools/sources/paquets/*.txt`) :
- **Vocabulaire et phrases** : chaque paquet a une **identité** (une « voix » de l'anglais américain), et mélange mots, expressions, phrasal verbs et phrases. *Le bureau* (anglais de l'entreprise), *Le débat* (nuancer, argumenter), *Entre amis* (le familier des natifs ; orthographe standard, la réduction s'entend dans l'IPA, la forme écrite familière en note). 40 cartes chacun.
- **Phrasal verbs** (à l'essai) : *Du soutenu au naturel* (phrase au verbe soutenu → la redire avec le phrasal verb) ; *Particules* (phrase à trou → la particule, avec sa logique : up = achèvement / hausse, out = jusqu'au bout…).
- **Temps** (à l'essai) : *Paires de temps* (deux phrases qui ne diffèrent que par le temps + une question ; au verso, le schéma de chacune et l'explication).

**Métadonnées** : chaque carte porte des `tags` (catégorie, registre, phénomènes de prononciation détectés dans l'IPA, particule, temps) pour une future analyse de ce qui résiste le plus.

**Format des sources** (une ligne par carte, champs séparés par `|`) :
- vocabulaire : `cat | texte | ipa | aide (sens en anglais) | exemple | note` (cat : mot, expr, phrasal, phrase) ;
- soutenu : `phrase avec [verbe soutenu] | réponse | ipa | aide` ;
- particules : `phrase avec ___ | particule | ipa | logique` ;
- paires : `phrase A (temps) | phrase B (temps) | question | a ou b | explication` (temps : identifiants de `data/temps.json`).

**À propos du flap** : t̬ n'existe pas en un seul caractère Unicode ; c'est un t suivi du signe combinant U+032C. Les données le stockent ainsi (exactement ce qu'on obtient par copier-coller). Seul l'affichage est corrigé en CSS, car beaucoup de polices placent mal ce signe. ɾ (le « petit r ») est le symbole IPA du flap chez les linguistes, mais Cambridge écrit t̬ : on garde t̬.
