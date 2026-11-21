import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, radius, spacing } from '../../theme';
import { DayStrip } from './DayStrip';
import { PriseItem } from './PriseItem';
import { Button, Card, NotifBell } from '../../components';

type Props = { mode: 'patient' | 'aidant'; patientName?: string };

// TODO: remplacer par les vraies données (SQLite / API)
const PRISES = [
  { id: 1, time: '08:00', period: 'Matin', name: 'Metformine', dose: '500 mg · 1 comprimé', medColor: colors.success, status: 'taken' as const },
  { id: 2, time: '12:30', period: 'Midi', name: 'Vitamine D3', dose: '1000 UI · 1 capsule · avec un repas', medColor: colors.warning, status: 'due' as const },
  { id: 3, time: '20:00', period: 'Soir', name: 'Atorvastatine', dose: '20 mg · 1 comprimé', medColor: colors.violet, status: 'upcoming' as const },
];

export function SuiviPrisesScreen({ mode, patientName = 'Miria' }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const aidant = mode === 'aidant';

  const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Suivi des prises</Text>
            {aidant ? <Text style={styles.subtitle}>Vous accompagnez {patientName}</Text> : null}
          </View>
          <NotifBell onPress={() => router.push('/prise-reminder')} unread />
        </View>

        {/* Bandeau patient accompagné (mode aidant) */}
        {aidant ? (
          <Card style={styles.banner}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{patientName.slice(0, 2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerName}>{patientName}</Text>
              <Text style={styles.bannerSub}>Dernière confirmation à 08:04</Text>
            </View>
            <Pressable hitSlop={8}><Ionicons name="call-outline" size={20} color={colors.brand} /></Pressable>
          </Card>
        ) : null}

        <DayStrip selected={date} onSelect={setDate} />

        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{`Aujourd'hui · ${dateLabel}`}</Text>
          <Text style={styles.count}>1 sur 3</Text>
        </View>

        {/* Frise */}
        <View>
          {PRISES.map((p, i) => {
            // En mode aidant, la prise de midi est en retard
            const status = aidant && p.status === 'due' ? 'late' : p.status;
            const statusText =
              p.status === 'taken' ? (aidant ? 'Confirmé à 08:04' : 'Pris à 08:04')
              : status === 'late' ? 'Pas encore confirmée · 20 min de retard'
              : p.status === 'upcoming' ? 'À venir'
              : undefined;

            return (
              <PriseItem key={p.id} {...p} status={status} statusText={statusText} isLast={i === PRISES.length - 1}>
                {p.status === 'due' && !aidant ? (
                  <View style={[styles.actionBox, { backgroundColor: colors.tintBlue }]}>
                   <Text style={styles.actionText}>{"C'est bientôt l'heure de la prise."}</Text>
                    <Button title="Confirmer la prise" variant="brand" onPress={() => {}} />
                    <Button title="Me le rappeler dans 30 min" variant="light" onPress={() => {}} />
                  </View>
                ) : null}

                {p.status === 'due' && aidant ? (
                  <View style={[styles.actionBox, { backgroundColor: colors.tintWarning }]}>
                   <Text style={styles.actionText}>
  {`Vous n'avez pas encore confirmé cette prise pour ${patientName}.`}
</Text>
                    <Pressable style={styles.darkBtn} onPress={() => {}}>
                      <Text style={styles.darkBtnText}>Confirmer la prise de {patientName}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </PriseItem>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
safe: { flex: 1, backgroundColor: colors.screenBackground },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSoft },
  banner: {
  flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  padding: spacing.sm, borderRadius: radius.md,
},
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.tintBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  bannerName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  bannerSub: { fontSize: 11, color: colors.textSoft },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  count: { fontSize: 11, color: colors.textSoft },
  actionBox: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  actionText: { fontSize: fontSize.sm, color: colors.text },
  darkBtn: {
    backgroundColor: colors.text, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  darkBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
});