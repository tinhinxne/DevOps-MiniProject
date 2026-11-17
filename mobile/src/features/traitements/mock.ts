export type Ordonnance = {
  id: string;
  delivreeLe: string;
  expireLe: string;
  statut: 'active' | 'ancienne';
  photoUri?: string;
};

export type Medicament = {
  id: string;
  ordonnanceId: string;
  nom: string;
  dosage: string;
  posologie: string;
  prises: { matin: boolean; midi: boolean; soir: boolean };
  duree: string;
  statut: 'en-cours' | 'bientot-fini';
  stock?: number;
  teinte: 'bleu' | 'vert' | 'violet';
};

export const ordonnances: Ordonnance[] = [
  { id: 'o1', delivreeLe: '01/01/2026', expireLe: '09/11/2026', statut: 'active' },
  { id: 'o2', delivreeLe: '15/08/2026', expireLe: '13/11/2026', statut: 'ancienne' },
  { id: 'o3', delivreeLe: '15/08/2026', expireLe: '13/11/2026', statut: 'ancienne' },
  { id: 'o4', delivreeLe: '15/08/2026', expireLe: '13/11/2026', statut: 'ancienne' },
];

export const medicaments: Medicament[] = [
  {
    id: 'm1',
    ordonnanceId: 'o1',
    nom: 'Amoxiciline',
    dosage: '500 mg',
    posologie: '3 fois par jour (matin, midi, soir) pendant 7 jours',
    prises: { matin: true, midi: true, soir: false },
    duree: 'Pendant 7 jours',
    statut: 'en-cours',
    teinte: 'bleu',
  },
  {
    id: 'm2',
    ordonnanceId: 'o1',
    nom: 'Paracétamol',
    dosage: '500 mg',
    posologie: 'Si besoin',
    prises: { matin: true, midi: true, soir: true },
    duree: 'Pendant 7 jours',
    statut: 'en-cours',
    teinte: 'vert',
  },
  {
    id: 'm3',
    ordonnanceId: 'o1',
    nom: 'Doliprane',
    dosage: '500 mg',
    posologie: 'Matin, midi et soir',
    prises: { matin: true, midi: true, soir: true },
    duree: 'Pendant 7 jours',
    statut: 'bientot-fini',
    stock: 4,
    teinte: 'violet',
  },
];