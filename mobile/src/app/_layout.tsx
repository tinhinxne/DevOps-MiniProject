import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AuthProvider } from '../features/auth/AuthContext';

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

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}