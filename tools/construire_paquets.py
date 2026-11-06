# Construit data/paquets.json à partir de tools/sources/paquets/*.txt
# Usage : python3 tools/construire_paquets.py   (depuis la racine du dépôt)
import json, os, re
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'tools', 'sources', 'paquets')
FLAP = 't̬'

def lignes(f):
    for l in open(os.path.join(SRC, f), encoding='utf8'):
        l = l.rstrip('\n')
        if l.strip() and not l.startswith('#'):
            yield [c.strip() for c in l.split('|')]

def phon(ipa):
    out = []
    if FLAP in ipa: out.append('flap')
    if '‿' in ipa: out.append('liaison')
    if 'ʔ' in ipa: out.append('glotte')
    if re.search(r'ˈ(ɡʌ|wɑː)\.nə|ˈlem\.i|ˈɡɑː\.t̬ə|tʃə|dʒə|ˈkaɪn\.də|dəˈnoʊ', ipa): out.append('reduction')
    return out

paquets = []

def deck_cartes(fichier, pid, prefixe, titre, accroche, reg, groupe):
    cartes = []
    for k, champs in enumerate(lignes(fichier), 1):
        champs += [''] * (6 - len(champs))
        cat, texte, ipa, aide, ex, note = champs[:6]
        c = {'id': f'{prefixe}-{k:02d}', 'cat': cat, 'texte': texte, 'ipa': ipa, 'aide': aide,
             'tags': {'cat': cat, 'reg': reg, 'phon': phon(ipa)}}
        if ex: c['ex'] = ex
        if note: c['note'] = note
        cartes.append(c)
    paquets.append({'id': pid, 'groupe': groupe, 'genre': 'cartes', 'titre': titre, 'accroche': accroche, 'cartes': cartes})

deck_cartes('bureau.txt', 'bureau', 'bu', 'Le bureau', 'L\'anglais de l\'entreprise américaine, celui des réunions et des e-mails.', 'professionnel', 'Vocabulaire et phrases')
deck_cartes('debat.txt', 'debat', 'de', 'Le débat', 'Nuancer, argumenter, contredire avec élégance.', 'soutenu', 'Vocabulaire et phrases')
deck_cartes('amis.txt', 'amis', 'am', 'Entre amis', 'L\'anglais américain du quotidien, celui des natifs.', 'familier', 'Vocabulaire et phrases')

c = []
for k, (recto, texte, ipa, aide) in enumerate(lignes('soutenu.txt'), 1):
    lemme = aide.split(' =')[0].strip()
    # La réponse marque le phrasal verb entre crochets (surligné au verso) ; texte = version propre.
    c.append({'id': f'so-{k:02d}', 'recto': recto, 'reponse': texte, 'texte': texte.replace('[', '').replace(']', ''), 'ipa': ipa, 'aide': aide, 'lemme': lemme,
              'tags': {'cat': 'phrasal', 'reg': 'courant', 'phon': phon(ipa)}})
paquets.append({'id': 'soutenu', 'groupe': 'Phrasal verbs', 'genre': 'soutenu', 'titre': 'Du soutenu au naturel',
                'accroche': 'Une phrase au verbe soutenu : redis-la avec le phrasal verb d\'un natif.', 'cartes': c})

c = []
for k, (recto, part, ipa, aide) in enumerate(lignes('particules.txt'), 1):
    avant = recto.split('___')[0].split()
    lemme = (avant[-1] if avant else '') + ' ' + part
    c.append({'id': f'pa-{k:02d}', 'recto': recto, 'particule': part, 'texte': recto.replace('___', part), 'ipa': ipa,
              'aide': aide, 'lemme': lemme, 'tags': {'cat': 'particule', 'particule': part, 'phon': phon(ipa)}})
paquets.append({'id': 'particules', 'groupe': 'Phrasal verbs', 'genre': 'particules', 'titre': 'Particules',
                'accroche': 'Retrouve la particule, et sa logique : up, out, off, down…', 'cartes': c})

c = []
for k, (a, b, q, rep, aide) in enumerate(lignes('paires.txt'), 1):
    ma, mb = re.match(r'(.*) \((\w+)\)$', a), re.match(r'(.*) \((\w+)\)$', b)
    c.append({'id': f'tp2-{k:02d}', 'a': ma.group(1), 'ta': ma.group(2), 'b': mb.group(1), 'tb': mb.group(2),
              'question': q, 'rep': rep, 'aide': aide, 'texte': ma.group(1), 'tags': {'cat': 'temps', 'temps': [ma.group(2), mb.group(2)]}})
paquets.append({'id': 'paires-temps', 'groupe': 'Temps', 'genre': 'paires', 'titre': 'Paires de temps',
                'accroche': 'Deux phrases, un seul temps qui change : laquelle dit quoi ?', 'cartes': c})

json.dump({'paquets': paquets}, open(os.path.join(RACINE, 'data', 'paquets.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print([(p['titre'], len(p['cartes'])) for p in paquets])
