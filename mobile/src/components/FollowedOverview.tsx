import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { colors, fontSize, radius, spacing } from '@/theme';
import { ApiError, getPatientsSuivis, type Patient } from '@/utils/api';

import PatientRow from './PatientRow';

const MAX_SHOWN = 3;

export default function FollowedOverview() {
  const router = useRouter();
  const [people, setPeople] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recharge la liste à chaque retour sur l'écran (ex. après un ajout)
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

  const goAdd = () => router.push('/profil-ajouter-personne' as Href);

  const openMedical = (p: Patient) =>
    router.push({ pathname: '/profil-medical', params: { personId: p.id } } as unknown as Href);

  return (
    <View>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>{"Vue d'ensemble"}</Text>
          <Text style={styles.title}>Personnes suivies</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={goAdd}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une personne à suivre">
          <Ionicons name="person-add-outline" size={16} color={colors.brand} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.listCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : people.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune personne suivie</Text>
          <Text style={styles.emptyText}>
            Ajoutez un parent, un conjoint, un enfant ou un(e) ami(e) pour suivre ses médicaments.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={goAdd}>
            <Text style={styles.emptyBtnText}>Ajouter une personne</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statsCard}>
            <Text style={styles.statNum}>{people.length}</Text>
            <Text style={styles.statLabel}>
              {people.length > 1 ? 'personnes suivies' : 'personne suivie'}
            </Text>
          </View>

          <View style={styles.listCard}>
            {people.slice(0, MAX_SHOWN).map((p, i) => (
              <View key={p.id} style={i > 0 ? styles.sep : undefined}>
                <PatientRow patient={p} onPress={() => openMedical(p)} />
              </View>
            ))}
          </View>

          {people.length > MAX_SHOWN && (
            <Pressable
              style={styles.seeAll}
              onPress={() => router.push('/profil-personnes-suivies' as Href)}>
              <Text style={styles.seeAllText}>Voir les {people.length} personnes</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.brand} />
            </Pressable>
          )}
        </>
      )}
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

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },

  center: { paddingVertical: spacing.lg, alignItems: 'center' },
  errorText: { padding: spacing.md, fontSize: fontSize.sm, color: '#DC2626' },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm + 4,
  },
  statNum: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: spacing.sm + 4,
    overflow: 'hidden',
  },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm + 4,
    gap: 6,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18 },
  emptyBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: '700' },

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