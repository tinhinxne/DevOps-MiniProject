import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Mode = 'patient' | 'aidant';
const toRole = (m: Mode) => (m === 'patient' ? 'PATIENT' : 'AIDANT');

// --- Patients suivis ---
export type Lien = 'PARENT' | 'CONJOINT' | 'ENFANT' | 'AMI' | 'AUTRE';
export const LIENS: { value: Lien; label: string }[] = [
  { value: 'PARENT', label: 'Parent' },
  { value: 'CONJOINT', label: 'Conjoint(e)' },
  { value: 'ENFANT', label: 'Enfant' },
  { value: 'AMI', label: 'Ami(e)' },
  { value: 'AUTRE', label: 'Autre' },
];
export type NewPatient = { nom: string; prenom: string; lien: Lien; lien_precision?: string };
export type Patient = NewPatient & { id: string };
export type SelectedPatient = { id: string; nom: string; prenom: string };

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

async function authHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` };
}

type AuthResponse = {
  token: string;
  user: { id: string; nom_util: string; prenom: string; email: string };
  role?: string;
  roles?: string[];
  patients?: Patient[];
};

export async function login(identifiant: string, password: string, mode: Mode) {
  const data: AuthResponse = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifiant, password, role: toRole(mode) }),
  });
  await SecureStore.setItemAsync('token', data.token);
  await setMode(mode);
  await clearSelectedPatient(); // le choix est refait à chaque connexion
  return data;
}

// E-mail déjà connu + bon mot de passe -> ajoute juste l'espace manquant.
export async function register(
  nom_util: string,
  prenom: string,
  email: string,
  password: string,
  mode: Mode,
  patients?: NewPatient[]
) {
  const data: AuthResponse = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nom_util,
      prenom,
      email,
      password,
      role: toRole(mode),
      patients: mode === 'aidant' ? patients : undefined,
    }),
  });
  await SecureStore.setItemAsync('token', data.token);
  await setMode(mode);
  await clearSelectedPatient();
  return data;
}

// Compte déjà connecté sur ce téléphone : ajoute l'espace via le token, sans mot de passe.
export async function addSpace(mode: Mode, patients?: NewPatient[]) {
  const data: AuthResponse = await apiFetch('/auth/add-role', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      role: toRole(mode),
      patients: mode === 'aidant' ? patients : undefined,
    }),
  });
  await SecureStore.setItemAsync('token', data.token);
  await setMode(mode);
  await clearSelectedPatient();
  return data;
}

// --- Patients suivis (espace proche) ---
export async function getPatientsSuivis(): Promise<Patient[]> {
  const data = await apiFetch('/patients/suivis', { headers: await authHeaders() });
  return data.patients;
}

export async function addPatientsSuivis(patients: NewPatient[]): Promise<Patient[]> {
  const data = await apiFetch('/patients/suivis', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ patients }),
  });
  return data.patients;
}

// --- Patient choisi, mémorisé sur le téléphone ---
const SELECTED_KEY = 'selected_patient';

export async function getSelectedPatient(): Promise<SelectedPatient | null> {
  const raw = await SecureStore.getItemAsync(SELECTED_KEY);
  return raw ? (JSON.parse(raw) as SelectedPatient) : null;
}
export const setSelectedPatient = (p: SelectedPatient) =>
  SecureStore.setItemAsync(SELECTED_KEY, JSON.stringify(p));
export const clearSelectedPatient = () => SecureStore.deleteItemAsync(SELECTED_KEY);

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

// --- Profil (infos personnelles) ---
export type ProfileData = {
  id: string;
  nom_util: string;
  prenom: string;
  nom: string | null;
  email: string;
  telephone: string | null;
  date_naissance: string | null; // AAAA-MM-JJ
  roles: ('PATIENT' | 'AIDANT')[];
};

export type ProfileUpdate = {
  nom_util?: string;
  prenom: string;
  nom?: string;
  email: string;
  telephone: string | null;
  date_naissance: string | null;
};

export async function getMyProfile(): Promise<ProfileData> {
  const data = await apiFetch('/profile', { headers: await authHeaders() });
  return data.profile;
}

export async function updateMyProfile(body: ProfileUpdate): Promise<ProfileData> {
  const data = await apiFetch('/profile', {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return data.profile;
}

// --- Mode courant (patient / aidant), mémorisé sur le téléphone ---
const MODE_KEY = 'mode';

export async function getMode(): Promise<Mode> {
  const m = await SecureStore.getItemAsync(MODE_KEY);
  return m === 'aidant' ? 'aidant' : 'patient';
}
export const setMode = (m: Mode) => SecureStore.setItemAsync(MODE_KEY, m);

// --- Invitation d'un aidant (e-mail ou WhatsApp) ---
export type InviteCanal = 'EMAIL' | 'WHATSAPP';

export type NewInvitation = {
  prenom: string;
  contact: string; // e-mail, ou numéro au format international sans « + » (213541648814)
  canal: InviteCanal;
  lien: string; // Sœur, Parent, Ami(e) ou texte libre
  seuil_oublis: number; // nombre d'oublis consécutifs avant l'alerte
};

export type InvitationResult = {
  canal: InviteCanal;
  invite_url?: string; // lien d'invitation, renvoyé par le back (utilisé pour WhatsApp)
};

export async function inviteAidant(body: NewInvitation): Promise<InvitationResult> {
  const data = await apiFetch('/aidants/invitations', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  return data.invitation;
}

// --- Profil médical (patient ou personne suivie) ---
export type Medecin = { id: string; nom: string; specialite: string | null };

export type HabitudesRepas = {
  reveil: string | null;
  petit_dejeuner: string | null;
  dejeuner: string | null;
  diner: string | null;
  coucher: string | null;
};

export type MedicalProfile = {
  person: { prenom: string; nom: string };
  maladies_chroniques: string | null;
  allergies: string | null;
  habitudes: HabitudesRepas;
  medecins: Medecin[];
};

export type MedicalUpdate = {
  maladies_chroniques: string | null;
  allergies: string | null;
  habitudes: HabitudesRepas;
};

// personId absent = son propre profil ; présent = une personne accompagnée
const personQuery = (personId?: string) =>
  personId ? `?personId=${encodeURIComponent(personId)}` : '';

export async function getMedical(personId?: string): Promise<MedicalProfile> {
  const data = await apiFetch(`/medical${personQuery(personId)}`, { headers: await authHeaders() });
  return data.profile;
}

export async function saveMedical(body: MedicalUpdate, personId?: string): Promise<void> {
  await apiFetch(`/medical${personQuery(personId)}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
}

export async function addMedecin(
  nom: string,
  specialite: string,
  personId?: string
): Promise<Medecin> {
  const data = await apiFetch(`/medical/medecins${personQuery(personId)}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ nom, specialite }),
  });
  return data.medecin;
}

export async function removeMedecin(id: string, personId?: string): Promise<void> {
  await apiFetch(`/medical/medecins/${encodeURIComponent(id)}${personQuery(personId)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
}