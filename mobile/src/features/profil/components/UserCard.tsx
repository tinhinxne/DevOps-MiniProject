import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme';
import type { UserProfile } from '../types';

type Props = {
  profile: UserProfile;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UserCard({ profile }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(profile.firstName, profile.lastName)}</Text>
      </View>
      <Text style={styles.name}>
        {profile.firstName} {profile.lastName}
      </Text>
      <Text style={styles.email}>{profile.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.patientLight,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  initials: { fontSize: fontSize.lg, fontWeight: '700', color: colors.patient },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textMuted },
});