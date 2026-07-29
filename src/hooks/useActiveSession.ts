import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import type { Routine } from '../types';

const STORAGE_KEY = 'ACTIVE_SESSION';

export interface ActiveSession {
  date: string;
  routine: Routine;
  completedIndices: number[];
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// 오늘의 루틴을 기기에 저장해둔다 — 두 가지 목적이다.
// 1) 운동 도중 앱이 종료됐다 다시 열려도 어디까지 했는지 이어갈 수 있다.
// 2) 루틴 미리보기에서 실수로 "뒤로"를 눌러 홈으로 나가도, 같은 날짜라면
//    AI를 다시 호출하지 않고 그대로 이어볼 수 있다.
// 세트/타이머 같은 세부 진행 상태까지는 저장하지 않는다 — 어떤 운동을 완료했는지만
// 복원해도 처음부터 다시 하는 것보다 훨씬 낫고, 구현이 단순하다.
// "오늘의 루틴"이라는 성격상 날짜가 바뀌면 더 이상 유효하지 않은 것으로 본다.
export function useActiveSession() {
  // undefined = 아직 로딩 중, null = 유효한 세션 없음(없거나 날짜가 지남)
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        if (!raw) {
          setSession(null);
          return;
        }

        const parsed = JSON.parse(raw) as ActiveSession;
        if (parsed.date !== todayString()) {
          Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
          setSession(null);
          return;
        }

        setSession(parsed);
      });
  }, []);

  const saveSession = useCallback((next: Omit<ActiveSession, 'date'>) => {
    const full: ActiveSession = { ...next, date: todayString() };
    const serialized = JSON.stringify(full);
    Storage.setItem(STORAGE_KEY, serialized).catch(() =>
      window.localStorage.setItem(STORAGE_KEY, serialized)
    );
    setSession(full);
  }, []);

  const clearSession = useCallback(() => {
    Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
    setSession(null);
  }, []);

  return { session, saveSession, clearSession };
}
