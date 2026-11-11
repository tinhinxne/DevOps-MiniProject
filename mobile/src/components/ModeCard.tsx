
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme';
import { GradientBox } from './GradiantBox';

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  selected: boolean;
  onPress: () => void;
};

export function ModeCard({ title, subtitle, icon, accent, selected, onPress }: Props) {
  const titleColor = selected ? accent : colors.textSoft;
  const subtitleColor = selected ? accent : colors.textSoft;

  const content = (
    <>
      <View style={styles.iconBubble}>
        <MaterialCommunityIcons name={icon} size={22} color={titleColor} />
      </View>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={styles.pressable}
    >
      {selected ? (
        <GradientBox
          from={colors.tintBlue}
          to={colors.tintGreen}
          radius={radius.md}
          style={[styles.card, { borderColor: accent }]}
        >
          {content}
        </GradientBox>
      ) : (
        <View style={[styles.card, styles.cardDefault]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  cardDefault: {
    backgroundColor: colors.card,
    borderColor: colors.modeBorder,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.modeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.md, fontWeight: '700' },
  subtitle: { fontSize: fontSize.sm },
});