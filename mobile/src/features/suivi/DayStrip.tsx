import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius } from '../../theme';

const LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Props = { selected: Date; onSelect: (d: Date) => void };

export function DayStrip({ selected, onSelect }: Props) {
  // Lundi de la semaine de la date sélectionnée
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const active = d.toDateString() === selected.toDateString();
        return (
          <Pressable key={i} onPress={() => onSelect(d)} style={[styles.day, active && styles.dayActive]}>
            <Text style={[styles.letter, active && styles.textActive]}>{LETTERS[i]}</Text>
            <Text style={[styles.num, active && styles.textActive]}>{d.getDate()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md, gap: 4 },
  dayActive: { backgroundColor: colors.brand },
  letter: { fontSize: 11, color: colors.textSoft },
  num: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  textActive: { color: colors.white },
});