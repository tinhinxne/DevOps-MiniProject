import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme';
import type { IconName, UsageMode } from '../types';

const OPTIONS: { value: UsageMode; label: string; icon: IconName }[] = [
  { value: 'patient', label: 'Patient', icon: 'person-outline' },
  { value: 'aidant', label: 'Aidant', icon: 'people-outline' },
];

type Props = {
  value: UsageMode;
  onChange: (mode: UsageMode) => void;
};

export function ModeSwitch({ value, onChange }: Props) {
  return (
    <View style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        const tint = selected ? colors.patient : colors.textMuted;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Ionicons name={option.icon} size={16} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  optionSelected: { backgroundColor: colors.card },
  label: { fontSize: fontSize.sm, fontWeight: '700' },
});