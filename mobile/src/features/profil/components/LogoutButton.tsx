import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme';
import { profilExtras } from '../constants';

type Props = {
  onPress?: () => void;
};

export function LogoutButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Se déconnecter"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="log-out-outline" size={18} color={colors.danger} />
      <Text style={styles.label}>Se déconnecter</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: profilExtras.dangerSoft,
  },
  pressed: { opacity: 0.7 },
  label: { fontSize: fontSize.sm + 1, fontWeight: '700', color: colors.danger },
});