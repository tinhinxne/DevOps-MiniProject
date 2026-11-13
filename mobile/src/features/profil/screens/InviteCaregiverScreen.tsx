import { useState } from 'react';
import {
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
import { SubPageHeader } from '../components/SubPageHeader';
import { Stepper } from '../components/Stepper';

const BORDER = '#D6E6F5';
const FIELD_BG = '#F4F8FD';

const RELATIONS = ['Sœur', 'Parent', 'Ami(e)'];

export default function InviteCaregiverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [contact, setContact] = useState('');
  const [relation, setRelation] = useState<string>(RELATIONS[0]);
  const [otherRelation, setOtherRelation] = useState('');
  const [threshold, setThreshold] = useState(3);

  const canSend = firstName.trim().length > 0 && contact.trim().length > 0;

  const selectRelation = (r: string) => {
    setRelation(r);
    setOtherRelation('');
  };

  const onSend = () => {
    if (!canSend) return;
    const finalRelation = otherRelation.trim() || relation;
    // TODO : appeler le service d'invitation avec { firstName, contact, relation: finalRelation, threshold }
    void finalRelation;
    Alert.alert('Invitation envoyée', `${firstName.trim()} va recevoir votre invitation.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
        <SubPageHeader title="Inviter un aidant" />

        {/* Bandeau explicatif */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="mail-outline" size={16} color={colors.logoBlue} />
          </View>
          <Text style={styles.bannerText}>
            Votre aidant reçoit un e-mail d’invitation puis uniquement vos alertes (par exemple
            après plusieurs oublis), même s’il est loin de vous. Pas besoin de compte.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Prénom de l’aidant</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholder="Prénom"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adresse e-mail ou Whatsapp</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="nom@exemple.com"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lien avec vous</Text>
            <View style={styles.chips}>
              {RELATIONS.map((r) => {
                const on = !otherRelation && relation === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => selectRelation(r)}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.otherRow}>
              <Text style={styles.otherLabel}>Autre :</Text>
              <TextInput
                style={[styles.input, styles.otherInput]}
                value={otherRelation}
                onChangeText={setOtherRelation}
                placeholder="Précisez"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.thresholdRow}>
            <View style={styles.thresholdText}>
              <Text style={styles.label}>Prévenir après</Text>
              <Text style={styles.thresholdSub}>Oublis consécutifs avant l’alerte</Text>
            </View>
            <Stepper value={threshold} min={1} max={10} onChange={setThreshold} />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            !canSend && styles.sendBtnDisabled,
            pressed && canSend && { opacity: 0.85 },
          ]}
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}>
          <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
          <Text style={styles.sendText}>Envoyer l’invitation</Text>
        </Pressable>

        <Text style={styles.footer}>Vous pouvez retirer votre aidant à tout moment</Text>
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

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EAF4FC',
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipOn: { backgroundColor: colors.logoBlue, borderColor: colors.logoBlue },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  chipTextOn: { color: '#FFFFFF' },

  otherRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  otherLabel: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  otherInput: { flex: 1, height: 38 },

  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thresholdText: { flex: 1, gap: 2 },
  thresholdSub: { fontSize: 11, color: '#64748B' },

  sendBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.logoBlue,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 11, color: '#64748B' },
});