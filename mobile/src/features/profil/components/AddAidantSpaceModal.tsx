import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/theme';
import { ApiError, LIENS, type Lien, type NewPatient } from '@/utils/api';

const BORDER = '#D6E6F5';
const FIELD_BG = '#F4F8FD';

type Props = {
  visible: boolean;
  onClose: () => void;
  // patient = null : l'utilisateur crée l'espace et renseignera la personne plus tard
  onSubmit: (patient: NewPatient | null) => Promise<void>;
};

export function AddAidantSpaceModal({ visible, onClose, onSubmit }: Props) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [lien, setLien] = useState<Lien>('PARENT');
  const [precision, setPrecision] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPrenom('');
    setNom('');
    setLien('PARENT');
    setPrecision('');
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const send = async (later: boolean) => {
    if (!later) {
      if (!prenom.trim() || !nom.trim()) {
        setError('Saisissez le prénom et le nom de la personne.');
        return;
      }
      if (lien === 'AUTRE' && !precision.trim()) {
        setError('Précisez le lien avec cette personne.');
        return;
      }
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(
        later
          ? null
          : {
              prenom: prenom.trim(),
              nom: nom.trim(),
              lien,
              lien_precision: lien === 'AUTRE' ? precision.trim() : undefined,
            }
      );
      reset();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Création impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropTap} onPress={close} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart-outline" size={20} color={colors.logoBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Créer votre espace aidant</Text>
              <Text style={styles.sub}>
                Vous suivrez les prises et recevrez les alertes d’un proche.
              </Text>
            </View>
            <Pressable onPress={close} hitSlop={10} accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}>
            <Text style={styles.section}>QUI ACCOMPAGNEZ-VOUS ?</Text>

            <View style={styles.row}>
              <View style={styles.col}>
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
              <View style={styles.col}>
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
            </View>

            <Text style={styles.label}>Lien avec cette personne</Text>
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

            {lien === 'AUTRE' ? (
              <View>
                <Text style={styles.label}>Précisez le lien</Text>
                <TextInput
                  style={styles.input}
                  value={precision}
                  onChangeText={setPrecision}
                  maxLength={40}
                  autoFocus
                  placeholder="Ex : voisine, tante, collègue…"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primary, (pressed || busy) && { opacity: 0.85 }]}
              onPress={() => send(false)}
              disabled={busy}
              accessibilityRole="button">
              <Text style={styles.primaryText}>
                {busy ? 'Création…' : 'Créer mon espace aidant'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.later}
              onPress={() => send(true)}
              disabled={busy}
              accessibilityRole="button">
              <Text style={styles.laterText}>Je le ferai plus tard</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  backdropTap: { flex: 1 },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D3E9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, lineHeight: 17, color: '#64748B', marginTop: 2 },

  form: { gap: 12, paddingTop: 18 },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.logoBlue },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
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

  error: { fontSize: 12, color: '#B42318' },

  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  later: { height: 44, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontSize: 14, fontWeight: '600', color: colors.logoBlue },
});