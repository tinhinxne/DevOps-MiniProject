import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
const MIN_LENGTH = 8;

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(true);

  const onUpdatePassword = () => {
    if (!current) return setError('Saisissez votre mot de passe actuel.');
    if (next.length < MIN_LENGTH) {
      return setError(`Le nouveau mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`);
    }
    if (next !== confirm) return setError('La confirmation ne correspond pas au nouveau mot de passe.');

    setError(null);
    // TODO : appeler le service de changement de mot de passe
    setCurrent('');
    setNext('');
    setConfirm('');
    Alert.alert('Mot de passe mis à jour');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Toutes vos données seront supprimées définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO : appeler le service de suppression de compte puis rediriger vers le login
          },
        },
      ],
    );
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
        <SubPageHeader title="Confidentialité et sécurité" />

        {/* Mot de passe */}
        <Text style={styles.sectionTitle}>MOT DE PASSE</Text>
        <View style={[styles.card, styles.form]}>
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
              placeholder="8 caractères minimum"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirmation du nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              placeholder="8 caractères minimum"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={onUpdatePassword}
            accessibilityRole="button">
            <Text style={styles.primaryText}>Mettre à jour le mot de passe</Text>
          </Pressable>
        </View>

        {/* Données */}
        <Text style={styles.sectionTitle}>MES DONNÉES</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconBox}>
              <Ionicons name="heart-outline" size={18} color={colors.logoBlue} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Partage avec mon aidante</Text>
              {/* TODO : remplacer "Sophie" par profile.caregiver.name */}
              <Text style={styles.rowSub}>Sophie voit mes prises (lecture seule)</Text>
            </View>
            <Switch
              value={sharing}
              onValueChange={setSharing}
              trackColor={{ false: '#94A3B8', true: colors.logoBlue }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Pressable
            style={styles.row}
            onPress={() => {
              // TODO : générer et exporter l'historique en PDF
            }}
            accessibilityRole="button">
            <View style={styles.iconBox}>
              <Ionicons name="download-outline" size={18} color={colors.logoBlue} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Exporter mes données</Text>
              <Text style={styles.rowSub}>Historique des prises au format PDF</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* Suppression */}
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
          onPress={onDeleteAccount}
          accessibilityRole="button">
          <Ionicons name="trash-outline" size={16} color="#B42318" />
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },

  sectionTitle: {
    marginTop: spacing.md,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.logoBlue,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  form: { padding: spacing.md, gap: spacing.md },
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
  error: { fontSize: 12, color: '#B42318' },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D3E9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 15 },

  deleteBtn: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FBE1E1',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
});