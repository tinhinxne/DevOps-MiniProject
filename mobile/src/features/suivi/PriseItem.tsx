import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';

export type PriseStatus = 'taken' | 'due' | 'late' | 'upcoming';

type Props = {
  time: string;
  period: string; // Matin / Midi / Soir
  name: string;
  dose: string;
  medColor: string;
  status: PriseStatus;
  statusText?: string; // ex. "Pris à 08:04"
  isLast?: boolean;
  children?: ReactNode; // boîte d'actions sous la prise
};

const STATUS_COLOR: Record<PriseStatus, string> = {
  taken: colors.success,
  due: colors.brand,
  late: colors.warning,
  upcoming: colors.neutral,
};

export function PriseItem({
  time, period, name, dose, medColor, status, statusText, isLast, children,
}: Props) {
  const c = STATUS_COLOR[status];
  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      <View style={styles.railCol}>
        <View style={[styles.node, { borderColor: c }, status === 'taken' && { backgroundColor: c }]}>
          {status === 'taken' ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={[styles.square, { backgroundColor: medColor }]} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.dose}>{dose}</Text>
        {statusText ? <Text style={[styles.status, { color: c }]}>{statusText}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  timeCol: { width: 48 },
  time: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  period: { fontSize: 10, color: colors.textSoft },
  railCol: { width: 20, alignItems: 'center' },
  node: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  line: { flex: 1, width: 1.5, backgroundColor: colors.modeBorder, marginVertical: 2 },
  body: { flex: 1, paddingBottom: spacing.lg, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  square: { width: 8, height: 8, borderRadius: 2 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dose: { fontSize: fontSize.sm, color: colors.textSoft },
  status: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});