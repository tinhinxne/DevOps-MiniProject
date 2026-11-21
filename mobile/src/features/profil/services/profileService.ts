import { mockProfile } from '../data/mockProfile';
import type { UserProfile } from '../types';

// TODO: remplacer par la lecture SQLite (hors ligne), puis l'API quand le backend sera prêt.
export async function getProfile(): Promise<UserProfile> {
  return mockProfile;
}