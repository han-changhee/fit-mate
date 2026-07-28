import { useEffect, useRef } from 'react';
import { fetchRoutine } from '../lib/routineApi';
import { showFullScreenAdIfAvailable } from '../lib/fullScreenAd';
import type { Routine, UserProfile } from '../types';

const ROUTINE_LOADING_AD_GROUP_ID = import.meta.env.PUBLIC_ROUTINE_LOADING_AD_GROUP_ID;

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  onError: () => void;
}

export function RoutineLoadingScreen({ profile, onLoaded, onError }: RoutineLoadingScreenProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // 전면 광고는 사용자가 루틴 생성을 기다리는 이 구간에만 노출한다. 광고
    // 로드/노출과 무관하게 루틴 fetch는 그대로 진행된다.
    showFullScreenAdIfAvailable(ROUTINE_LOADING_AD_GROUP_ID);
    fetchRoutine(profile).then(onLoaded).catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
      <p className="text-sm text-gray-500">AI가 오늘의 루틴을 만들고 있어요...</p>
    </div>
  );
}
