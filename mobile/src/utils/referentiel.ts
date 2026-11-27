// Renvoie les tailles de boîte possibles (ex. "B/30 ET B/90" → [30, 90])
export function taillesBoite(c: string): number[] {
  const s = (c ?? '').toUpperCase();
  if (/\b(ML|G|L)\b|\d\s?(ML|G)\b|^(FL|T|TUBE|POCHE|BIDON)/.test(s)) return [];
  const out: number[] = [];
  const re = /(?:B\/|BOITE DE\s*|BT\/|PILULIER\s*(?:DE|\/)\s*|FL\s*(?:DE\s*)?)(\d+)(?!\s*(?:ML|G))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const n = parseInt(m[1], 10);
    if (n > 1) out.push(n);
  }
  return [...new Set(out)];
}