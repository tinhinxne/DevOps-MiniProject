import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

type Mode = 'patient' | 'aidant';

export function RegisterScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('patient');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
  // TODO: brancher la vraie création de compte quand elle existera
  router.replace('/(tabs)'); // adapte avec ta vraie route d'accueil
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
            Choisissez comment vous souhaitez utiliser Mawdi3i.
          </Text>

          <Text style={styles.sectionLabel}>{"J'utilise Mawdi3i pour"}</Text>
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

          <View style={styles.form}>
            <Input
              label="Nom d'utilisateur"
              labelColor={colors.textSoft}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              leftIcon={personIcon}
            />
            <Input
              label="Pseudo"
              labelColor={colors.textSoft}
              value={username}
              onChangeText={setUsername}
              placeholder="Votre nom d'utilisateur"
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
            <Input
              label="Mot de passe"
              labelColor={colors.textSoft}
              value={password}
              onChangeText={setPassword}
              placeholder="8 caractères minimum"
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
          </View>

          <Button
            title="Créer mon compte"
            variant="brand"
            onPress={handleRegister}
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
  form: { gap: spacing.md, marginTop: spacing.sm },
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