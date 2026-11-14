

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo, Button, GradientBox } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';

export function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBox
      from={colors.brandStart}
      to={colors.brandEnd}
      style={styles.container}
    >
      <View style={styles.content}>
        <GradientBox
          from={colors.brandTileStart}
          to={colors.brandTileEnd}
          radius={radius.lg}
          style={styles.tile}
        >
          <AppLogo size={80} />
        </GradientBox>

        <Text style={styles.title}>Maw3idi</Text>
        <Text style={styles.tagline}>Votre santé, bien suivie.</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Commencer"
          variant="light"
          onPress={() => router.replace('/(auth)/onboarding/step-1')}
          rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.text} />}
        />
      </View>
    </GradientBox>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.brandMint,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.brandMint,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
});