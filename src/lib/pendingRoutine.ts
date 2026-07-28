import { Storage } from '@apps-in-toss/web-framework';
import type { Routine } from '../types';

const STORAGE_KEY = 'PENDING_ROUTINE';

// 전면 광고를 닫을 때 웹뷰가 리로드되면서 앱의 메모리 상태(화면 위치, 방금
// 생성된 루틴)가 통째로 초기화되는 경우가 실기기에서 확인됐다. 그래서 루틴이
// 생성되는 즉시 로컬에 저장해두고, 앱이 다시 켜졌을 때 이 값이 있으면 홈이
// 아니라 루틴 미리보기 화면으로 바로 복구한다.
//
// window.localStorage는 동기 API라 리로드 직전에도 기록이 확실히 끝난다.
// Storage(토스 네이티브 브릿지)는 비동기라, 저장을 호출한 직후 곧바로
// 리로드가 발생하면(광고를 빨리 닫는 경우) 네이티브 쪽 기록이 채 끝나기 전에
// 유실될 수 있다 — 그래서 localStorage를 1차 수단으로 삼고 Storage는
// best-effort로만 같이 써둔다.
export function savePendingRoutine(routine: Routine): void {
  const serialized = JSON.stringify(routine);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰는 경우는 무시한다.
  }
  Storage.setItem(STORAGE_KEY, serialized).catch(() => {});
}

export async function consumePendingRoutine(): Promise<Routine | null> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) {
    raw = (await Storage.getItem(STORAGE_KEY).catch(() => null)) ?? null;
  }
  if (!raw) return null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
  Storage.removeItem(STORAGE_KEY).catch(() => {});

  try {
    return JSON.parse(raw) as Routine;
  } catch {
    return null;
  }
}
