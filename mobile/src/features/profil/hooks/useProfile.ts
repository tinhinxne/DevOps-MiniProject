import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getProfile } from '../services/profileService';
import type { UserProfile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProfile(await getProfile());
    } catch {
      // serveur injoignable : on garde l'ancien état
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { profile, isLoading: profile === null, refresh };
}