# Aide à la transcription d'une phrase entière (anglais américain, notation de l'appli) :
# mots pleins depuis CMUdict (tools/ipa_us.py), mots grammaticaux en forme faible,
# liaisons ‿ consonne → voyelle, flap t̬ entre voyelles par-dessus la frontière des mots.
# Usage : python3 tools/ipa_phrase.py "I could have told you." — À RELIRE À LA MAIN.
import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from ipa_us import toutes

FLAP = 't̬'
FAIBLES = {
  'a': 'ə', 'an': 'ən', 'the': 'ðə', 'to': 'tə', 'of': 'əv', 'and': 'ən', 'for': 'fɚ', 'from': 'frəm', 'at': 'ət',
  'as': 'əz', 'was': 'wəz', 'were': 'wɚ', 'are': 'ɚ', 'can': 'kən', 'could': 'kəd', 'would': 'wəd', 'should': 'ʃəd',
  'have': 'əv', 'has': 'həz', 'had': 'həd', 'been': 'bɪn', 'you': 'jə', 'your': 'jɚ', 'them': 'əm', 'him': 'ɪm',
  'her': 'ɚ', 'some': 'səm', 'than': 'ðən', 'but': 'bət', 'or': 'ɚ', 'i': 'aɪ', 'it': 'ɪt', 'is': 'ɪz', 'be': 'bi',
  'will': 'wɪl', 'we': 'wi', 'he': 'hi', 'she': 'ʃi', 'they': 'ðeɪ', 'there': 'ðɚ', 'that': 'ðət', 'do': 'də',
  'does': 'dəz', 'in': 'ɪn', 'on': 'ɑːn', 'with': 'wɪð', 'by': 'baɪ', 'my': 'maɪ', 'me': 'mi', 'us': 'əs', 'if': 'ɪf',
  "it's": 'ɪts', "i'm": 'aɪm', "i've": 'aɪv', "i'd": 'aɪd', "i'll": 'aɪl', "you're": 'jɚ', "we're": 'wɚ',
  "they're": 'ðɚ', "that's": 'ðæts', "there's": 'ðɚz', "he's": 'hiz', "she's": 'ʃiz', "we've": 'wiv', "they've": 'ðeɪv',
  "you've": 'jəv', "we'd": 'wid', "they'd": 'ðeɪd', "you'd": 'jəd', "he'd": 'hid', "she'd": 'ʃid', "we'll": 'wil',
  "you'll": 'jəl', "they'll": 'ðeɪl', "he'll": 'hil', "she'll": 'ʃil', "what's": 'wʌts', "let's": 'lets',
  "don't": 'doʊn', "can't": 'kænt', "won't": 'woʊnt', "didn't": 'dɪd.ənt', "doesn't": 'dʌz.ənt', "isn't": 'ˈɪz.ənt',
  "wasn't": 'ˈwʌz.ənt', "haven't": 'ˈhæv.ənt', "hadn't": 'ˈhæd.ənt', "wouldn't": 'ˈwʊd.ənt', "couldn't": 'ˈkʊd.ənt',
  "shouldn't": 'ˈʃʊd.ənt', "aren't": 'ɑːrnt', "weren't": 'wɝːnt'
}
VOY = 'aeiouɑɔəɚɝæʌɪʊ'

def mot_plein(m):
    p = toutes(m)
    if not p: return '<' + m + '?>'
    x = p[0]
    if 'ˈ' not in x and 'ˌ' not in x: x = 'ˈ' + x   # mot plein d'une syllabe : accentué dans la phrase
    return x

def transcrire(phrase):
    mots = re.findall(r"[A-Za-z']+", phrase.replace('’', "'"))
    ipa = [FAIBLES.get(m.lower()) or mot_plein(m.lower()) for m in mots]
    out = ''
    for k, x in enumerate(ipa):
        if k == 0: out = x; continue
        prev = out
        debut_voy = x.lstrip('ˈˌ')[:1] in VOY
        fin = prev[-1]
        if debut_voy and fin not in VOY and fin not in 'ːˈˌ.':
            if prev.endswith('t') and len(prev) > 1 and (prev[-2] in VOY + 'ːr'):
                prev = prev[:-1] + FLAP
            out = prev + '‿' + x
        else:
            out = prev + ' ' + x
    return out

if __name__ == '__main__':
    for a in sys.argv[1:]: print(transcrire(a))
