import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { colors, fontSize, spacing } from '@/theme';
import { SubPageHeader } from '@/components/SubPageHeader';
import PatientRow from '@/components/PatientRow';
import { ApiError, getPatientsSuivis, type Patient } from '@/utils/api';

export default function SelectPersonScreen() {
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: 'medical' | 'rapport' }>();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isReport = target === 'rapport';
  const title = isReport ? 'Rapport médical' : 'Profil médical';
  const pathname = isReport ? '/profil-rapport' : '/profil-medical';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPatients(await getPatientsSuivis());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recharge à chaque retour sur l'écran (ex. après l'ajout d'une personne)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SubPageHeader title={title} />

      <Text style={styles.hint}>
        {isReport
          ? 'Pour quelle personne voulez-vous générer le rapport ?'
          : 'De quelle personne voulez-vous voir le profil médical ?'}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.lg }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.center}>
        <Text style={styles.empty}>
  {"Vous n'accompagnez personne pour le moment."}
</Text>
          <Pressable
            style={styles.retry}
            onPress={() => router.push('/profil-ajouter-personne' as Href)}>
            <Text style={styles.retryText}>Ajouter une personne</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          {patients.map((p, i) => (
            <View key={p.id} style={i > 0 ? styles.sep : undefined}>
              <PatientRow
                patient={p}
                onPress={() =>
                  router.push({ pathname, params: { personId: p.id } } as unknown as Href)
                }
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  content: { padding: spacing.md, paddingBottom: 120 },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  card: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  center: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  error: { color: '#DC2626', textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.textSoft },
  retry: {
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});