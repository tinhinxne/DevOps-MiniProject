// mobile/src/utils/api.ts  — remplace ton fichier actuel
// npx expo install expo-secure-store
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Mode = 'patient' | 'aidant';
const toRole = (m: Mode) => (m === 'patient' ? 'PATIENT' : 'AIDANT');

// Hérite de Error : tes anciens `catch (e) { e.message }` continuent de marcher.
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError('Impossible de contacter le serveur.', 0, 'RESEAU');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Erreur ${res.status}`, res.status, data.code);
  return data;
}

type AuthResponse = {
  token: string;
  user: { id: string; nom_util: string; prenom: string; email: string };
  role?: string;
  roles?: string[];
};

export async function login(identifiant: string, password: string, mode: Mode) {
  const data: AuthResponse = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifiant, password, role: toRole(mode) }),
  });
  await SecureStore.setItemAsync('token', data.token);
  return data;
}

// E-mail déjà connu + bon mot de passe -> ajoute juste l'espace manquant.
export async function register(
  nom_util: string,
  prenom: string,
  email: string,
  password: string,
  mode: Mode
) {
  const data: AuthResponse = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nom_util, prenom, email, password, role: toRole(mode) }),
  });
  await SecureStore.setItemAsync('token', data.token);
  return data;
}
// Compte déjà connecté sur ce téléphone : ajoute l'espace via le token, sans mot de passe.
export async function addSpace(mode: Mode) {
  const token = await SecureStore.getItemAsync('token');
  const data: AuthResponse = await apiFetch('/auth/add-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify({ role: toRole(mode) }),
  });
  await SecureStore.setItemAsync('token', data.token);
  return data;
}

// --- Compte mémorisé sur le téléphone (identifiant seulement, jamais le mot de passe) ---
export type SavedAccount = { email: string; prenom?: string; nom_util?: string };
const SAVED_KEY = 'saved_account';

export async function getSavedAccount(): Promise<SavedAccount | null> {
  const raw = await SecureStore.getItemAsync(SAVED_KEY);
  return raw ? (JSON.parse(raw) as SavedAccount) : null;
}
export const saveAccount = (a: SavedAccount) =>
  SecureStore.setItemAsync(SAVED_KEY, JSON.stringify(a));
export const forgetAccount = () => SecureStore.deleteItemAsync(SAVED_KEY);