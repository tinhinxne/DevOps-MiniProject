import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { colors, fontSize, radius, spacing } from '@/theme';
import { ApiError, getPatientsSuivis, type Patient } from '@/utils/api';

import { SubPageHeader } from '@/components/SubPageHeader';
import PatientRow from '@/components/PatientRow';

export default function FollowedPeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Recharge la liste à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const list = await getPatientsSuivis();
          if (active) {
            setPeople(list);
            setError(null);
          }
        } catch (e) {
          if (active) setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => `${p.prenom} ${p.nom}`.toLowerCase().includes(q));
  }, [people, query]);

  const openMedical = (p: Patient) =>
    router.push({ pathname: '/profil-medical', params: { personId: p.id } } as unknown as Href);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SubPageHeader title="Toutes les personnes" />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une personne"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />

      <View style={styles.countRow}>
        <Text style={styles.countLabel}>TOUTES LES PERSONNES</Text>
        <Text style={styles.countLabel}>
          {list.length} {list.length > 1 ? 'résultats' : 'résultat'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            {people.length === 0 ? 'Aucune personne suivie pour le moment.' : 'Aucun résultat.'}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {list.map((p, i) => (
            <View key={p.id} style={i > 0 ? styles.sep : undefined}>
              <PatientRow patient={p} onPress={() => openMedical(p)} />
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.addBtn}
        onPress={() => router.push('/profil-ajouter-personne' as Href)}
        accessibilityRole="button">
        <Ionicons name="person-add-outline" size={18} color={colors.white} />
        <Text style={styles.addBtnText}>Ajouter une personne à suivre</Text>
      </Pressable>

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
  center: { paddingVertical: spacing.lg, alignItems: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  errorText: { padding: spacing.md, fontSize: fontSize.sm, color: '#DC2626' },
  emptyText: { padding: spacing.md, fontSize: fontSize.sm, color: colors.textMuted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    marginTop: spacing.md,
  },
  addBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
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