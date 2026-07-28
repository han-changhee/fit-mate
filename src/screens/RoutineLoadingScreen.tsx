import { useEffect, useRef } from 'react';
import { fetchRoutine } from '../lib/routineApi';
import type { Routine, UserProfile } from '../types';

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  onError: () => void;
}

// 전면 광고는 이 화면이 아니라 홈 화면의 "루틴 생성하기" 버튼 클릭 시점에 띄운다
// (src/lib/fullScreenAd.ts 참고) — 이 화면은 순수하게 루틴 데이터를 받아오는
// 역할만 한다.
export function RoutineLoadingScreen({ profile, onLoaded, onError }: RoutineLoadingScreenProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetchRoutine(profile).then(onLoaded).catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
      <p className="text-sm text-gray-500">AI가 오늘의 루틴을 만들고 있어요...</p>
    </div>
  );
}
