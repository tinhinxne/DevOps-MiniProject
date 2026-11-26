
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Card, GradientBox } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  getMyProfile,
  getSelectedPatient,
  listerRendezVous,
  type RendezVousApi,
  type SelectedPatient,
} from '../../utils/api';
import { formatShortDate, formatTime } from '../../utils/datetime';
import { NotifBell } from '../../components/NotifBell';

// ---- Données de démo (à remplacer par la vraie source plus tard) ----
type Med = {
  id: string;
  letter: string;
  name: string;
  dose: string;
  time: string;
  bg: string;
  fg: string;
  taken?: boolean;
  next?: boolean;
};

const MEDS: Med[] = [
  { id: '1', letter: 'M', name: 'Metformine', dose: '500 mg · 1 comprimé', time: '08:00', bg: colors.tintBlue, fg: colors.brand, taken: true },
  { id: '2', letter: 'V', name: 'Vitamine D3', dose: '1000 UI · 1 gélule', time: '12:30', bg: '#FEF3C7', fg: colors.warning, taken: true },
  { id: '3', letter: 'A', name: 'Atorvastatine', dose: '20 mg · 1 comprimé', time: '20:00', bg: '#EDE9FE', fg: '#7C3AED', next: true },
];

type Period = 'week' | 'month';
type Stats = {
  label: string;
  correct: number;
  missed: number;
  postponed: number;
  confirmed: number[];
  total: number[];
};

const STATS: Record<Period, Stats> = {
  week: {
    label: 'Cette semaine',
    correct: 23, missed: 2, postponed: 0,
    confirmed: [55, 60, 58, 72, 80, 92],
    total: [70, 70, 72, 75, 78, 80],
  },
  month: {
    label: 'Ce mois',
    correct: 92, missed: 8, postponed: 2,
    confirmed: [62, 70, 66, 78, 85, 90],
    total: [75, 76, 78, 80, 82, 85],
  },
};

const STREAK_DAYS = 7;
const MAX_RDV_ACCUEIL = 3;

// ---- Petits composants internes ----
function Donut({ value }: { value: number }) {
  const size = 84;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.donut}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.tintGreen} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.success}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`}
        />
      </Svg>
      <Text style={styles.donutText}>{value}%</Text>
    </View>
  );
}

function Sparkline({ data, color, dashed }: { data: number[]; color: string; dashed?: boolean }) {
  const w = 150;
  const h = 56;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / 100) * h}`)
    .join(' ');
  return (
    <Polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray={dashed ? '4 4' : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable hitSlop={8} onPress={onPress}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ActionButton({ label, icon, tone }: { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'ok' | 'neutral' }) {
  const ok = tone === 'ok';
  return (
    <Pressable style={[styles.action, ok ? styles.actionOk : styles.actionNeutral]}>
      <Ionicons name={icon} size={14} color={ok ? colors.success : colors.textSoft} />
      <Text style={[styles.actionText, { color: ok ? colors.success : colors.textSoft }]}>{label}</Text>
    </Pressable>
  );
}

function MedItem({ med }: { med: Med }) {
  return (
    <Card style={styles.medCard}>
      <View style={styles.medRow}>
        <View style={[styles.avatar, { backgroundColor: med.bg }]}>
          <Text style={[styles.avatarText, { color: med.fg }]}>{med.letter}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.medNameRow}>
            <Text style={styles.medName}>{med.name}</Text>
            {med.taken && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Pris</Text>
              </View>
            )}
          </View>
          <Text style={styles.medDose}>{med.dose}</Text>
        </View>
        <Text style={styles.medTime}>{med.time}</Text>
      </View>

      {med.next && (
        <>
          <View style={styles.actionsRow}>
            <ActionButton label="Pris" icon="checkmark" tone="ok" />
            <ActionButton label="Reporter" icon="time-outline" tone="neutral" />
            <ActionButton label="Oublié" icon="close" tone="neutral" />
          </View>
          <View style={styles.reminder}>
            <Text style={styles.reminderText}>Rappel prévu dans 20 minutes</Text>
          </View>
        </>
      )}
    </Card>
  );
}

// ---- Écran ----
export function HomeScreen() {
  const router = useRouter();
  const [suivi, setSuivi] = useState<SelectedPatient | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [rdvs, setRdvs] = useState<RendezVousApi[]>([]);

  // À chaque retour sur l'écran : patient suivi, prénom, prochains rdv
  useFocusEffect(
    useCallback(() => {
      let active = true;

      getSelectedPatient().then((p) => {
        if (active) setSuivi(p);
      });

      getMyProfile()
        .then((p) => {
          if (active) setFirstName(p.prenom);
        })
        .catch(() => {
          // non connecté ou serveur injoignable : on garde « Bonjour » tout court
        });

     listerRendezVous()
  .then((r) => {
    if (!active) return;
    const maintenant = Date.now();
    const aVenir = r
      .filter((x) => new Date(x.dateRdv).getTime() >= maintenant)
      .sort((a, b) => new Date(a.dateRdv).getTime() - new Date(b.dateRdv).getTime());
    setRdvs(aVenir.slice(0, MAX_RDV_ACCUEIL));
  })
  .catch(() => {
    if (active) setRdvs([]);
  });
  

      return () => {
        active = false;
      };
    }, [])
  );

  const [period, setPeriod] = useState<Period>('week');
  const [pickerOpen, setPickerOpen] = useState(false);
  const s = STATS[period];
  const rate = Math.round((s.correct / (s.correct + s.missed + s.postponed)) * 100);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>
              {suivi ? 'Vous suivez' : firstName ? `Bonjour ${firstName}` : 'Bonjour'}
            </Text>
            <Text style={styles.title}>
              {suivi ? `${suivi.prenom} ${suivi.nom}` : 'Votre journée'}
            </Text>
            {suivi && (
              <Pressable hitSlop={8} onPress={() => router.push('/patient-suivi')}>
                <Text style={styles.sectionAction}>Changer de patient ›</Text>
              </Pressable>
            )}
          </View>
          {/* unread garde le petit point rouge (enlève-le pour ne plus l'afficher). */}
          <NotifBell unread onPress={() => {}} />
        </View>

        {/* Carte dégradée : prises à venir */}
        <GradientBox
          from={colors.brandStart}
          to={colors.brandEnd}
          radius={radius.lg}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroDate}>Mardi 24 juin</Text>
              <Text style={styles.heroTitle}>2 prises à venir</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.white} />
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '33%' }]} />
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroSmall}>1 sur 3 prises</Text>
            <Text style={styles.heroSmall}>33%</Text>
          </View>
        </GradientBox>

        {/* Observance */}
        <Card style={styles.card}>
          <View style={styles.obsHeader}>
            <View style={styles.obsTitleRow}>
              <View style={styles.smallIcon}>
                <Ionicons name="stats-chart-outline" size={14} color={colors.brand} />
              </View>
              <Text style={styles.cardTitle}>Mon observance</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setPickerOpen((o) => !o)}>
              <Text style={styles.period}>{s.label} {pickerOpen ? '▴' : '▾'}</Text>
            </Pressable>
          </View>

          {pickerOpen && (
            <View style={styles.periodRow}>
              {(Object.keys(STATS) as Period[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => { setPeriod(p); setPickerOpen(false); }}
                  style={[styles.periodChip, p === period && styles.periodChipActive]}
                >
                  <Text style={[styles.periodChipText, p === period && styles.periodChipTextActive]}>
                    {STATS[p].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.obsBody}>
            <View style={styles.donutCol}>
              <Donut value={rate} />
              <View style={styles.streak}>
                <Ionicons name="flame" size={12} color={colors.warning} />
                <Text style={styles.streakText}>Série : {STREAK_DAYS} jours sans oubli</Text>
              </View>
            </View>
            <View style={styles.flex}>
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={styles.legendText}>Prises confirmées</Text>
                <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                <Text style={styles.legendText}>Total</Text>
              </View>
              <Svg width={150} height={56}>
                <Sparkline data={s.total} color={colors.border} dashed />
                <Sparkline data={s.confirmed} color={colors.success} />
              </Svg>
              <View style={styles.counters}>
                <Text style={[styles.counter, { color: colors.success }]}>
                  {s.correct} correcte{s.correct > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.counter, { color: colors.danger }]}>
                  {s.missed} oubli{s.missed > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.counter, { color: colors.textSoft }]}>
                  {s.postponed} reportée{s.postponed > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Prochains rendez-vous (3 max) */}
        <SectionHeader
          title="Prochains rendez-vous"
          action="Voir tout ›"
          onPress={() => router.push('/rdv-notes')}
        />
        {rdvs.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.apptDoc}>Aucun rendez-vous à venir</Text>
          </Card>
        ) : (
          rdvs.map((r) => {
            const d = new Date(r.dateRdv);
            return (
              <Card key={r.id} style={styles.card}>
                <Pressable style={styles.apptRow} onPress={() => router.push('/rdv-notes')}>
                  <View style={styles.smallIcon}>
                    <Ionicons name="calendar-outline" size={16} color={colors.brand} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.apptDate}>
                      {formatShortDate(d)} · {formatTime(d)}
                    </Text>
                  

                    <Text style={styles.apptDoc}>
                      {[r.medecin, r.specialite].filter(Boolean).join(' · ') || 'Médecin non précisé'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </Card>
            );
          })
        )}

        {/* Prises du jour */}
        <SectionHeader title="Prises du jour" action="Voir l'historique" />
        <View style={styles.medList}>
          {MEDS.map((m) => (
            <MedItem key={m.id} med={m} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.authBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontSize: fontSize.sm, color: colors.textSoft },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  bell: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 9, right: 10, width: 8, height: 8,
    borderRadius: 4, backgroundColor: colors.danger,
  },

  hero: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, marginTop: 2 },
  heroIcon: {
    width: 32, height: 32, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.white },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  heroSmall: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },

  card: { padding: spacing.md, borderRadius: radius.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  smallIcon: {
    width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.tintBlue,
    alignItems: 'center', justifyContent: 'center',
  },

  obsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  obsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  period: { fontSize: 12, color: colors.brand, fontWeight: '600' },
  obsBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  donutCol: { alignItems: 'center', gap: 4 },
  donut: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  donutText: { position: 'absolute', fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  donutCaption: { fontSize: 11, fontWeight: '600', color: colors.success },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 110 },
  streakText: { fontSize: 11, fontWeight: '600', color: colors.success, textAlign: 'center' },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  periodChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, backgroundColor: colors.tintBlue,
  },
  periodChipActive: { backgroundColor: colors.brand },
  periodChipText: { fontSize: 12, fontWeight: '600', color: colors.brand },
  periodChipTextActive: { color: colors.white },
  counters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  counter: { fontSize: 11, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm, flexWrap: 'wrap' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textSoft, marginRight: spacing.sm },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 12, color: colors.brand, fontWeight: '600' },

  apptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  apptDate: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  apptDoc: { fontSize: 12, color: colors.textSoft, marginTop: 2 },

  medList: { gap: spacing.sm },
  medCard: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.md, fontWeight: '800' },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  medTime: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  badge: { backgroundColor: colors.tintGreen, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.success },

  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  actionOk: { backgroundColor: colors.tintGreen },
  actionNeutral: { backgroundColor: colors.tintBlue },
  actionText: { fontSize: 12, fontWeight: '600' },
  reminder: { backgroundColor: colors.tintBlue, borderRadius: radius.sm, padding: spacing.sm },
  reminderText: { fontSize: 11, color: colors.brand, fontWeight: '500' },
});