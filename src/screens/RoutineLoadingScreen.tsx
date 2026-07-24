import { useEffect, useRef } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { fetchRoutine } from '../lib/routineApi';
import { isFullScreenAdSupported } from '../lib/adSupport';
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

    // 전면 광고는 사용자가 루틴 생성을 기다리는 이 구간에만 노출한다.
    // 광고 로드/노출 실패가 루틴 생성 흐름을 막으면 안 되므로 항상 감싼다.
    if (ROUTINE_LOADING_AD_GROUP_ID && isFullScreenAdSupported()) {
      try {
        loadFullScreenAd({
          options: { adGroupId: ROUTINE_LOADING_AD_GROUP_ID },
          onEvent: () => {
            try {
              showFullScreenAd({
                options: { adGroupId: ROUTINE_LOADING_AD_GROUP_ID },
                onEvent: () => {},
                onError: () => {},
              });
            } catch {
              // 노출 실패는 무시한다.
            }
          },
          onError: () => {
            // 로드 실패는 무시한다.
          },
        });
      } catch {
        // 초기화 전 호출 등으로 인한 예외는 무시한다.
      }
    }

    fetchRoutine(profile).then(onLoaded).catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
      <p className="text-sm text-gray-500">AI가 오늘의 루틴을 만들고 있어요...</p>
    </div>
  );
}
