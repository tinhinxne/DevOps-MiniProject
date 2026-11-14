import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';

import { SubPageHeader } from '../../../components/SubPageHeader';
import PersonRow from '@/components/PersonRow';
import { mockFollowed } from '../data/mockProfile';
type Filter = 'all' | 'watch' | 'ok';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'watch', label: 'À surveiller' },
  { key: 'ok', label: 'À jour' },
];

export default function FollowedPeopleScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(
    () =>
      mockFollowed.filter((p) => {
        const matchFilter =
          filter === 'all' || (filter === 'ok' ? p.status === 'ok' : p.status !== 'ok');
        const matchQuery = p.name.toLowerCase().includes(query.trim().toLowerCase());
        return matchFilter && matchQuery;
      }),
    [filter, query],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SubPageHeader title="Toutes les personnes" />

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une personne"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />

      <View style={styles.countRow}>
        <Text style={styles.countLabel}>TOUTES LES PERSONNES</Text>
        <Text style={styles.countLabel}>{list.length} résultats</Text>
      </View>

      <View style={styles.card}>
        {list.map((p, i) => (
          <View key={p.id} style={i > 0 ? styles.sep : undefined}>
            <PersonRow person={p} />
          </View>
        ))}
      </View>

      <Pressable style={styles.settings}>
        <View style={styles.settingsIcon}>
          <Ionicons name="person-outline" size={18} color={colors.brand} />
        </View>
        <Text style={styles.settingsText}>Paramètres du compte aidant</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  content: { padding: spacing.md, paddingBottom: 120 },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.brand },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSoft },
  chipTextActive: { color: colors.white },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  countLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.tintBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: { flex: 1, fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
});