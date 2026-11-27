import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AuthProvider } from '../features/auth/AuthContext';
import { initNotifications } from '../utils/rappels';

export default function RootLayout() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const started = useRef(false);

  // Au démarrage uniquement : on affiche le splash, une seule fois
  useEffect(() => {
    if (!navigationState?.key || started.current) return;
    started.current = true;
    router.replace('/splash');
  }, [navigationState?.key, router]);

  // Notifications : canaux Android + ouverture de la cloche au clic sur une notification
  useEffect(() => {
    initNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/boite-notifications' as never);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}