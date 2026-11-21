export type Gravite = 'jaune' | 'orange' | 'rouge';

export type Interaction = { gravite: Gravite; avec: string; message: string };

type Produit = { nom: string; dci?: string };

// ⚠️ DONNÉES DE DÉMONSTRATION : à remplacer par une source médicale validée.
const MARQUES: Record<string, string> = {
  doliprane: 'paracetamol',
  dafalgan: 'paracetamol',
  efferalgan: 'paracetamol',
  advil: 'ibuprofene',
  nurofen: 'ibuprofene',
  kardegic: 'aspirine',
  aspegic: 'aspirine',
  coumadine: 'warfarine',
  amoxiciline: 'amoxicilline',
};

const PAIRES: { a: string; b: string; gravite: Gravite; message: string }[] = [
  {
    a: 'warfarine',
    b: 'ibuprofene',
    gravite: 'rouge',
    message: 'Risque de saignement important. Ne pas associer sans avis médical.',
  },
  {
    a: 'warfarine',
    b: 'aspirine',
    gravite: 'rouge',
    message: 'Risque de saignement important. Ne pas associer sans avis médical.',
  },
  {
    a: 'ibuprofene',
    b: 'aspirine',
    gravite: 'orange',
    message: 'Risque accru de saignement digestif. Demandez conseil à votre pharmacien.',
  },
  {
    a: 'amoxicilline',
    b: 'allopurinol',
    gravite: 'jaune',
    message: 'Les éruptions cutanées sont plus fréquentes. Signalez toute réaction.',
  },
];

const ORDRE: Record<Gravite, number> = { rouge: 3, orange: 2, jaune: 1 };

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function substance(p: Produit): string {
  if (p.dci) return norm(p.dci);
  const n = norm(p.nom);
  return MARQUES[n] ?? n;
}

export function detecterInteractions(candidat: Produit, actuels: Produit[]): Interaction[] {
  const s = substance(candidat);
  const resultat: Interaction[] = [];

  for (const autre of actuels) {
    const t = substance(autre);
    if (t === s) {
      resultat.push({
        gravite: 'orange',
        avec: autre.nom,
        message: 'Même substance active déjà dans votre traitement : risque de surdosage.',
      });
      continue;
    }
    const regle = PAIRES.find((r) => (r.a === s && r.b === t) || (r.a === t && r.b === s));
    if (regle) resultat.push({ gravite: regle.gravite, avec: autre.nom, message: regle.message });
  }

  return resultat.sort((x, y) => ORDRE[y.gravite] - ORDRE[x.gravite]);
}