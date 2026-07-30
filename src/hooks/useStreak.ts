import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';

const STORAGE_KEY = 'STREAK_STATE';
const DAY_MS = 86_400_000;

interface StreakState {
  count: number;
  lastCompletedDate: string | null;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString(): string {
  return new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
}

// 오늘이나 어제 완료했어야 스트릭이 이어지고 있다고 본다. 그 외(며칠 쉬었거나
// 한 번도 완료한 적 없음)에는 화면에 예전 숫자가 남아있으면 안 되니 끊긴 것으로 본다.
function isStreakAlive(lastCompletedDate: string | null): boolean {
  if (!lastCompletedDate) return false;
  return lastCompletedDate === todayString() || lastCompletedDate === yesterdayString();
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastCompletedDate: null });

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as StreakState;
        // 저장된 값 자체는 건드리지 않는다(다음 완료 시 markCompletedToday가 알아서
        // 재계산한다) — 화면에 보여줄 상태만 보정해서, 며칠 쉬었는데도 예전 연속
        // 기록이 그대로 남아있는 것처럼 보이는 일을 막는다.
        setStreak(isStreakAlive(parsed.lastCompletedDate) ? parsed : { ...parsed, count: 0 });
      });
  }, []);

  const markCompletedToday = useCallback(() => {
    setStreak((prev) => {
      const today = todayString();
      if (prev.lastCompletedDate === today) return prev;

      const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
      const nextCount = prev.lastCompletedDate === yesterday ? prev.count + 1 : 1;
      const next: StreakState = { count: nextCount, lastCompletedDate: today };

      const serialized = JSON.stringify(next);
      Storage.setItem(STORAGE_KEY, serialized).catch(() =>
        window.localStorage.setItem(STORAGE_KEY, serialized)
      );
      return next;
    });
  }, []);

  const resetStreak = useCallback(() => {
    Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
    setStreak({ count: 0, lastCompletedDate: null });
  }, []);

  return { streak, markCompletedToday, resetStreak };
}
