import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { spacing } from '@/theme';

type Props = { title: string };

export function SubPageHeader({ title }: Props) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color="#0F172A" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
});