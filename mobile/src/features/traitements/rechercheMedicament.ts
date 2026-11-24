import meds from '../../data/meds-dz.json';

export type RefMed = { id: string; n: string; g: string; f: string; d: string; c: string };
const REF = meds as RefMed[];

export type Detecte = {
  nom: string;
  dosage: string;
  posologie: string;
  lisible: boolean;
  match: RefMed | null;
};

// À mettre dans mobile/.env : EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
// (l'IP de ton PC, PAS localhost, sinon le téléphone ne trouve pas le serveur)
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

const sim = (a: string, b: string) =>
  a && b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 0;

export function trouverDansReferentiel(nom: string, dosage: string): RefMed | null {
  const q = norm(nom);
  if (q.length < 3) return null;
  const qMot = q.split(' ')[0];
  const dos = norm(dosage);

  let best: RefMed | null = null;
  let bestScore = 0;
  for (const m of REF) {
    const n = norm(m.n);
    const g = norm(m.g);
    let s = Math.max(sim(q, n), sim(q, g), sim(qMot, n.split(' ')[0]), sim(qMot, g.split(' ')[0]));
    if (n.startsWith(q) || g.startsWith(q)) s = Math.max(s, 0.9);
    if (dos && norm(m.d) === dos) s += 0.05; // même dosage = meilleur candidat
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return bestScore >= 0.8 ? best : null;
}

