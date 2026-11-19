import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { colors, fontSize, spacing } from '@/theme';
import { SubPageHeader } from '@/components/SubPageHeader';
import PersonRow from '@/components/PersonRow';

import { mockFollowed } from '../data/mockProfile';

export default function SelectPersonScreen() {
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: 'medical' | 'rapport' }>();

  const isReport = target === 'rapport';
  const title = isReport ? 'Rapport médical' : 'Profil médical';
  const pathname = isReport ? '/profil-rapport' : '/profil-medical';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SubPageHeader title={title} />

      <Text style={styles.hint}>
        {isReport
          ? 'Pour quelle personne voulez-vous générer le rapport ?'
          : 'De quelle personne voulez-vous voir le profil médical ?'}
      </Text>

      <View style={styles.card}>
        {mockFollowed.map((p, i) => (
          <View key={p.id} style={i > 0 ? styles.sep : undefined}>
            <PersonRow
              person={p}
              showBadge={false}
              onPress={() =>
                router.push({ pathname, params: { personId: p.id } } as unknown as Href)
              }
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  content: { padding: spacing.md, paddingBottom: 120 },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  card: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
});