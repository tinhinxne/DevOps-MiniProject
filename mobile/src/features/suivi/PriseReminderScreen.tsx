import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';

// TODO: recevoir les params de la notif (useLocalSearchParams)
export function PriseReminderScreen() {
  const router = useRouter();
  const close = () => router.back();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.avatar}><Text style={styles.avatarText}>V</Text></View>
        <Text style={styles.title}>{"C'est l'heure de votre\nVitamine D3"}</Text>
        <Text style={styles.subtitle}>Prévu à 12:30. Avez-vous pris votre médicament ?</Text>

      <Card style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>Vitamine D3</Text>
              <Text style={styles.medDose}>1000 UI · 1 capsule</Text>
            </View>
            <View style={styles.badge}><Text style={styles.badgeText}>12:30</Text></View>
          </View>
          <View style={styles.sep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Avec un repas</Text>
            <Text style={styles.infoValue}>Oui</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock restant</Text>
            <Text style={styles.infoValue}>25 jours</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Confirmer la prise"
            variant="brand"
            onPress={close}
            rightIcon={<Ionicons name="checkmark" size={18} color={colors.white} />}
          />
          <Button title="Me le rappeler dans 30 min" variant="light" onPress={close} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.authBackground },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  avatar: {
    alignSelf: 'center', width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: fontSize.xl, fontWeight: '700' },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, color: colors.textSoft, textAlign: 'center' },
  card: { gap: spacing.sm, marginTop: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  medName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: fontSize.sm, color: colors.textSoft },
  badge: { backgroundColor: colors.tintBlue, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.modeBorder },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSoft },
  infoValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});