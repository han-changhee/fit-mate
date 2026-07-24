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

export function useStreak() {
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastCompletedDate: null });

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        if (raw) setStreak(JSON.parse(raw));
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

  return { streak, markCompletedToday };
}
