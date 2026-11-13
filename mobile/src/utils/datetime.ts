const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const pad = (n: number) => String(n).padStart(2, '0');

// 15/11/2026
export function formatDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// 12:30
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 15 nov.
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

