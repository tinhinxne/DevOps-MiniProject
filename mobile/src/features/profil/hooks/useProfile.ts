import { useEffect, useState } from 'react';

import { getProfile } from '../services/profileService';
import type { UserProfile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;
    getProfile().then((data) => {
      if (active) setProfile(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return { profile, isLoading: profile === null };
}