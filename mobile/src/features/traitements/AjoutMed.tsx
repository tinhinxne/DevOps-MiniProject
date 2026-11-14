import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
import { colors, fontSize, radius, spacing } from '../../theme';

type Medicament = { id: string; name: string; dci: string; forme: string };

// TODO: remplacer par l'appel à l'API du référentiel de médicaments
const REFERENTIEL: Medicament[] = [
  { id: '1', name: 'Doliprane 500 mg', dci: 'paracétamol', forme: 'comprimé' },
  { id: '2', name: 'Doliprane 1000 mg', dci: 'paracétamol', forme: 'comprimé' },
  { id: '3', name: 'Doliprane 150 mg', dci: 'paracétamol', forme: 'suppositoire' },
  { id: '4', name: 'Metformine 500 mg', dci: 'metformine', forme: 'comprimé' },
  { id: '5', name: 'Atorvastatine 20 mg', dci: 'atorvastatine', forme: 'comprimé' },
];

export function AjoutMed() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return REFERENTIEL.filter(
      (m) => m.name.toLowerCase().includes(q) || m.dci.toLowerCase().includes(q),
    );
  }, [query]);

  const handleContinue = () => {
    // TODO: écran suivant (dosage, horaires, durée...)
    console.log('Médicament choisi :', selectedId);
  };

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

          {/* Scanner */}
          <Pressable style={styles.scan} onPress={() => {}}>
            <Text style={styles.scanText}>Scanner une ordonnance</Text>
          </Pressable>

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
                      {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.medName}>{m.name}</Text>
                      <Text style={styles.medMeta}>{`DCI · ${m.dci} · ${m.forme}`}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <View style={styles.sep} />
              <Pressable onPress={() => {}} style={styles.manual}>
                <Text style={styles.manualText}>Introuvable ? Saisir manuellement</Text>
              </Pressable>
            </Card>
          ) : query.trim().length > 0 ? (
            <Pressable onPress={() => {}} style={styles.manual}>
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
    width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.modeBorder, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandName },
  subtitle: { fontSize: fontSize.sm, color: colors.textSoft },

  scan: {
    borderWidth: 1.5, borderColor: colors.brand, borderRadius: radius.md,
    backgroundColor: colors.card, paddingVertical: spacing.md, alignItems: 'center',
  },
  scanText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },

  hint: { fontSize: 11, color: colors.textSoft, marginTop: -spacing.sm },

  results: { gap: spacing.sm, padding: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: colors.tintBlue,
    borderWidth: 1.5, borderColor: colors.tintBlue, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  medName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  medMeta: { fontSize: 11, color: colors.textSoft },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.modeBorder },
  manual: { alignItems: 'center', paddingVertical: spacing.sm },
  manualText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },

  footer: { padding: spacing.lg },
});