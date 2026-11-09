import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import type { ColorValue } from 'react-native';

const icon = (name: keyof typeof Ionicons.glyphMap) =>
   ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.patient, headerTitleAlign: 'center' }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="ordonnances" options={{ title: 'Ordonnances', tabBarIcon: icon('document-text') }} />
      <Tabs.Screen name="suivi" options={{ title: 'Suivi', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}