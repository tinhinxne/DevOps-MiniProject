import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';

import type { AvatarTone, FollowedPerson, FollowedStatus } from '@/features/profil/data/mockProfile';

const TONES: Record<AvatarTone, { bg: string; fg: string }> = {
  orange: { bg: colors.tintWarning, fg: '#C2410C' },
  green: { bg: colors.tintGreen, fg: colors.aidant },
  blue: { bg: colors.tintBlue, fg: colors.brand },
  violet: { bg: colors.tintViolet, fg: colors.violet },
  yellow: { bg: colors.tintWarning, fg: '#B45309' },
  red: { bg: colors.tintDanger, fg: colors.danger },
};

const STATUS: Record<FollowedStatus, { label: string; bg: string; fg: string }> = {
  alert: { label: 'Alerte', bg: colors.tintDanger, fg: colors.danger },
  attention: { label: 'Attention', bg: colors.tintWarning, fg: '#B45309' },
  ok: { label: 'À jour', bg: colors.tintGreen, fg: colors.aidant },
};

type Props = {
  person: FollowedPerson;
  showBadge?: boolean;
  onPress?: () => void;
};

export default function PersonRow({ person, showBadge = true, onPress }: Props) {
  const tone = TONES[person.tone];
  const status = STATUS[person.status];

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.initials, { color: tone.fg }]}>{person.initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {person.name} <Text style={styles.relation}>· {person.relation}</Text>
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {person.detail}
        </Text>
      </View>

      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
        </View>
      ) : null}

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: fontSize.sm, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: fontSize.sm + 1, fontWeight: '700', color: colors.text },
  relation: { fontSize: fontSize.xs, fontWeight: '400', color: colors.textMuted },
  detail: { fontSize: fontSize.xs + 1, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
});