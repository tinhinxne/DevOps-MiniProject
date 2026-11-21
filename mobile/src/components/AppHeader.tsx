import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { NotifBell } from './NotifBell';

type Props = {
  onPressNotifications?: () => void;
};

export function AppHeader({ onPressNotifications }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Image
          source={require('../assets/images/logo-icon.png')}
          style={styles.icon}
          contentFit="contain"
        />
        <Image
          source={require('../assets/images/logo-wordmark.png')}
          style={styles.wordmark}
          contentFit="contain"
        />
      </View>
      <NotifBell unread onPress={onPressNotifications} />
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