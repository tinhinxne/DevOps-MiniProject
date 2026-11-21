export type Moment = { id: string; label: string; time: string };

export type ManualMedication = {
  id: string;
  name: string;
  dosage: string;
  forme: string;
  times: string[];
  frequence: string;
  durationDays: number;
  quantity: number;
  startDate: string;
  instructions: string;
};

export const FORMES = ['Comprimé', 'Gélule', 'Sirop', 'Sachet', 'Gouttes', 'Injection', 'Unité'];
// export const FREQUENCES = ['Tous les jours', 'Un jour sur deux', 'Une fois par semaine', 'Au besoin'];
export const FREQUENCES = ['Tous les jours', '1 jour sur 2', 'Chaque semaine', 'Au besoin'];

const habitMoments: Moment[] = [
  { id: 'reveil', label: 'Réveil', time: '07:00' },
  { id: 'petit-dej', label: 'Petit-déj.', time: '07:30' },
  { id: 'dejeuner', label: 'Déjeuner', time: '12:30' },
  { id: 'diner', label: 'Dîner', time: '20:00' },
  { id: 'coucher', label: 'Coucher', time: '23:00' },
];

const medications: ManualMedication[] = [];

// Quand SQLite sera prêt, on remplacera seulement le contenu de ces fonctions.
export function getHabitMoments(): Moment[] {
  return [...habitMoments];
}

export function addManualMedication(med: Omit<ManualMedication, 'id'>): void {
  medications.push({ ...med, id: Date.now().toString() });
}

export function getManualMedications(): ManualMedication[] {
  return [...medications];
}