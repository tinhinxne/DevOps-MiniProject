import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="ordonnances" options={{ title: 'Traitements' }} />
     
      <Tabs.Screen name="suivi" options={{ title: 'Suivi' }} />
      <Tabs.Screen name="profil" options={{ title: 'Moi' }} />
    </Tabs>
  );
}