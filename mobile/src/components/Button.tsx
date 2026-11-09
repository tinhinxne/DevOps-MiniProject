import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, primary ? styles.primary : styles.secondary, disabled && styles.disabled]}
    >
      <Text style={[styles.text, !primary && styles.textSecondary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.patient },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.patient },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  textSecondary: { color: colors.patient },
});