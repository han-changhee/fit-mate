import { useEffect, useRef } from 'react';
import { AdBanner } from '../components/AdBanner';
import { fetchRoutine } from '../lib/routineApi';
import type { Routine, UserProfile } from '../types';

// 전면(인터스티셜) 광고는 닫을 때 토스 웹뷰가 리로드되면서 화면 상태가 초기화되는
// 문제가 실기기에서 확인돼 이 화면에서는 쓰지 않는다. 대신 닫기 버튼이 없는
// 배너 광고를 로딩 스피너 자리에 끼워 넣는 방식으로 대기 시간을 채운다.
const LOADING_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_HOME_BANNER_AD_GROUP_ID;

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
    fetchRoutine(profile).then(onLoaded).catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-gray-500">AI가 오늘의 루틴을 만들고 있어요...</p>
      <AdBanner adGroupId={LOADING_BANNER_AD_GROUP_ID} />
    </div>
  );
}
