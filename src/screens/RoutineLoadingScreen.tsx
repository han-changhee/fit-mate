import { useEffect, useRef } from 'react';
import { AdZone } from '../components/AdZone';
import { fetchRoutine } from '../lib/routineApi';
import type { Routine, UserProfile } from '../types';

const HOME_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_HOME_BANNER_AD_GROUP_ID;

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  onError: () => void;
}

// 전면 광고는 닫으면 다시 이 로딩 화면으로 돌아오는 게 부자연스러워서 쓰지 않는다.
// 대신 AI가 루틴을 계산하는 동안 화면에 배너형 광고 존만 보여주고, 광고 노출/실패
// 여부와 무관하게 루틴 fetch는 계속 진행된다.
export function RoutineLoadingScreen({ profile, onLoaded, onError }: RoutineLoadingScreenProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    fetchRoutine(profile).then(onLoaded).catch(onError);
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
