# Aide à la transcription : python3 tools/ipa_us.py mot1 mot2 (pip install cmudict). À relire à la main.
"""CMUdict (ARPAbet) -> IPA américaine façon Cambridge (t̬, ɚ, ɝː, ɑː, syllabes, accents)."""
import cmudict, re
D = cmudict.dict()
FLAP = 't̬'
VOY = {'AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW'}
CONS = {'B':'b','CH':'tʃ','D':'d','DH':'ð','F':'f','G':'ɡ','HH':'h','JH':'dʒ','K':'k','L':'l','M':'m','N':'n','NG':'ŋ',
        'P':'p','R':'r','S':'s','SH':'ʃ','T':'t','TH':'θ','V':'v','W':'w','Y':'j','Z':'z','ZH':'ʒ'}
ONSETS = set('''b d f ɡ h dʒ k l m n p r s ʃ t tʃ θ ð v w j z ʒ
bl br dr dw fl fr ɡl ɡr kl kr kw pl pr sk skr skw sl sm sn sp spl spr st str sw tr tw θr ʃr fj hj kj mj pj bj vj t\u032c ʔ'''.split())
LAX = {'ɪ','e','æ','ʌ','ʊ'}

def voyelle(p, st, suiv, final):
    if p=='AA': return 'ɑː'
    if p=='AE': return 'æ'
    if p=='AH': return 'ə' if st=='0' else 'ʌ'
    if p=='AO': return 'ɔː' if suiv=='R' else 'ɑː'
    if p=='AW': return 'aʊ'
    if p=='AY': return 'aɪ'
    if p=='EH': return 'e'
    if p=='ER': return 'ɚ' if st=='0' else 'ɝː'
    if p=='EY': return 'eɪ'
    if p=='IH': return 'ɪ'
    if p=='IY': return 'i' if st=='0' and (final or suiv in VOY) else 'iː'
    if p=='OW': return 'oʊ'
    if p=='OY': return 'ɔɪ'
    if p=='UH': return 'ʊ'
    if p=='UW': return 'u' if st=='0' and suiv in VOY else 'uː'

def transcrire(arpa):
    ph=[]  # (symbole, est_voyelle, accent)
    n=len(arpa)
    for i,a in enumerate(arpa):
        m=re.match(r'([A-Z]+)(\d?)',a); p,st=m.group(1),m.group(2)
        if p=='IY' and st=='2' and i==n-1: st='0'
        suiv=re.sub(r'\d','',arpa[i+1]) if i+1<n else None
        if p in VOY:
            ph.append([voyelle(p,st,suiv,i==n-1),True,st])
        else:
            ph.append([CONS[p],False,None])
    # r après voyelle : ɑːr, ɪr, er, ʊr, ɔːr (CMU : IH R / EH R...) ; ER garde ɚ/ɝː
    # flap / coup de glotte
    for i,(s,v,st) in enumerate(ph):
        if s=='t' and 0<i<len(ph)-1:
            prev=ph[i-1]; nxt=ph[i+1]
            prev_ok = prev[1] or prev[0] in ('r','n') and i>=2 and ph[i-2][1]
            if prev_ok and nxt[1] and nxt[2]=='0':
                if nxt[0]=='ə' and i+2<len(ph) and ph[i+2][0]=='n' and (i+3==len(ph) or not ph[i+3][1]) and prev[0]!='n':
                    ph[i][0]='ʔ'
                elif nxt[0]=='ɚ' or prev[0]!='n' or nxt[0] in ('i','ə','ɪ','oʊ'):
                    ph[i][0]=FLAP
    # syllabes
    noyaux=[i for i,p in enumerate(ph) if p[1]]
    debuts=[0]
    for k in range(1,len(noyaux)):
        a,b=noyaux[k-1],noyaux[k]
        cons=[ph[j][0] for j in range(a+1,b)]
        # attaque maximale
        cut=len(cons)
        for c in range(len(cons)+1):
            att=''.join(cons[c:])
            if att=='' or att in ONSETS: cut=c; break
        # voyelle brève accentuée devant : garder une consonne en coda
        if ph[a][0] in LAX and ph[a][2] in ('1','2') and cut==0 and cons: cut=1
        if ph[a][0] in LAX and cut==0 and len(cons)==1 and ph[b][2]=='0': cut=1
        debuts.append(a+1+cut)
    out=''
    for k,d in enumerate(debuts):
        f=debuts[k+1] if k+1<len(debuts) else len(ph)
        syl=''.join(p[0] for p in ph[d:f])
        st=ph[noyaux[k]][2]
        mark='ˈ' if st=='1' else ('ˌ' if st=='2' else '')
        sep='' if k==0 or mark else '.'
        out+=sep+mark+syl
    if len(noyaux)==1: out=out.replace('ˈ','')
    out=re.sub(r'^ˌ([^.ˈˌ]*)ˈ', r'\1ˈ', out)
    return out

def ipa(mot, idx=0):
    p=D.get(mot.lower())
    if not p: return None
    return transcrire(p[min(idx,len(p)-1)])

def toutes(mot):
    return [transcrire(p) for p in D.get(mot.lower(),[])]

if __name__=='__main__':
    import sys
    for w in sys.argv[1:]: print(w, toutes(w))
