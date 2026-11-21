// export type RendezVous = {
//   id: string;
//   when: string;
//   doctor: string;
//   reminder: string;
// };

// const rendezVous: RendezVous[] = [
//   { id: '1', when: '15 nov 10:30', doctor: 'Dr Benali, cardiologue', reminder: 'Rappel la veille à 18:00' },
//   { id: '2', when: '2 déc. 09:00', doctor: 'Dr Amrani, contrôle', reminder: 'Rappel 2h avant' },
// ];

// // Quand SQLite sera prêt, on remplacera seulement le contenu de cette fonction.
// export function getRendezVous(): RendezVous[] {
//   return rendezVous;
// }



export type RendezVous = {
  id: string;
  when: string;
  doctor: string;
  reminder: string;
};

export type Question = {
  id: string;
  text: string;
  done: boolean;
};

export type Note = {
  id: string;
  date: string;
  text: string;
};

const rendezVous: RendezVous[] = [
  { id: '1', when: '15 nov. 10:30', doctor: 'Dr Benali, cardiologue', reminder: 'Rappel la veille à 18:00' },
  { id: '2', when: '2 déc. 09:00', doctor: 'Dr Amrani, contrôle', reminder: 'Rappel 2h avant' },
];

const questions: Question[] = [
  { id: 'q1', text: 'Puis-je ajuster la dose le soir ?', done: false },
  { id: 'q2', text: 'Quels effets secondaires surveiller ?', done: false },
];

const notes: Note[] = [
  { id: 'n1', date: '3 nov.', text: 'Tension mesurée à la maison : à montrer au médecin' },
];

// Quand SQLite sera prêt, on remplacera seulement le contenu de ces fonctions.
export function getRendezVous(): RendezVous[] {
  return rendezVous;
}

export function getQuestionsGroup(): { title: string; items: Question[] } {
  return { title: 'À poser à Dr Benali · 15 nov.', items: questions };
}

export function getNotes(): Note[] {
  return notes;
}