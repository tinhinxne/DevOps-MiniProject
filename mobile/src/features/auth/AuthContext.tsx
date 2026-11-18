import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { clearToken, getToken, saveToken } from '../../utils/session';

type User = { id: string; nom_util: string; prenom: string; email: string };
type AuthData = { token: string; user: User };
type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (d: AuthData) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Au lancement : si un token existe, on récupère l'utilisateur
  useEffect(() => {
    (async () => {
      try {
        if (await getToken()) {
          const { user } = await apiFetch('/auth/me');
          setUser(user);
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async ({ token, user }: AuthData) => {
    await saveToken(token);
    setUser(user);
  };
  const signOut = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}