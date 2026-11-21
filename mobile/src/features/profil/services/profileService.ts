import { getMyProfile } from '@/utils/api';
import type { UsageMode, UserProfile } from '../types';

export async function getProfile(): Promise<UserProfile> {
  const p = await getMyProfile();
  return {
    firstName: p.prenom,
    lastName: p.nom && p.nom !== p.prenom ? p.nom : '',
    email: p.email,
    roles: p.roles.map((r): UsageMode => (r === 'AIDANT' ? 'aidant' : 'patient')),
  };
}