import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { SubPageHeader } from '../components/SubPageHeader';

type IconName = keyof typeof Ionicons.glyphMap;

const SWITCH_OFF = '#94A3B8';

function Row({
  icon,
  title,
  subtitle,
  right,
  tone = 'blue',
  isLast,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  right: ReactNode;
  tone?: 'blue' | 'green';
  isLast?: boolean;
  onPress?: () => void;
}) {
  const green = tone === 'green';
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.iconBox, green && styles.iconBoxGreen]}>
        <Ionicons name={icon} size={18} color={green ? colors.success : colors.logoBlue} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {right}
    </Pressable>
  );
}

function Stepper({
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}
        accessibilityLabel="Diminuer">
        <Ionicons name="remove" size={16} color={colors.logoBlue} />
      </Pressable>
      <Text style={styles.stepValue}>{unit ? `${value} ${unit}` : value}</Text>
      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + step))}
        accessibilityLabel="Augmenter">
        <Ionicons name="add" size={16} color={colors.logoBlue} />
      </Pressable>
    </View>
  );
}

function AppSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: SWITCH_OFF, true: colors.logoBlue }}
      thumbColor="#FFFFFF"
    />
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  // TODO : charger / sauvegarder ces réglages (API ou stockage local)
  const [intakeReminders, setIntakeReminders] = useState(true);
  const [soundVibration, setSoundVibration] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [delay, setDelay] = useState(10);
  const [repeatCount, setRepeatCount] = useState(3);
  const [missedAlert, setMissedAlert] = useState(true);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}>
      <SubPageHeader title="Notifications" />

      <Text style={styles.sectionTitle}>MES RAPPELS</Text>
      <View style={styles.card}>
        <Row
          icon="notifications-outline"
          title="Rappels de prise"
          subtitle="Notification à l'heure du médicament"
          right={<AppSwitch value={intakeReminders} onChange={setIntakeReminders} />}
        />
        <Row
          icon="volume-medium-outline"
          title="Son et vibration"
          subtitle="Alerte sonore sur le téléphone"
          right={<AppSwitch value={soundVibration} onChange={setSoundVibration} />}
        />
        <Row
          icon="calendar-outline"
          title="Résumé quotidien"
          subtitle="Bilan des prises chaque soir"
          right={<AppSwitch value={dailySummary} onChange={setDailySummary} />}
        />
        <Row
          icon="time-outline"
          title="Délai avant relance"
          subtitle="Si la prise n'est pas validée"
          right={<Stepper value={delay} unit="min" min={5} max={60} step={5} onChange={setDelay} />}
        />
        <Row
          icon="time-outline"
          title="Nombre de rappels"
          subtitle="Nombre de rappels avant l'arrêt des alertes"
          right={<Stepper value={repeatCount} min={1} max={10} onChange={setRepeatCount} />}
          isLast
        />
      </View>

      <Text style={styles.sectionTitle}>MON AIDANTE</Text>
      <View style={styles.card}>
        <Row
          icon="warning-outline"
          tone="green"
          title="Alerte d'oublis répétés"
          subtitle="Prévenir Sophie après plusieurs oublis"
          right={<AppSwitch value={missedAlert} onChange={setMissedAlert} />}
        />
        <Row
          icon="download-outline"
          title="Exporter mes données"
          subtitle="Envoyer l'historique des prises au format PDF à mon aidante"
          right={<Ionicons name="chevron-forward" size={18} color="#64748B" />}
          onPress={() => {
            // TODO : générer et envoyer le PDF
          }}
          isLast
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },

  sectionTitle: {
    marginTop: spacing.md,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.logoBlue,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D3E9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGreen: { backgroundColor: '#DCF5E7' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 15 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#D3E9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#0F172A' },
});