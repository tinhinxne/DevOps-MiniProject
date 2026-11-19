import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

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
import { BrandHeader, Button, Input, ModeCard } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { addSpace, getSavedAccount, register, saveAccount, type Mode, type SavedAccount } from '../../utils/api';

export function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(() => {
  return params.mode === 'patient' || params.mode === 'aidant'
    ? params.mode
    : 'aidant';
});
  const [prenom, setPrenom] = useState('');
  const [nomUtil, setNomUtil] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  // Compte déjà mémorisé sur ce téléphone -> proposé pour ajouter un 2e espace
  const [saved, setSaved] = useState<SavedAccount | null>(null);
  const [useSaved, setUseSaved] = useState(false);
const [needPassword, setNeedPassword] = useState(false); // token expiré -> mot de passe demandé
const quick = useSaved && !!saved && !needPassword;
 useEffect(() => {
  getSavedAccount().then((acc) => {
    if (acc) {
      setSaved(acc);
      setUseSaved(true);
    }
  });
}, []);

  const handleRegister = async () => {
    if (loading) return;
    setError('');
        if (quick) {
      setLoading(true);
      try {
        const data = await addSpace(mode);
        await saveAccount({
          email: data.user.email,
          prenom: data.user.prenom,
          nom_util: data.user.nom_util,
        });
        router.replace(mode === 'aidant' ? '/patient-suivi' : '/(tabs)');
      } catch (e: any) {
        if (e.code === 'TOKEN_INVALIDE') {
          setNeedPassword(true);
          setError('Session expirée : entrez votre mot de passe.');
        } else {
          setError(e.message || 'Impossible de contacter le serveur.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (useSaved && saved) {
      if (!password) {
        setError('Entrez le mot de passe de ce compte.');
        return;
      }
    } else {
      if (!prenom.trim() || !nomUtil.trim() || !email.trim() || !password) {
        setError('Tous les champs sont obligatoires.');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir 8 caractères minimum.');
        return;
      }
    }

    setLoading(true);
    try {

      const data =
        useSaved && saved
          ? await register('', saved.prenom ?? '', saved.email, password, mode)
          : await register(nomUtil.trim(), prenom.trim(), email.trim(), password, mode);

     await saveAccount({
      email: data.user.email,
        prenom: data.user.prenom,
        nom_util: data.user.nom_util,
      });

      // Proche -> choix des patients suivis (skippable) ; Ma santé -> accueil
      router.replace(mode === 'aidant' ? '/patient-suivi' : '/(tabs)');

    } catch (e: any) {
      setError(e.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const personIcon = <Ionicons name="person-outline" size={20} color={colors.textMuted} />;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader />

          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={24} color={colors.brand} />
            </View>
            <Text style={styles.title}>
              Créer votre <Text style={styles.titleAccent}>compte</Text>
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Choisissez comment vous souhaitez utiliser Maw3idi.
          </Text>

          <Text style={styles.sectionLabel}>{"J'utilise Maw3idi pour"}</Text>
          <View style={styles.modeRow}>
            <ModeCard
              title="Ma santé"
              subtitle="Suivre mes propres prises"
              icon="pill"
              accent={colors.brand}
              selected={mode === 'patient'}
              onPress={() => setMode('patient')}
            />
            <ModeCard
              title="Un proche"
              subtitle="Accompagner un proche"
              icon="heart-outline"
              accent={colors.modeSelected}
              selected={mode === 'aidant'}
              onPress={() => setMode('aidant')}
            />
          </View>

          {saved && (
            <View style={styles.savedBox}>
              <Text style={styles.savedText}>
                {useSaved
                  
                  ? `Continuer avec le compte @${saved.nom_util ?? saved.email}`
                  : 'Un compte est mémorisé sur ce téléphone'}
              </Text>
              <Pressable onPress={() => setUseSaved((v) => !v)} hitSlop={8}>
                <Text style={styles.savedLink}>
                  {useSaved ? 'Utiliser un autre compte' : 'Utiliser ce compte'}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.form}>
            {!(useSaved && saved) && (
              <>
                <Input
                  label="Prénom"
                  labelColor={colors.textSoft}
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholder="Votre prénom"
                  leftIcon={personIcon}
                />
                <Input
                  label="Nom d'utilisateur"
                  labelColor={colors.textSoft}
                  value={nomUtil}
                  onChangeText={setNomUtil}
                  placeholder="Choisissez un nom d'utilisateur"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={personIcon}
                />
                <Input
                  label="Adresse e-mail"
                  labelColor={colors.textSoft}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nom@exemple.fr"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
                />
              </>
            )}
            
              {!quick && (
            <Input
             label="Mot de passe"
              labelColor={colors.textSoft}
              value={password}
              onChangeText={setPassword}
              placeholder={useSaved && saved ? 'Mot de passe de ce compte' : '8 caractères minimum'}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityLabel={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              }
            />
             
            )}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={loading ? 'Création...' : quick ? 'Continuer' : 'Créer mon compte'}
            variant="brand"
            onPress={handleRegister}
            disabled={loading}
            rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.white} />}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="Déjà un compte ? Se connecter"
            variant="light"
            onPress={() => router.replace('/login')}
          />

          <Text style={styles.footer}>
            Vos données de santé sont chiffrées et protégées.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.authBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.tintBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  titleAccent: { color: colors.brand },
  subtitle: { fontSize: fontSize.md, color: colors.textSoft },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSoft,
    marginTop: spacing.sm,
  },
  modeRow: { flexDirection: 'row', gap: spacing.md },
  savedBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.tintBlue,
  },
  savedText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  savedLink: { fontSize: fontSize.sm, color: colors.brand, fontWeight: '700' },
  form: { gap: spacing.md, marginTop: spacing.sm },
  error: { color: 'red', fontSize: fontSize.sm, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.modeBorder,
  },
  dividerText: { fontSize: fontSize.sm, color: colors.textSoft },
  footer: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});