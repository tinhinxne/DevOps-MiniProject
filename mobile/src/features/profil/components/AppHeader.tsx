import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  onPressNotifications?: () => void;
};

export function AppHeader({ onPressNotifications }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Image
          source={require('../../../assets/images/logo-icon.png')}
          style={styles.icon}
          contentFit="contain"
        />
        <Image
          source={require('../../../assets/images/logo-wordmark.png')}
          style={styles.wordmark}
          contentFit="contain"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={onPressNotifications}
        style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
        <Ionicons name="notifications-outline" size={20} color={colors.patient} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 36, height: 40 },
  wordmark: { width: 108, height: 32 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});