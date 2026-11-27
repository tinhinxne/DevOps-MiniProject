import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeEtat, BoutonsPrise } from '../../components/DoseActions';
import { Card } from '@/components/Card';
import { SubPageHeader } from '@/components/SubPageHeader';
import { colors, fontSize, spacing } from '@/theme';
import { ymdLocal } from '../../utils/rappels';
import { useDoses } from '../../utils/useRappels';

export function BoiteNotificationsScreen() {
  const { recentes, traitements, agir } = useDoses();
  const aujourdhui = ymdLocal(new Date());

  // une notification = une prise dont l'heure est passée (la plus récente en premier)
  const notifs = recentes
    .filter((d) => d.etat !== 'A_VENIR')
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const stockFaible = traitements.filter(
    (t) => t.stockRestant != null && t.stockRestant <= t.seuilStockFaible,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SubPageHeader title="Notifications" />

        {stockFaible.map((t) => (
          <Card key={`stock-${t.id}`} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
              <View style={styles.flex}>
                <Text style={styles.titre}>Stock faible</Text>
                <Text style={styles.sous}>
                  Il reste {t.stockRestant} comprimé{(t.stockRestant ?? 0) > 1 ? 's' : ''} de {t.nom}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {notifs.length === 0 && stockFaible.length === 0 && (
          <Text style={styles.sous}>Aucune notification pour le moment.</Text>
        )}

        {notifs.map((d) => (
          <Card key={d.key} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="notifications-outline" size={22} color={colors.brand} />
              <View style={styles.flex}>
                <Text style={styles.titre}>C&apos;est l&apos;heure de votre {d.nom}</Text>
                <Text style={styles.sous}>
                  {d.jour === aujourdhui ? "Aujourd'hui" : 'Hier'} · {d.heure}
                  {d.dosage ? ` · ${d.dosage}` : ''} · {d.quantite} cp
                </Text>
              </View>
              <BadgeEtat etat={d.etat} reporteJusqua={d.reporteJusqua} />
            </View>
            {d.etat === 'EN_ATTENTE' && <BoutonsPrise onAction={(s) => agir(d, s)} />}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.authBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titre: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sous: { fontSize: fontSize.xs, color: colors.textSoft, marginTop: 2 },
});