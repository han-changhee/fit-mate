import { useEffect, useRef } from 'react';
import { fetchRoutine } from '../lib/routineApi';
import { savePendingRoutine } from '../lib/pendingRoutine';
import { showFullScreenAdIfAvailable } from '../lib/fullScreenAd';
import type { Routine, UserProfile } from '../types';

const ROUTINE_LOADING_AD_GROUP_ID = import.meta.env.PUBLIC_ROUTINE_LOADING_AD_GROUP_ID;

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  onError: () => void;
}

// 전면 광고를 닫으면 토스 웹뷰가 리로드되면서 화면 상태가 날아가는 게 실기기에서
// 확인됐다. 그래서 광고는 루틴을 다 받아오고 로컬에 안전하게 저장까지 끝낸
// "이후"에만 띄운다 — 저장이 끝나기 전에 광고를 보여주면, 사용자가 광고를 빨리
// 닫을 경우 저장이 채 끝나기도 전에 리로드가 나서 복구할 데이터가 없어진다.
export function RoutineLoadingScreen({ profile, onLoaded, onError }: RoutineLoadingScreenProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetchRoutine(profile)
      .then((routine) => {
        savePendingRoutine(routine);
        showFullScreenAdIfAvailable(ROUTINE_LOADING_AD_GROUP_ID);
        onLoaded(routine);
      })
      .catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
      <p className="text-sm text-gray-500">AI가 오늘의 루틴을 만들고 있어요...</p>
    </div>
  );
}
