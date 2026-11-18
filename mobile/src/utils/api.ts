import { getToken } from './session';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
   console.log('API', path, res.status, data); 
  if (!res.ok) throw new Error(data.message || data.error || `Erreur ${res.status}`);
  return data;
}

export const register = (
  nom_util: string,
  prenom: string,
  email: string,
  password: string
) =>
  apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nom_util, prenom, email, password }),
  });
  export const login = (identifiant: string, password: string) =>
  apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifiant, password }),
  });
  