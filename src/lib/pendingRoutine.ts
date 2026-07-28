import { Storage } from '@apps-in-toss/web-framework';
import type { Routine } from '../types';

const STORAGE_KEY = 'PENDING_ROUTINE';

// 전면 광고를 닫을 때 웹뷰가 리로드되면서 앱의 메모리 상태(화면 위치, 방금
// 생성된 루틴)가 통째로 초기화되는 경우가 실기기에서 확인됐다. 그래서 루틴이
// 생성되는 즉시 로컬에 잠깐 저장해두고, 앱이 다시 켜졌을 때 이 값이 있으면
// 홈이 아니라 루틴 미리보기 화면으로 바로 복구한다.
export function savePendingRoutine(routine: Routine): void {
  const serialized = JSON.stringify(routine);
  Storage.setItem(STORAGE_KEY, serialized).catch(() =>
    window.localStorage.setItem(STORAGE_KEY, serialized)
  );
}

export async function consumePendingRoutine(): Promise<Routine | null> {
  const raw = await Storage.getItem(STORAGE_KEY).catch(() =>
    window.localStorage.getItem(STORAGE_KEY)
  );
  if (!raw) return null;

  Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));

  try {
    return JSON.parse(raw) as Routine;
  } catch {
    return null;
  }
}
