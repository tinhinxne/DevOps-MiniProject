import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input } from '../../components';
import meds from '../../data/meds-dz.json';
import { colors, fontSize, radius, spacing } from '../../theme';
import { taillesBoite } from '../../utils/referentiel';

type Medicament = { id: string; n: string; g: string; f: string; d: string; c: string };
const REFERENTIEL = meds as Medicament[];

// minuscules + sans accents, pour que "paracetamol" trouve "Paracétamol"
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function AjoutMed() {
  const router = useRouter();
  const { ordonnanceId, patientId } = useLocalSearchParams<{
    ordonnanceId?: string;
    patientId?: string;
  }>();

  // à transmettre aux écrans suivants (vide si on arrive sans ordonnance)
  const ctx = {
    ...(ordonnanceId ? { ordonnanceId } : {}),
    ...(patientId ? { patientId } : {}),
  };

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Les résultats qui commencent par la recherche passent avant ceux qui la contiennent
  const results = useMemo(() => {
    const q = norm(query.trim());
    if (q.length < 1) return [];
    const debut: Medicament[] = [];
    const ailleurs: Medicament[] = [];
    for (const m of REFERENTIEL) {
      const n = norm(m.n);
      const g = norm(m.g);
      if (n.startsWith(q) || g.startsWith(q)) debut.push(m);
      else if (n.includes(q) || g.includes(q)) ailleurs.push(m);
    }
    return [...debut, ...ailleurs].slice(0, 30);
  }, [query]);

  const handleContinue = () => {
    const med = REFERENTIEL.find((m) => m.id === selectedId);
    if (!med) return;
    const tailles = taillesBoite(med.c);
    router.push({
      pathname: '/configurer-prise',
      params: {
        nom: med.n,
        dosage: med.d,
        dci: med.g,
        forme: med.f,
        unites: tailles[0] ? String(tailles[0]) : '',
        tailles: tailles.join(','),
        ...ctx,
      },
    } as unknown as Href);
  };

  const saisieManuelle = () =>
    router.push({ pathname: '/saisie-manuelle', params: ctx } as unknown as Href);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.back}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="chevron-back" size={20} color={colors.brand} />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.title}>Ajouter un médicament</Text>
              <Text style={styles.subtitle}>Recherchez dans le référentiel</Text>
            </View>
          </View>

          {/* Recherche */}
          <Input
            label="Médicament"
            labelColor={colors.textSoft}
            value={query}
            onChangeText={(t: string) => {
              setQuery(t);
              setSelectedId(null);
            }}
            placeholder="Nom commercial ou DCI"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="search-outline" size={20} color={colors.brand} />}
          />
          <Text style={styles.hint}>Recherche par nom commercial ou par DCI</Text>

          {/* Résultats */}
          {results.length > 0 ? (
            <Card style={styles.results}>
              {results.map((m) => {
                const selected = m.id === selectedId;
                return (
                  <Pressable key={m.id} style={styles.row} onPress={() => setSelectedId(m.id)}>
                    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                      {selected ? (
                        <Ionicons name="checkmark" size={14} color={colors.white} />
                      ) : null}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.medName}>{m.d ? `${m.n} ${m.d}` : m.n}</Text>
                      <Text style={styles.medMeta}>{`DCI · ${m.g} · ${m.f}`}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <View style={styles.sep} />
              <Pressable onPress={saisieManuelle} style={styles.manual}>
                <Text style={styles.manualText}>Introuvable ? Saisir manuellement</Text>
              </Pressable>
            </Card>
          ) : query.trim().length > 0 ? (
            <Pressable onPress={saisieManuelle} style={styles.manual}>
              <Text style={styles.manualText}>Aucun résultat. Saisir manuellement</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* Bouton fixe en bas */}
        <View style={styles.footer}>
          <Button
            title="Continuer"
            variant="brand"
            onPress={handleContinue}
            disabled={!selectedId}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screenBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.modeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandName },
  subtitle: { fontSize: fontSize.sm, color: colors.textSoft },

  hint: { fontSize: 11, color: colors.textSoft, marginTop: -spacing.sm },

  results: { gap: spacing.sm, padding: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.tintBlue,
    borderWidth: 1.5,
    borderColor: colors.tintBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  medName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  medMeta: { fontSize: 11, color: colors.textSoft },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.modeBorder },
  manual: { alignItems: 'center', paddingVertical: spacing.sm },
  manualText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },

  footer: { padding: spacing.lg },
});