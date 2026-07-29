import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import type { Routine } from '../types';

const STORAGE_KEY = 'ACTIVE_SESSION';

export interface ActiveSession {
  routine: Routine;
  completedIndices: number[];
}

// 운동 도중 앱이 종료됐다 다시 열려도 어디까지 했는지 이어갈 수 있도록, 진행 중인
// 루틴/완료 인덱스를 기기에 저장해둔다. 세트/타이머 같은 세부 진행 상태까지는
// 저장하지 않는다 — 어떤 운동을 완료했는지만 복원해도 처음부터 다시 하는 것보다
// 훨씬 낫고, 구현이 단순하다.
export function useActiveSession() {
  // undefined = 아직 로딩 중, null = 진행 중인 세션 없음
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        setSession(raw ? JSON.parse(raw) : null);
      });
  }, []);

  const saveSession = useCallback((next: ActiveSession) => {
    const serialized = JSON.stringify(next);
    Storage.setItem(STORAGE_KEY, serialized).catch(() =>
      window.localStorage.setItem(STORAGE_KEY, serialized)
    );
    setSession(next);
  }, []);

  const clearSession = useCallback(() => {
    Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
    setSession(null);
  }, []);

  return { session, saveSession, clearSession };
}
