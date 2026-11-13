import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme';
import type { IconName } from '../types';

type Tone = 'patient' | 'aidant';

const TONES: Record<Tone, { background: string; foreground: string }> = {
  patient: { background: colors.patientLight, foreground: colors.patient },
  aidant: { background: colors.aidantLight, foreground: colors.aidant },
};

type Props = {
  title: string;
  subtitle?: string;
  icon: IconName;
  tone?: Tone;
  onPress?: () => void;
  trailing?: ReactNode;
  isLast?: boolean;
};

export function MenuItem({
  title,
  subtitle,
  icon,
  tone = 'patient',
  onPress,
  trailing,
  isLast = false,
}: Props) {
  const palette = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>
      <View style={[styles.tile, { backgroundColor: palette.background }]}>
        <Ionicons name={icon} size={20} color={palette.foreground} />
      </View>

      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {trailing ?? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    minHeight: 64,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { opacity: 0.7 },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.sm + 1, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
});