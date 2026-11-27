import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { hhmm } from '../utils/rappels';
import type { EtatDose, StatutSaisi } from '@/utils/rappels';

const BADGES: Record<EtatDose, { texte: string; fond: string; couleur: string }> = {
  PRIS: { texte: 'Pris', fond: colors.tintGreen, couleur: colors.success },
  OUBLIE: { texte: 'Oublié', fond: colors.tintDanger, couleur: colors.danger },
  EN_ATTENTE: { texte: 'À confirmer', fond: colors.tintWarning, couleur: '#92400E' },
  REPORTE: { texte: 'Reporté', fond: colors.tintBlue, couleur: colors.brand },
  A_VENIR: { texte: 'À venir', fond: colors.tintBlue, couleur: colors.brand },
};

export function BadgeEtat({ etat, reporteJusqua }: { etat: EtatDose; reporteJusqua?: Date }) {
  const b = BADGES[etat];
  const texte = etat === 'REPORTE' && reporteJusqua ? `Reporté · ${hhmm(reporteJusqua)}` : b.texte;
  return (
    <View style={[styles.badge, { backgroundColor: b.fond }]}>
      <Text style={[styles.badgeText, { color: b.couleur }]}>{texte}</Text>
    </View>
  );
}

function Bouton({
  label,
  icon,
  ok,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  ok?: boolean;
  onPress: () => void;
}) {
  const couleur = ok ? colors.success : colors.textSoft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.action, ok ? styles.actionOk : styles.actionNeutral]}>
      <Ionicons name={icon} size={14} color={couleur} />
      <Text style={[styles.actionText, { color: couleur }]}>{label}</Text>
    </Pressable>
  );
}

export function BoutonsPrise({ onAction }: { onAction: (s: StatutSaisi) => void }) {
  return (
    <View style={styles.actionsRow}>
      <Bouton label="Pris" icon="checkmark" ok onPress={() => onAction('PRIS')} />
      <Bouton label="Reporter" icon="time-outline" onPress={() => onAction('REPORTE')} />
      <Bouton label="Oublié" icon="close" onPress={() => onAction('OUBLIE')} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  actionOk: { backgroundColor: colors.tintGreen },
  actionNeutral: { backgroundColor: colors.tintBlue },
  actionText: { fontSize: 12, fontWeight: '600' },
});