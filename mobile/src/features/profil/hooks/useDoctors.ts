import { useSyncExternalStore } from 'react';

import type { Doctor } from '../types';

// Un store partagé par tous les écrans. Clé = personId (aidant) ou 'me' (patient).
// Données de démo, à remplacer par l'API / AsyncStorage plus tard.
let store: Record<string, Doctor[]> = {
  me: [{ id: '1', name: 'Dr. Benali', specialty: 'Cardiologue' }],
};
const EMPTY: Doctor[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useDoctors(personId?: string) {
  const key = personId ?? 'me';
  const doctors = useSyncExternalStore(subscribe, () => store[key] ?? EMPTY);

  const add = (name: string, specialty: string) => {
    store = {
      ...store,
      [key]: [...(store[key] ?? []), { id: Date.now().toString(), name, specialty }],
    };
    emit();
  };

  const remove = (id: string) => {
    store = { ...store, [key]: (store[key] ?? []).filter((d) => d.id !== id) };
    emit();
  };

  return { doctors, add, remove };
}