import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme';
import { AppLogo } from './AppLogo';
import { GradientBox } from './GradiantBox';

export function BrandHeader() {
  return (
    <View style={styles.row}>
      <GradientBox
        from={colors.brandTileStart}
        to={colors.brandTileEnd}
        radius={radius.md}
        style={styles.tile}
      >
        <AppLogo size={36} />
      </GradientBox>
      <View>
        <Text style={styles.name}>Maw3idi</Text>
        <Text style={styles.tagline}>Votre santé, bien suivie.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandName },
  tagline: { fontSize: fontSize.sm, color: colors.aidant },
});