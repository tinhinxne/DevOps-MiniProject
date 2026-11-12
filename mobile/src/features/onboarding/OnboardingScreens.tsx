import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../theme';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  step: number; // 0, 1, 2
  total?: number;
  buttonTitle: string;
  onNext: () => void;
  onSkip: () => void;
};

export function OnboardingSlide({
  eyebrow, title, description, step, total = 3, buttonTitle, onNext, onSkip,
}: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Header : logo + Passer */}
      <View style={styles.header}>
        <View style={styles.logo} /> {/* remplace par ton <Image /> logo */}
        <Pressable onPress={onSkip} hitSlop={12}>
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      {/* Illustration */}
      <View style={styles.illustration}>
        <View style={styles.ringOuter} />
        <View style={styles.ringInner} />
        <View style={styles.circle} />
        <View style={styles.card}>
          <View style={styles.clockBox}>
            <Feather name="clock" size={14} color={colors.brand} />
          </View>
          <View>
            <Text style={styles.cardLabel}>Prochaine prise</Text>
            <Text style={styles.cardTime}>08:30</Text>
          </View>
          <View style={styles.check}>
            <Feather name="check" size={12} color={colors.white} />
          </View>
        </View>
      </View>

      {/* Texte */}
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Bouton */}
      <View style={styles.footer}>
        <Button
          title={buttonTitle}
          onPress={onNext}
          variant="brand"
          rightIcon={<Feather name="arrow-right" size={18} color={colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4FAFA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand },
  skip: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },

  illustration: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8DCD9',
  },
  ringInner: {
    position: 'absolute', width: 230, height: 230, borderRadius: 115,
    borderWidth: 1, borderColor: '#CFE8E5',
  },
  circle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#D4EEE6' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    shadowColor: colors.text, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  clockBox: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#DCEFFA',
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 9, color: '#6B7C86' },
  cardTime: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  check: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#14A3A3',
    alignItems: 'center', justifyContent: 'center',
  },

  content: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  eyebrow: { fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.brand, marginBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: colors.brand, textAlign: 'center', marginBottom: spacing.sm },
  description: { fontSize: fontSize.sm, color: '#5B6B75', textAlign: 'center', lineHeight: 20 },

  dots: { flexDirection: 'row', gap: 6, marginTop: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5D9' },
  dotActive: { width: 20, backgroundColor: colors.brand },

  footer: { padding: spacing.lg },
});