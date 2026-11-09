import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, spacing, fontSize } from '../theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Écran à développer</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md, justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginTop: spacing.xs },
});