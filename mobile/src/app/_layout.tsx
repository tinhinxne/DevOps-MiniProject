// // import { Stack } from 'expo-router';

// // export default function RootLayout() {
// //   return <Stack screenOptions={{ headerShown: false }} />;
// // }



// import { Stack, useRootNavigationState, useRouter } from 'expo-router';
// import { useEffect } from 'react';

// export default function RootLayout() {
//   const router = useRouter();
//   const navigationState = useRootNavigationState();

//   // Au démarrage, on affiche le splash (dès que la navigation est prête)
//   useEffect(() => {
//     if (!navigationState?.key) return;
//     router.replace('/splash');
//   },[navigationState?.key, router]);

//   return <Stack screenOptions={{ headerShown: false }} />;
// }




import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

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

  return <Stack screenOptions={{ headerShown: false }} />;
}