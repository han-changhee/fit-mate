import { useEffect, useRef } from 'react';
import { AdZone } from '../components/AdZone';
import { fetchRoutine } from '../lib/routineApi';
import { showFullScreenAdIfAvailable } from '../lib/fullScreenAd';
import type { Routine, UserProfile } from '../types';

const ROUTINE_LOADING_AD_GROUP_ID = import.meta.env.PUBLIC_ROUTINE_LOADING_AD_GROUP_ID;
const HOME_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_HOME_BANNER_AD_GROUP_ID;

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  onError: () => void;
}

// 로딩바(AI 생성 대기) -> 전면광고 -> 오늘의 루틴 순서로 진행한다. 광고를 먼저
// 띄우면 닫았을 때 아직 로딩 중인 이 화면이 다시 보여 어색하므로, 루틴이 준비된
// 뒤에만 광고를 띄우고 광고가 끝나야(또는 광고가 없으면 곧바로) 다음 화면으로
// 넘어간다.
export function RoutineLoadingScreen({ profile, onLoaded, onError }: RoutineLoadingScreenProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    fetchRoutine(profile)
      .then((routine) => {
        showFullScreenAdIfAvailable(ROUTINE_LOADING_AD_GROUP_ID, () => onLoaded(routine));
      })
      .catch(onError);
  }, [profile, onLoaded, onError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 py-8 text-white">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-lime-400 uppercase">
          AI 루틴 생성 중
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight uppercase">
          잠깐, 바로 시작할게요 🔥
        </h1>
        <p className="mt-2 text-sm font-bold text-zinc-500">
          몸 풀면서 광고 하나 보고 가실게요
        </p>
      </div>

      <div className="flex gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400" />
      </div>

      <AdZone bannerAdGroupId={HOME_BANNER_AD_GROUP_ID} label="Sponsored" variant="expanded" />
    </div>
  );
}
