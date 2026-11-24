import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getMode, setMode as saveMode, type Mode } from '@/utils/api';

export function useMode() {
  const [mode, setModeState] = useState<Mode>('patient');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMode().then((m) => {
        if (active) setModeState(m);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const setMode = useCallback(async (m: Mode) => {
    await saveMode(m);
    setModeState(m);
  }, []);

  return { mode, setMode };
}