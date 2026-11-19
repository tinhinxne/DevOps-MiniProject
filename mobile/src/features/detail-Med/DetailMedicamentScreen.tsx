import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { getMedicamentDetail } from './mock';

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

export function DetailMedicamentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const med = getMedicamentDetail(id);
  const progress = Math.round((med.dayCurrent / med.dayTotal) * 100);

  const handleDelete = () => {
    Alert.alert('Supprimer ce médicament ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        // TODO: supprimer en base (SQLite) quand elle sera prête
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={20} color={colors.brandDeep} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.title}>Détail du médicament</Text>
            <Text style={styles.subtitle}>{`Ordonnance du ${med.ordonnanceDate}`}</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.identity}>
            <View style={styles.pillBox}>
              <MaterialCommunityIcons name="pill" size={28} color={colors.brand} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medMeta}>{med.dosageForme}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{med.status}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Prises quotidiennes</Text>
          <View style={styles.doses}>
            {med.prises.map((p) => (
              <View key={p.id} style={styles.dose}>
                <Text style={styles.doseLabel}>{p.label}</Text>
                <Text style={styles.doseTime}>{`${p.time} · ${p.quantity}`}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Durée du traitement</Text>
            <Text style={styles.progressText}>{`Jour ${med.dayCurrent} sur ${med.dayTotal}`}</Text>
          </View>
          <ProgressBar percent={progress} color={colors.brandDeep} />
          <View style={styles.rowBetween}>
            <Text style={styles.small}>{`Début : ${med.startDate}`}</Text>
            <Text style={styles.small}>{`Fin : ${med.endDate}`}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Stock du médicament</Text>
          <Text style={styles.stockText}>{med.stockLabel}</Text>
          <ProgressBar percent={med.stockPercent} color={colors.success} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.instructions}>{med.instructions}</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.flex}>
          <Button
            title="Modifier"
            variant="outline"
            onPress={() => {
              // TODO: écran de modification
            }}
          />
        </View>
        <View style={styles.flex}>
          <Button title="Supprimer" variant="dangerOutline" onPress={handleDelete} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.modeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandDeep },
  subtitle: { fontSize: fontSize.sm, color: colors.textLabel },

  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDeep },

  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pillBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.tintSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandDeep },
  medMeta: { fontSize: fontSize.sm, color: colors.textLabel },
  badge: {
    backgroundColor: colors.tintMint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.successDeep },

  doses: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dose: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.tintSky,
  },
  doseLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  doseTime: { fontSize: 11, color: colors.textLabel },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.modeBorder, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  small: { fontSize: 12, color: colors.textLabel },
  stockText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  instructions: { fontSize: fontSize.sm, color: colors.textLabel, lineHeight: 20 },

  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
});