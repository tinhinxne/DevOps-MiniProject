// 'Petit-déj' / 'Déjeuner' / ... → enum du backend (PERSO si inconnu)
export function momentDepuisLabel(label: string) {
  const l = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (l.includes('reveil')) return 'REVEIL';
  if (l.includes('petit')) return 'PETIT_DEJ';
  if (l.includes('dejeuner')) return 'DEJEUNER';
  if (l.includes('diner')) return 'DINER';
  if (l.includes('coucher')) return 'COUCHER';
  return 'PERSO';
}

// Date locale → 'AAAA-MM-JJ' (évite le décalage de jour avec toISOString)
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;