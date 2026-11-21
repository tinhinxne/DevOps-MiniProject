import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { colors, fontSize, radius, spacing } from '@/theme';

import { mockFollowed } from '@/features/profil/data/mockProfile';
import PersonRow from './PersonRow';

export default function FollowedOverview() {
  const router = useRouter();

  const people = mockFollowed;
  const toWatch = people.filter((p) => p.status !== 'ok');
  const upToDate = people.length - toWatch.length;
  const alerts = people.filter((p) => p.status === 'alert').length;

  return (
    <View>
      <View style={styles.titleRow}>
        <View>
        <Text style={styles.eyebrow}>{"Vue d'ensemble"}</Text>
          <Text style={styles.title}>Personnes suivies</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statMain}>
          <Text style={[styles.statNum, { color: colors.text }]}>{people.length}</Text>
          <Text style={styles.statLabel}>personnes au total</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statSmall}>
          <Text style={[styles.statNum, { color: colors.aidant }]}>{upToDate}</Text>
          <Text style={styles.statLabel}>À jour</Text>
        </View>
        <View style={styles.statSmall}>
          <Text style={[styles.statNum, { color: '#C2410C' }]}>{toWatch.length}</Text>
          <Text style={styles.statLabel}>À surveiller</Text>
        </View>
      </View>

      <View style={styles.watchHeader}>
        <Text style={styles.watchTitle}>À surveiller</Text>
        <View style={styles.alertPill}>
          <Text style={styles.alertPillText}>{alerts} alertes</Text>
        </View>
      </View>

      <View style={styles.listCard}>
        {toWatch.slice(0, 2).map((p, i) => (
          <View key={p.id} style={i > 0 ? styles.sep : undefined}>
            <PersonRow person={p} showBadge={false} />
          </View>
        ))}
      </View>

      <Pressable
        style={styles.seeAll}
        onPress={() => router.push('/profil-personnes-suivies' as Href)}>
        <Text style={styles.seeAllText}>Voir les {people.length} personnes</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.brand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: { fontSize: fontSize.xs, color: colors.textMuted },
  title: { fontSize: fontSize.lg + 2, fontWeight: '800', color: colors.text },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm + 4,
  },
  statMain: { flex: 1.3 },
  statSmall: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  watchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  watchTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  alertPill: {
    backgroundColor: colors.tintWarning,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertPillText: { fontSize: fontSize.xs, fontWeight: '700', color: '#C2410C' },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: spacing.sm + 4,
    overflow: 'hidden',
  },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  seeAllText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
});