import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

// TODO : remplacer ces données d'exemple par les vraies données (profil + historique des prises des 30 derniers jours)
const report = {
  patient: 'Sara Amrani',
  period: '15 mai – 13 juin 2025',
  generatedAt: '14 juin 2025 à 09:30',
  stats: { adherence: 92, taken: 109, missed: 9, postponed: 4 },
  summary: 'Bonne observance globale. Les prises du soir présentent davantage d\u2019oublis.',
  treatments: [
    { name: 'Metformine 500 mg', detail: '66 prises · 2 oublis', rate: 97 },
    { name: 'Amlodipine 5 mg', detail: '28 prises · 2 oublis', rate: 93 },
    { name: 'Vitamine D 1000 UI', detail: '15 prises · 5 oublis', rate: 83 },
  ],
  weeks: [
    { label: 'Semaine 1', rate: 89 },
    { label: 'Semaine 2', rate: 94 },
    { label: 'Semaine 3', rate: 96 },
    { label: 'Semaine 4', rate: 93 },
  ],
  alerts: [
    '5 prises de Vitamine D oubliées, principalement après le déjeuner.',
    '2 prises de Metformine reportées de plus de deux heures.',
    'Aucun effet indésirable déclaré pendant la période.',
  ],
};

const TEAL = '#0E9F8E';
const BLUE = '#0B8DC4';
const ORANGE = '#D9772B';
const AMBER = '#A8731A';

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export default function ReportPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onExport = () => {
    // TODO : générer le PDF (expo-print) puis le partager (expo-sharing)
  };

  return (
    <View style={styles.root}>
      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Aperçu du rapport</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}>
        {/* Feuille du rapport */}
        <View style={styles.paper}>
          {/* Titre */}
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <View style={styles.titleLine}>
                <Text style={styles.brand}>1 sur 1</Text>
                <Text style={styles.brandSub}> Ma santé</Text>
              </View>
              <Text style={styles.madeBy}>Réalisé par Mon1sur1</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaBold}>Patient : </Text>
                  {report.patient}
                </Text>
                <Text style={styles.metaText}>
                  <Text style={styles.metaBold}>Période du rapport : </Text>
                  {report.period}
                </Text>
                <Text style={styles.metaText}>
                  <Text style={styles.metaBold}>Généré le : </Text>
                  {report.generatedAt}
                </Text>
              </View>
            </View>
            <View style={styles.logo}>
              <Ionicons name="medical" size={26} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.disclaimer}>
            Ce rapport est généré à partir des prises enregistrées dans l’application. Il présente
            une synthèse de l’observance et ne remplace pas l’avis d’un professionnel de santé.
          </Text>

          {/* Synthèse */}
          <SectionTitle>Synthèse de l’observance</SectionTitle>
          <View style={styles.statsRow}>
            <Stat value={`${report.stats.adherence}%`} label="Observance" color={TEAL} />
            <Stat value={`${report.stats.taken}`} label="Bien prises" color={BLUE} />
            <Stat value={`${report.stats.missed}`} label="Oubliées" color={ORANGE} />
            <Stat value={`${report.stats.postponed}`} label="Reportées" color={AMBER} />
          </View>
          <View style={styles.note}>
            <Text style={styles.noteText}>{report.summary}</Text>
          </View>

          {/* Détail des traitements */}
          <SectionTitle>Détail des traitements</SectionTitle>
          <View style={styles.treatments}>
            {report.treatments.map((t) => (
              <View key={t.name} style={styles.treatment}>
                <Text style={styles.treatmentName}>{t.name}</Text>
                <Text style={styles.treatmentDetail}>{t.detail}</Text>
                <View style={styles.barRow}>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${t.rate}%` }]} />
                  </View>
                  <Text style={styles.rate}>{t.rate}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Évolution */}
          <SectionTitle>Évolution sur les 4 dernières semaines</SectionTitle>
          <View style={styles.weeksRow}>
            {report.weeks.map((w) => (
              <View key={w.label} style={styles.weekCard}>
                <View style={styles.weekChartArea}>
                  <View style={[styles.weekBar, { height: `${w.rate}%` }]} />
                </View>
                <View style={styles.weekFooter}>
                  <Text style={styles.weekLabel}>{w.label}</Text>
                  <Text style={styles.weekRate}>{w.rate}%</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Points d'attention */}
          <SectionTitle>Points d’attention pour le médecin</SectionTitle>
          <View style={styles.alerts}>
            {report.alerts.map((a) => (
              <View key={a} style={styles.alertRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.alertText}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Pied de page */}
          <View style={styles.paperFooter}>
            <Text style={styles.footerText}>Document confidentiel – Données déclarées par le patient</Text>
            <Text style={styles.footerBrand}>mon1sur1.app</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bouton Exporter */}
      <View style={[styles.exportHolder, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]}
          onPress={onExport}
          accessibilityRole="button">
          <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
          <Text style={styles.exportText}>Exporter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  content: { padding: spacing.md },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleText: { flex: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'baseline' },
  brand: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  brandSub: { fontSize: 18, fontWeight: '800', color: BLUE },
  madeBy: { fontSize: 8, color: BLUE, marginTop: 2 },
  meta: { marginTop: 12, gap: 4 },
  metaText: { fontSize: 9, color: '#334155' },
  metaBold: { fontWeight: '700', color: '#0F172A' },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#CBD5E1', marginVertical: 14 },
  disclaimer: { fontSize: 8, lineHeight: 12, color: '#64748B' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 18, marginBottom: 10 },

  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 7, color: '#64748B', marginTop: 4 },

  note: { marginTop: 10, backgroundColor: '#E3F4EC', borderRadius: 6, padding: 10 },
  noteText: { fontSize: 8, color: '#1F7A4D' },

  treatments: { gap: 14 },
  treatment: { gap: 2 },
  treatmentName: { fontSize: 9, fontWeight: '700', color: '#0F172A' },
  treatmentDetail: { fontSize: 7, color: '#64748B' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: TEAL },
  rate: { fontSize: 9, fontWeight: '800', color: TEAL, minWidth: 28, textAlign: 'right' },

  weeksRow: { flexDirection: 'row', gap: 8 },
  weekCard: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 6, padding: 6 },
  weekChartArea: { height: 40, justifyContent: 'flex-end' },
  weekBar: { width: '100%', borderRadius: 4, backgroundColor: '#8ED8C0' },
  weekFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  weekLabel: { fontSize: 6, color: '#64748B' },
  weekRate: { fontSize: 6, fontWeight: '700', color: '#0F172A' },

  alerts: { gap: 6 },
  alertRow: { flexDirection: 'row', gap: 6 },
  bullet: { fontSize: 8, color: '#475569' },
  alertText: { flex: 1, fontSize: 8, lineHeight: 12, color: '#475569' },

  paperFooter: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: '#94A3B8' },
  footerBrand: { fontSize: 6, fontWeight: '700', color: BLUE },

  exportHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  exportBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.logoBlue,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.logoBlue,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  exportText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});