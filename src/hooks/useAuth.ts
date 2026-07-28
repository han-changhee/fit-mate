import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';

const STORAGE_KEY = 'AUTH_SESSION';

interface AuthSession {
  authorizationCode: string;
  loggedInAt: string;
}

export function useAuth() {
  // undefined = 아직 로딩 중, null = 로그인 안 됨
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        setSession(raw ? JSON.parse(raw) : null);
      });
  }, []);

  const login = useCallback((authorizationCode: string) => {
    const next: AuthSession = { authorizationCode, loggedInAt: new Date().toISOString() };
    const serialized = JSON.stringify(next);
    Storage.setItem(STORAGE_KEY, serialized).catch(() =>
      window.localStorage.setItem(STORAGE_KEY, serialized)
    );
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
    setSession(null);
  }, []);

  return { session, login, logout };
}
