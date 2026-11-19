import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import { colors, spacing } from '@/theme';

type Props = {
  title?: string;
  children: ReactNode;
};

export function MenuSection({ title, children }: Props) {
  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  title: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  // Card a un padding par défaut : on le retire car chaque ligne gère le sien.
  card: { padding: 0 },
});