import { useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { SubPageHeader } from '../components/SubPageHeader';

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

// HH:MM : on ajoute le ":" automatiquement pendant la saisie
function formatTime(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export default function MedicalProfileScreen() {
  const insets = useSafeAreaInsets();

  // TODO : initialiser avec les données de useProfile() puis envoyer à l'API dans onSave
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [allergies, setAllergies] = useState('');
  const [times, setTimes] = useState<Record<HabitKey, string>>({
    wake: '07:00',
    breakfast: '07:30',
    lunch: '12:30',
    dinner: '20:00',
    bed: '23:00',
  });

  const toggle = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const onSave = () => {
    // TODO : appeler le service de mise à jour du profil médical
  };

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
        <SubPageHeader title="Profil médical" />

        {/* Bandeau confidentialité */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.logoBlue} />
          </View>
          <Text style={styles.bannerText}>
            Facultatif. Ces informations restent privées et ne sont pas partagées avec votre
            aidante.
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

        {/* Habitudes */}
        <SectionTitle>MES HABITUDES</SectionTitle>
        <View style={styles.card}>
          <Text style={styles.hint}>Elles servent à proposer des heures de rappel adaptées.</Text>
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
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={onSave}
          accessibilityRole="button">
          <Text style={styles.saveText}>Enregistrer</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },

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