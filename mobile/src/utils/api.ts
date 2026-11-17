const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
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