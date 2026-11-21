import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { addPatientsSuivis, ApiError, LIENS, type Lien } from '@/utils/api';
import { SubPageHeader } from '../../../components/SubPageHeader';

const BORDER = '#D6E6F5';
const FIELD_BG = '#F4F8FD';

export default function AddFollowedPersonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [lien, setLien] = useState<Lien>('PARENT');
  const [precision, setPrecision] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPrecision = lien === 'AUTRE';
  const canSave =
    prenom.trim().length > 0 &&
    nom.trim().length > 0 &&
    (!needsPrecision || precision.trim().length > 0) &&
    !saving;

  const notify = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      onOk?.();
      return;
    }
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  };

  const onSave = async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      await addPatientsSuivis([
        {
          nom: nom.trim(),
          prenom: prenom.trim(),
          lien,
          lien_precision: needsPrecision ? precision.trim() : undefined,
        },
      ]);
      notify('Personne ajoutée', `${prenom.trim()} fait maintenant partie de vos proches suivis.`, () =>
        router.back()
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ajout impossible, réessayez.');
    } finally {
      setSaving(false);
    }
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
        <SubPageHeader title="Ajouter une personne" />

        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="people-outline" size={16} color={colors.logoBlue} />
          </View>
          <Text style={styles.bannerText}>
            Ajoutez une personne dont vous suivez les médicaments. Vous pourrez ensuite gérer son
            profil médical, ses traitements et ses rappels.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              autoCapitalize="words"
              placeholder="Prénom"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              autoCapitalize="words"
              placeholder="Nom"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lien avec vous</Text>
            <View style={styles.chips}>
              {LIENS.map((l) => {
                const on = lien === l.value;
                return (
                  <Pressable
                    key={l.value}
                    onPress={() => setLien(l.value)}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {needsPrecision && (
            <View style={styles.field}>
              <Text style={styles.label}>Précisez le lien</Text>
              <TextInput
                style={styles.input}
                value={precision}
                onChangeText={setPrecision}
                placeholder="Ex. voisin, tante…"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && { opacity: 0.5 },
            pressed && canSave && { opacity: 0.85 },
          ]}
          onPress={onSave}
          disabled={!canSave}
          accessibilityRole="button">
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <Text style={styles.saveText}>Ajouter cette personne</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: FIELD_BG,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  error: { fontSize: 12, color: '#D64545' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EAF4FC',
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipOn: { backgroundColor: colors.logoBlue, borderColor: colors.logoBlue },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  chipTextOn: { color: '#FFFFFF' },

  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.logoBlue,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});