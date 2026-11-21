export type Prise = { id: string; label: string; time: string; quantity: string };

export type MedicamentDetail = {
  id: string;
  name: string;
  dosageForme: string;
  status: string;
  ordonnanceDate: string;
  prises: Prise[];
  dayCurrent: number;
  dayTotal: number;
  startDate: string;
  endDate: string;
  stockLabel: string;
  stockPercent: number;
  instructions: string;
};

const detail: MedicamentDetail = {
  id: '1',
  name: 'Amoxiciline',
  dosageForme: '500 mg · comprimé',
  status: 'En cours',
  ordonnanceDate: '01/01/2026',
  prises: [
    { id: 'p1', label: 'Matin', time: '08:00', quantity: '1 cp' },
    { id: 'p2', label: 'Midi', time: '13:00', quantity: '1 cp' },
    { id: 'p3', label: 'Soir', time: '20:00', quantity: '1 cp' },
  ],
  dayCurrent: 3,
  dayTotal: 7,
  startDate: '11/11/2026',
  endDate: '17/11/2026',
  stockLabel: '14 comprimés · environ 5 jours',
  stockPercent: 70,
  instructions:
    "À prendre pendant les repas avec un grand verre d'eau. Terminer le traitement même en cas d'amélioration.",
};

// Quand SQLite sera prêt, on remplacera seulement le contenu de cette fonction.
export function getMedicamentDetail(_id?: string): MedicamentDetail {
  return detail;
}