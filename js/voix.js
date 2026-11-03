// Synthèse vocale du téléphone (Web Speech API). Lecture uniquement à la demande.
let voixDispo = [];
let langue = 'en-US';

export function initVoix(code) {
  langue = code;
  if (!('speechSynthesis' in window)) return;
  const maj = () => { voixDispo = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith(langue)); };
  maj();
  speechSynthesis.addEventListener?.('voiceschanged', maj);
}

export const voixListe = () => voixDispo.map(v => v.name);
export const voixOk = () => 'speechSynthesis' in window;

function choisir(nom) {
  if (nom) { const v = voixDispo.find(x => x.name === nom); if (v) return v; }
  return voixDispo.find(v => /google/i.test(v.name)) || voixDispo.find(v => v.localService) || voixDispo[0] || null;
}

export function dire(texte, { vitesse = 1, nom = '' } = {}) {
  if (!voixOk()) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = langue;
  const v = choisir(nom);
  if (v) u.voice = v;
  u.rate = vitesse;
  speechSynthesis.speak(u);
  return true;
}

export function taire() { if (voixOk()) speechSynthesis.cancel(); }
