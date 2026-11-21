import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import {
  addMedecin,
  ApiError,
  getMedical,
  removeMedecin,
  saveMedical,
  type HabitudesRepas,
  type Medecin,
} from '@/utils/api';
import { SubPageHeader } from '../../../components/SubPageHeader';

const BORDER = '#D6E6F5';
const FIELD_BG = '#F4F8FD';

const CONDITIONS = [
  'Diabète',
  'Hypertension',
  'Asthme',
  'Cholestérol',
  'Maladie cardiaque',
  'Thyroïde',
];

type HabitKey = 'wake' | 'breakfast' | 'lunch' | 'dinner' | 'bed';

const HABITS: { key: HabitKey; label: string }[] = [
  { key: 'wake', label: 'Réveil' },
  { key: 'breakfast', label: 'Petit-déj.' },
  { key: 'lunch', label: 'Déjeuner' },
  { key: 'dinner', label: 'Dîner' },
  { key: 'bed', label: 'Coucher' },
];

// Correspondance écran -> colonnes de habitudes_repas
const HABIT_COLUMN: Record<HabitKey, keyof HabitudesRepas> = {
  wake: 'reveil',
  breakfast: 'petit_dejeuner',
  lunch: 'dejeuner',
  dinner: 'diner',
  bed: 'coucher',
};

const DEFAULT_TIMES: Record<HabitKey, string> = {
  wake: '07:00',
  breakfast: '07:30',
  lunch: '12:30',
  dinner: '20:00',
  bed: '23:00',
};

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// HH:MM : on ajoute le ":" automatiquement pendant la saisie
function formatTime(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

// La base stocke les maladies dans un seul texte : « Diabète, Asthme, Myopie »
function parseMaladies(raw: string | null) {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    selected: parts.filter((p) => CONDITIONS.includes(p)),
    other: parts.filter((p) => !CONDITIONS.includes(p)).join(', '),
  };
}

function buildMaladies(selected: string[], other: string): string | null {
  const extra = other
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const all = [...selected, ...extra];
  return all.length ? all.join(', ') : null;
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export default function MedicalProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mode aidant : personId est fourni. Mode patient : il est absent.
  const { personId } = useLocalSearchParams<{ personId?: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [personName, setPersonName] = useState<string | null>(null);

  // Médecins
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [adding, setAdding] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docBusy, setDocBusy] = useState(false);

  // Profil
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [allergies, setAllergies] = useState('');
  const [times, setTimes] = useState<Record<HabitKey, string>>(DEFAULT_TIMES);

  const isAidantView = Boolean(personId);

  const notify = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      onOk?.();
      return;
    }
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  };

  const errMessage = (e: unknown, fallback: string) =>
    e instanceof ApiError ? e.message : fallback;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const p = await getMedical(personId);
      const m = parseMaladies(p.maladies_chroniques);
      setSelected(m.selected);
      setOther(m.other);
      setAllergies(p.allergies ?? '');
      setDoctors(p.medecins);
      setPersonName(isAidantView ? p.person.prenom : null);

      const next = { ...DEFAULT_TIMES };
      (Object.keys(HABIT_COLUMN) as HabitKey[]).forEach((k) => {
        const v = p.habitudes[HABIT_COLUMN[k]];
        if (v) next[k] = v;
      });
      setTimes(next);
    } catch (e) {
      setLoadError(errMessage(e, 'Chargement impossible.'));
    } finally {
      setLoading(false);
    }
  }, [personId, isAidantView]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addDoctor = async () => {
    if (!docName.trim() || docBusy) return;
    setDocBusy(true);
    try {
      const d = await addMedecin(docName.trim(), docSpec.trim(), personId);
      setDoctors((prev) => [...prev, d]);
      setDocName('');
      setDocSpec('');
      setAdding(false);
    } catch (e) {
      notify('Erreur', errMessage(e, "Ajout impossible."));
    } finally {
      setDocBusy(false);
    }
  };

  const removeDoctor = async (id: string) => {
    try {
      await removeMedecin(id, personId);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      notify('Erreur', errMessage(e, 'Suppression impossible.'));
    }
  };

  const onSave = async () => {
    if (saving) return;

    // Vérifie les heures avant d'envoyer
    for (const h of HABITS) {
      const v = times[h.key];
      if (v && !TIME_REGEX.test(v)) {
        notify('Heure invalide', `${h.label} : utilisez le format HH:MM (ex. 07:30).`);
        return;
      }
    }

    const habitudes = {} as HabitudesRepas;
    (Object.keys(HABIT_COLUMN) as HabitKey[]).forEach((k) => {
      habitudes[HABIT_COLUMN[k]] = times[k] || null;
    });

    setSaving(true);
    try {
      await saveMedical(
        {
          maladies_chroniques: buildMaladies(selected, other),
          allergies: allergies.trim() || null,
          habitudes,
        },
        personId
      );
      notify('Profil enregistré', 'Les informations médicales ont été mises à jour.', () =>
        router.back()
      );
    } catch (e) {
      notify('Erreur', errMessage(e, 'Enregistrement impossible.'));
    } finally {
      setSaving(false);
    }
  };

  const title = personName ? `Profil médical · ${personName}` : 'Profil médical';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SubPageHeader title={title} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.logoBlue} />
          </View>
        ) : loadError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Bandeau confidentialité */}
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.logoBlue} />
              </View>
              <Text style={styles.bannerText}>
                {isAidantView
                  ? `Informations médicales de ${personName ?? 'cette personne'}. Elles restent privées et ne sont visibles que par vous et ${personName ?? 'cette personne'}.`
                  : 'Facultatif. Ces informations restent privées et ne sont pas partagées avec votre aidante.'}
              </Text>
            </View>

            {/* Maladies chroniques */}
            <SectionTitle>MALADIES CHRONIQUES</SectionTitle>
            <View style={styles.card}>
              <View style={styles.chips}>
                {CONDITIONS.map((c) => {
                  const on = selected.includes(c);
                  return (
                    <Pressable
                      key={c}
                      onPress={() => toggle(c)}
                      style={[styles.chip, on && styles.chipOn]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.otherRow}>
                <Text style={styles.otherLabel}>Autres :</Text>
                <TextInput
                  style={[styles.input, styles.otherInput]}
                  value={other}
                  onChangeText={setOther}
                  placeholder="Ex : Myopie"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Allergies */}
            <SectionTitle>ALLERGIES</SectionTitle>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Allergies connues (médicaments, aliments)</Text>
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Ex. pénicilline"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Médecins */}
            <SectionTitle>{isAidantView ? 'SES MÉDECINS' : 'MES MÉDECINS'}</SectionTitle>
            <View style={styles.card}>
              {doctors.length === 0 && !adding && (
                <Text style={styles.hint}>Aucun médecin ajouté pour le moment.</Text>
              )}

              {doctors.map((d, i) => (
                <View key={d.id} style={[styles.docRow, i > 0 && styles.docRowBorder]}>
                  <View style={styles.docIcon}>
                    <Ionicons name="medkit-outline" size={16} color={colors.logoBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>{d.nom}</Text>
                    {d.specialite ? <Text style={styles.docSpec}>{d.specialite}</Text> : null}
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => removeDoctor(d.id)}
                    accessibilityLabel="Supprimer ce médecin">
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </Pressable>
                </View>
              ))}

              {adding && (
                <View style={styles.docForm}>
                  <TextInput
                    style={styles.input}
                    value={docName}
                    onChangeText={setDocName}
                    placeholder="Nom du médecin"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={styles.input}
                    value={docSpec}
                    onChangeText={setDocSpec}
                    placeholder="Spécialité (ex. Cardiologue)"
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.docActions}>
                    <Pressable style={styles.docCancel} onPress={() => setAdding(false)}>
                      <Text style={styles.docCancelText}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.docSave, (!docName.trim() || docBusy) && { opacity: 0.5 }]}
                      onPress={addDoctor}
                      disabled={!docName.trim() || docBusy}>
                      {docBusy ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.docSaveText}>Ajouter</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {!adding && (
                <Pressable
                  style={styles.addDocBtn}
                  onPress={() => setAdding(true)}
                  accessibilityRole="button">
                  <Text style={styles.addDocText}>+ Ajouter un médecin</Text>
                </Pressable>
              )}
            </View>

            {/* Habitudes */}
            <SectionTitle>{isAidantView ? 'SES HABITUDES' : 'MES HABITUDES'}</SectionTitle>
            <View style={styles.card}>
              <Text style={styles.hint}>
                Elles servent à proposer des heures de rappel adaptées.
              </Text>
              <View style={styles.habits}>
                {HABITS.map((h) => (
                  <View key={h.key} style={styles.habit}>
                    <Text style={styles.fieldLabel}>{h.label}</Text>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={times[h.key]}
                      onChangeText={(t) => setTimes((p) => ({ ...p, [h.key]: formatTime(t) }))}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="HH:MM"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                saving && { opacity: 0.6 },
                pressed && { opacity: 0.85 },
              ]}
              onPress={onSave}
              disabled={saving}
              accessibilityRole="button">
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },

  center: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D3E9F8',
    borderRadius: 14,
    padding: 12,
    marginTop: spacing.sm,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#1E3A5F' },

  sectionTitle: {
    marginTop: spacing.sm,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.logoBlue,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#EAF4FC',
  },
  chipOn: { backgroundColor: colors.logoBlue, borderColor: colors.logoBlue },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  chipTextOn: { color: '#FFFFFF' },

  otherRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  otherLabel: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  otherInput: { flex: 1, height: 38 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  hint: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: FIELD_BG,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },

  habits: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  habit: { width: '30%', flexGrow: 1, gap: 6 },
  timeInput: { textAlign: 'center' },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  docRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  docIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  docSpec: { fontSize: 12, color: '#64748B', marginTop: 2 },
  docForm: { gap: 10, marginTop: 4 },
  docActions: { flexDirection: 'row', gap: 10 },
  docCancel: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCancelText: { fontSize: 13, fontWeight: '600', color: colors.logoBlue },
  docSave: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSaveText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  addDocBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDocText: { fontSize: 14, fontWeight: '700', color: colors.logoBlue },

  saveBtn: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});