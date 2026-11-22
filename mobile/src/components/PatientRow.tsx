import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';
import { LIENS, type Patient } from '@/utils/api';

// Couleurs d'avatar, attribuées de façon stable selon l'identifiant du patient
const TONES = [
  { bg: colors.tintBlue, fg: colors.brand },
  { bg: colors.tintGreen, fg: colors.aidant },
  { bg: colors.tintViolet, fg: colors.violet },
];

const toneFor = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return TONES[sum % TONES.length];
};

export const lienLabel = (p: Patient) => {
  if (p.lien === 'AUTRE' && p.lien_precision) return p.lien_precision;
  return LIENS.find((l) => l.value === p.lien)?.label ?? '';
};

export const initials = (p: Patient) =>
  `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();

type Props = {
  patient: Patient;
  detail?: string; // ligne secondaire facultative (ex. prochain médicament)
  onPress?: () => void;
};

export default function PatientRow({ patient, detail, onPress }: Props) {
  const tone = toneFor(patient.id);
  const relation = lienLabel(patient);

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row} accessibilityRole="button">
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.initials, { color: tone.fg }]}>{initials(patient)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {patient.prenom} {patient.nom}
          {relation ? <Text style={styles.relation}> · {relation}</Text> : null}
        </Text>
        {detail ? (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: fontSize.sm, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: fontSize.sm + 1, fontWeight: '700', color: colors.text },
  relation: { fontSize: fontSize.xs, fontWeight: '400', color: colors.textMuted },
  detail: { fontSize: fontSize.xs + 1, color: colors.textMuted, marginTop: 2 },
});