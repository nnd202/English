# Construit les lots JSON à partir des fichiers texte de tools/sources/.
# Usage : python3 tools/construire.py   (depuis la racine du dépôt)
import json, re, sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'tools', 'sources')
AUTO = {'flap':'t̬','glotte':'ʔ','liaison':'‿'}
def slug(s): return re.sub(r'-+','-',re.sub(r"[^a-z0-9]+",'-',s.lower().replace("'",''))).strip('-')[:40]
def pastilles(spec, ou):
    out=[]
    for x in [y.strip() for y in spec.split(';') if y.strip()]:
        if '@' in x:
            t,rest=x.split('@',1); k,v=rest.split(':',1)
            out.append({'t':t, 'mot' if k=='m' else 'ipa': v})
        elif x in AUTO: out.append({'t':x,'ipa':AUTO[x]})
        else: sys.exit(f'pastille sans cible: {x} ({ou})')
    return out
def lignes(f):
    for l in open(os.path.join(SRC, f), encoding='utf8'):
        l=l.rstrip('\n')
        if l.strip() and not l.startswith('#'): yield [c.strip() for c in l.split('|')]
def ecrire(nom, titre, cartes):
    json.dump({'lot':nom,'titre':titre,'date':'2026-11-03','cartes':cartes}, open(os.path.join(RACINE, 'data', 'lots', f'{nom}.json'),'w',encoding='utf8'), ensure_ascii=False, indent=1)
    print(nom, len(cartes))

c=[]
for m,ipa,d,ex,p in lignes('mots_002.txt'):
    c.append({'id':'m-'+slug(m),'type':'mot','texte':m,'ipa':ipa,'def':d,'ex':ex,'p':pastilles(p,m)})
SUF={'(nom)':'n','(verbe)':'v','(adjectif)':'adj','(nom : le métal)':'n','(nom : une larme)':'n','(verbe : déchirer)':'v'}
for m,note,ipa,d,ex,p in lignes('paires_002.txt'):
    c.append({'id':f'm-{slug(m)}-{SUF[note]}','type':'mot','texte':m,'note':note,'ipa':ipa,'def':d,'ex':ex,'lemme':m,'p':pastilles(p,m)})
ecrire('lot-002','Mots : lettres muettes, orthographe trompeuse, accent, flaps, -ed, paires nom/verbe',c)
for fic,nom,typ,pre,titre in [('combis_003.txt','lot-003','combi','c-','Combinaisons : formes faibles, liaisons, réductions'),
                               ('phrasal_004.txt','lot-004','phrasal','p-','Phrasal verbs courants')]:
    c=[]
    for t,ipa,d,ex,lem,p in lignes(fic):
        c.append({'id':pre+slug(t),'type':typ,'texte':t,'ipa':ipa,'def':d,'ex':ex,'lemme':lem,'p':pastilles(p,t)})
    ecrire(nom,titre,c)
c=[]
for t,ipa,d,p in lignes('phrases_005.txt'):
    c.append({'id':'f-'+slug(t),'type':'phrase','texte':t,'ipa':ipa,'def':d,'p':pastilles(p,t)})
ecrire('lot-005','Phrases courtes de la vie courante',c)

# Banque de phrases de dictée (tirées au hasard par niveau)
b = []
for niv in ['b1', 'b2', 'c1', 'c2']:
    k = 0
    for theme, phrase in lignes(f'banque_{niv}.txt'):
        k += 1
        b.append({'id': f'{niv}-{k:03d}', 'niveau': niv.upper(), 'theme': theme, 'texte': phrase})
json.dump({'lot': 'banque-001', 'titre': 'Banque de phrases B1 à C2', 'date': '2026-11-03', 'banque': b},
          open(os.path.join(RACINE, 'data', 'dictees', 'banque-001.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('banque-001', len(b), {n: sum(1 for x in b if x['niveau'] == n) for n in ['B1', 'B2', 'C1', 'C2']})
