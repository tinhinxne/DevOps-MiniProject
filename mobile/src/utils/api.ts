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
export type NewPatient = { nom: string; prenom: string; lien: Lien };
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
  patientId?: string; // renseigné pour l'espace PATIENT
  patients?: Patient[];
};

// --- Patient choisi, mémorisé sur le téléphone ---
const SELECTED_KEY = 'selected_patient';

export async function getSelectedPatient(): Promise<SelectedPatient | null> {
  const raw = await SecureStore.getItemAsync(SELECTED_KEY);
  return raw ? (JSON.parse(raw) as SelectedPatient) : null;
}
export const setSelectedPatient = (p: SelectedPatient) =>
  SecureStore.setItemAsync(SELECTED_KEY, JSON.stringify(p));
export const clearSelectedPatient = () => SecureStore.deleteItemAsync(SELECTED_KEY);

// Après une connexion : un PATIENT est son propre patient (sélection automatique).
// Un AIDANT choisit lui-même le patient suivi (écran de sélection).
async function initSelectedPatient(data: AuthResponse) {
  await clearSelectedPatient();
  if (data.role === 'PATIENT' && data.patientId) {
    await setSelectedPatient({ id: data.patientId, nom: '', prenom: data.user.prenom });
  }
}

export async function login(identifiant: string, password: string, mode: Mode) {
  const data: AuthResponse = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifiant, password, role: toRole(mode) }),
  });
  await SecureStore.setItemAsync('token', data.token);
  await initSelectedPatient(data);
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
  await initSelectedPatient(data);
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
  await initSelectedPatient(data);
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

// --- Patient courant (celui choisi sur le téléphone) ---
async function patientCourantId(): Promise<string> {
  const p = await getSelectedPatient();
  if (!p) throw new ApiError('Aucun patient sélectionné.', 0, 'PATIENT_MANQUANT');
  return p.id;
}

// --- Ordonnances ---
export type OrdonnanceApi = {
  id: string;
  patientId: string;
  dateEmission: string | null;
  dateExpiration: string | null;
  photoUrl: string;
  nbMedicaments?: number;
  titre?: string | null;
note?: string | null;
};

// dateEmission / dateExpiration au format AAAA-MM-JJ
export async function creerOrdonnance(body: {
  imageBase64: string;
  dateEmission?: string;
  dateExpiration?: string;
  patientId?: string;
  titre?: string;
note?: string;
}): Promise<OrdonnanceApi> {
  const data = await apiFetch('/ordonnances', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ...body, patientId: body.patientId ?? (await patientCourantId()) }),
  });
  return data.ordonnance;
}

// Liste des ordonnances d'un patient (GET)
export async function listerOrdonnances(patientId?: string): Promise<OrdonnanceApi[]> {
  const id = patientId ?? (await patientCourantId());
  const data = await apiFetch(`/ordonnances?patientId=${encodeURIComponent(id)}`, {
    headers: await authHeaders(),
  });
  return data.ordonnances;
}
export type TraitementApi = {
  id: string;
  ordonnanceId: string | null;
  nom: string;
  dosage: string | null;
  frequence: string | null;
  dureeJours: number | null;
  dateDebut: string;
  instructions: string | null;
  quantite: number;
  stockRestant: number | null;
  seuilStockFaible: number;
  rappels: { moment: string; heure: string }[];
};

export async function listerTraitements(patientId?: string): Promise<TraitementApi[]> {
  const id = patientId ?? (await patientCourantId());
  const data = await apiFetch(`/traitements?patientId=${encodeURIComponent(id)}`, {
    headers: await authHeaders(),
  });
  return data.traitements;
}

// --- Traitements ---
export async function creerTraitement(body: Record<string, unknown>) {
  const data = await apiFetch('/traitements', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ ...body, patientId: body.patientId ?? (await patientCourantId()) }),
  });
  return data.traitement;
}
export async function renouvelerOrdonnance(id: string, dateExpiration: string) {
  const token = await SecureStore.getItemAsync('token');
  const res = await fetch(`${API_URL}/ordonnances/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: JSON.stringify({ dateExpiration }),
  });
  if (!res.ok) throw new Error('Renouvellement impossible.');
  return res.json();
}