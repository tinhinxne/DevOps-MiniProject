import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { SubPageHeader } from '../components/SubPageHeader';
import { Stepper } from '../components/Stepper';

const GREEN = '#1F7A4D';

const RECEIVES: { ok: boolean; text: string }[] = [
  { ok: true, text: 'Une alerte quand vous oubliez plusieurs prises' },
  { ok: true, text: 'Par e-mail, où qu\u2019elle soit' },
  { ok: false, text: 'Aucun accès à vos médicaments ni à votre compte' },
];

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

export default function CaregiverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // TODO : remplacer par profile.caregiver (nom, lien, statut de l'invitation, seuil d'oublis)
  const caregiver = { name: 'rania belarbi', relation: 'Sœur', accepted: true };
  const [threshold, setThreshold] = useState(3);

  const onRemove = () => {
    Alert.alert(
      'Retirer mon aidante',
      `${caregiver.name} ne recevra plus vos alertes.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            // TODO : appeler le service de suppression de l'aidante puis router.back()
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}>
      <SubPageHeader title="Mon aidante" />

      {/* Carte aidante */}
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(caregiver.name)}</Text>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroName} numberOfLines={1}>
            {caregiver.name}
          </Text>
          <Text style={styles.heroSub}>Invitée par e-mail · {caregiver.relation}</Text>
          {caregiver.accepted ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Invitation acceptée</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Ce qu'elle reçoit */}
      <Text style={styles.sectionTitle}>CE QU'ELLE REÇOIT</Text>
      <View style={styles.card}>
        {RECEIVES.map((item, i) => (
          <View
            key={item.text}
            style={[styles.receiveRow, i < RECEIVES.length - 1 && styles.rowBorder]}>
            <Ionicons
              name={item.ok ? 'checkmark' : 'close'}
              size={18}
              color={item.ok ? GREEN : '#D92D20'}
            />
            <Text style={styles.receiveText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Seuil d'alerte */}
      <View style={[styles.card, styles.thresholdRow]}>
        <View style={styles.thresholdText}>
          <Text style={styles.thresholdTitle}>Prévenir après</Text>
          <Text style={styles.thresholdSub}>Oublis consécutifs avant l'alerte</Text>
        </View>
        <Stepper value={threshold} min={1} max={10} onChange={setThreshold} />
      </View>

      {/* Actions en bas d'écran */}
      <View style={styles.spacer} />

      <Pressable
        style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/profil-inviter-aidant' as Href)}
        accessibilityRole="button">
        <Ionicons name="mail-outline" size={16} color={colors.logoBlue} />
        <Text style={styles.inviteText}>Inviter une autre aidante par e-mail</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.85 }]}
        onPress={onRemove}
        accessibilityRole="button">
        <Text style={styles.removeText}>Retirer mon aidante</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.md, gap: spacing.sm },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#DFF3EA',
    borderRadius: 20,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: GREEN },
  heroText: { flex: 1, gap: 2 },
  heroName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  heroSub: { fontSize: 12, color: '#475569' },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: GREEN },

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
  receiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  receiveText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#0F172A' },

  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  thresholdText: { flex: 1 },
  thresholdTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  thresholdSub: { fontSize: 11, color: '#64748B', marginTop: 2 },

  spacer: { flex: 1, minHeight: spacing.lg },

  inviteBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#D3E9F8',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteText: { color: colors.logoBlue, fontSize: 14, fontWeight: '700' },
  removeBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FBE1E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
});