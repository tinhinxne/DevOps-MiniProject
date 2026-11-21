// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useState } from 'react';
// import {
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { SegmentedTabs } from '../../components';
// import { colors, fontSize, radius, spacing } from '../../theme';
// import { RendezVousTab } from './RendezVousTab';
// import { NotesTab } from './NotesTab';

// type Tab = 'rdv' | 'notes';

// export function RendezVousNotesScreen() {
//   const router = useRouter();
//   const [tab, setTab] = useState<Tab>('rdv');

//   return (
//     <SafeAreaView style={styles.safe}>
//       <KeyboardAvoidingView
//         style={styles.flex}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.content}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.header}>
//             <Pressable
//               onPress={() => router.back()}
//               style={styles.backButton}
//               accessibilityLabel="Retour"
//             >
//               <Ionicons name="chevron-back" size={22} color={colors.text} />
//             </Pressable>
//             <View style={styles.headerText}>
//               <Text style={styles.title}>Rendez-vous et notes</Text>
//               <Text style={styles.subtitle}>Choisissez la personne que vous accompagnez</Text>
//             </View>
//           </View>

//           <SegmentedTabs<Tab>
//             options={[
//               { value: 'rdv', label: 'Rendez-vous' },
//               { value: 'notes', label: 'Notes' },
//             ]}
//             value={tab}
//             onChange={setTab}
//           />

//                    {tab === 'rdv' ? <RendezVousTab /> : <NotesTab />}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.screenBackground },
//   flex: { flex: 1 },
//   content: { padding: spacing.lg, gap: spacing.md },
//   header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: radius.md,
//     backgroundColor: colors.card,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: colors.text,
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2,
//   },
//   headerText: { flex: 1, gap: 2 },
//   title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
//   subtitle: { fontSize: fontSize.sm, color: colors.textSoft },
// });




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
import { SegmentedTabs } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { NotesTab } from './NotesTab';
import { RendezVousTab } from './RendezVousTab';

type Tab = 'rdv' | 'notes';

export function RendezVousNotesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('rdv');

  // Retour à l'accueil (flèche retour et boutons Enregistrer)
  const goHome = () => router.navigate('/(tabs)');

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
          <View style={styles.header}>
            <Pressable
              onPress={goHome}
              style={styles.backButton}
              accessibilityLabel="Retour à l'accueil"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title}>Rendez-vous et notes</Text>
              <Text style={styles.subtitle}>Choisissez la personne que vous accompagnez</Text>
            </View>
          </View>

          <SegmentedTabs<Tab>
            options={[
              { value: 'rdv', label: 'Rendez-vous' },
              { value: 'notes', label: 'Notes' },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === 'rdv' ? (
            <RendezVousTab onSaved={goHome} />
          ) : (
            <NotesTab onSaved={goHome} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screenBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSoft },
});