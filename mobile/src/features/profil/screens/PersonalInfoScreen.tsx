import { useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { SubPageHeader } from '../components/SubPageHeader';

const BORDER = '#D6E6F5';
const FIELD_BG = '#F4F8FD';
const LABEL = '#1E293B';

// JJ/MM/AAAA : on ajoute les "/" automatiquement pendant la saisie
function formatDate(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// Téléphone : chiffres, espaces et un "+" au début uniquement
function formatPhone(raw: string) {
  const plus = raw.trim().startsWith('+') ? '+' : '';
  return plus + raw.replace(/[^\d ]/g, '').slice(0, 18);
}

// Pseudo : lettres, chiffres, "." "_" "-" (sans espaces)
function formatUsername(raw: string) {
  return raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // TODO : initialiser avec les données de useProfile() puis envoyer à l'API dans onSave
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- Photo ---
  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Accès refusé', 'Autorisez l\u2019accès à vos photos dans les réglages.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Accès refusé', 'Autorisez l\u2019accès à la caméra dans les réglages.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const onEditPhoto = () => {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Choisir dans la galerie', onPress: pickFromLibrary },
      { text: 'Prendre une photo', onPress: takePhoto },
    ];
    if (photoUri) {
      options.push({ text: 'Supprimer la photo', style: 'destructive', onPress: () => setPhotoUri(null) });
    }
    options.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert('Photo de profil', undefined, options);
  };

  // --- Enregistrement ---
  const onSave = () => {
    if (!fullName.trim()) return setError('Saisissez votre nom complet.');
    if (username && username.length < 3) return setError('Le pseudo doit contenir au moins 3 caractères.');
    if (!phone.trim() && !email.trim()) return setError('Renseignez un numéro de téléphone ou une adresse e-mail.');
    if (phone.trim() && phone.replace(/\D/g, '').length < 8) return setError('Numéro de téléphone invalide.');
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setError('Adresse e-mail invalide.');

    setError(null);
    // TODO : envoyer { photoUri, fullName, username, birthDate, phone, email } à l'API
    Alert.alert('Informations enregistrées', undefined, [{ text: 'OK', onPress: () => router.back() }]);
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
        <SubPageHeader title="Informations personnelles" />

        {/* Carte identité */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <Pressable onPress={onEditPhoto} accessibilityRole="button" accessibilityLabel="Modifier la photo">
              <View style={styles.avatar}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                )}
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="pencil" size={11} color="#FFFFFF" />
              </View>
            </Pressable>

            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {fullName || 'Votre nom'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {username ? `@${username}` : email || phone || 'Votre pseudo'}
              </Text>
            </View>

            <Pressable style={styles.editBtn} onPress={onEditPhoto} accessibilityRole="button">
              <Text style={styles.editBtnText}>Modifier</Text>
            </Pressable>
          </View>
        </View>

        {/* Formulaire */}
        <View style={[styles.card, styles.form]}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder="Votre nom"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pseudo</Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.prefix}>@</Text>
              <TextInput
                style={styles.inputInner}
                value={username}
                onChangeText={(t) => setUsername(formatUsername(t))}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                placeholder="votre_pseudo"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(t) => setBirthDate(formatDate(t))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              keyboardType="phone-pad"
              placeholder="+213 5 55 00 00 00"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="nom@exemple.com"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  content: { paddingHorizontal: spacing.md, gap: spacing.md },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CFE6F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.logoBlue },
  avatarBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.logoBlue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  email: { fontSize: 12, color: '#64748B', marginTop: 2 },
  editBtn: {
    backgroundColor: '#CFE6F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.logoBlue },

  form: { gap: spacing.md, paddingVertical: spacing.lg },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: LABEL },
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
  inputWithPrefix: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: FIELD_BG,
    paddingHorizontal: 14,
  },
  prefix: { fontSize: 14, fontWeight: '700', color: colors.logoBlue, marginRight: 4 },
  inputInner: { flex: 1, fontSize: 14, color: '#0F172A', height: '100%' },
  error: { fontSize: 12, color: '#B42318' },

  saveBtn: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.logoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});