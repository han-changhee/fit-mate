import { useCallback, useEffect, useRef, useState } from 'react';
import { AdZone } from '../components/AdZone';
import { fetchRoutine } from '../lib/routineApi';
import { showFullScreenAdIfAvailable } from '../lib/fullScreenAd';
import type { Routine, UserProfile } from '../types';

const ROUTINE_LOADING_AD_GROUP_ID = import.meta.env.PUBLIC_ROUTINE_LOADING_AD_GROUP_ID;
const HOME_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_HOME_BANNER_AD_GROUP_ID;

interface RoutineLoadingScreenProps {
  profile: UserProfile;
  onLoaded: (routine: Routine) => void;
  // 재시도까지 포기했을 때 호출된다. 첫 생성이면 홈으로, 루틴을 다시 만드는
  // 중이었다면 기존 루틴이 남아있는 미리보기로 — 어디로 보낼지는 호출하는
  // 쪽(App.tsx)이 상황에 맞게 결정한다.
  onCancel: () => void;
}

type Status = 'loading' | 'error';

// 로딩바(AI 생성 대기) -> 전면광고 -> 오늘의 루틴 순서로 진행한다. 광고를 먼저
// 띄우면 닫았을 때 아직 로딩 중인 이 화면이 다시 보여 어색하므로, 루틴이 준비된
// 뒤에만 광고를 띄우고 광고가 끝나야(또는 광고가 없으면 곧바로) 다음 화면으로
// 넘어간다. 서버 쪽에서 이미 자체 타임아웃 후 더미 루틴으로 폴백하지만, 그래도
// 완전히 실패하는 경우(오프라인 등)를 대비해 여기서도 재시도 UI를 보여준다.
export function RoutineLoadingScreen({ profile, onLoaded, onCancel }: RoutineLoadingScreenProps) {
  const [status, setStatus] = useState<Status>('loading');
  const startedRef = useRef(false);
  const runIdRef = useRef(0);

  const runFetch = useCallback(() => {
    const runId = ++runIdRef.current;
    setStatus('loading');

    fetchRoutine(profile)
      .then((routine) => {
        if (runId !== runIdRef.current) return;
        showFullScreenAdIfAvailable(ROUTINE_LOADING_AD_GROUP_ID, () => onLoaded(routine));
      })
      .catch(() => {
        if (runId !== runIdRef.current) return;
        setStatus('error');
      });
  }, [profile, onLoaded]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runFetch();
  }, [runFetch]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-4xl">⚠️</p>
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">루틴 생성에 실패했어요</h1>
          <p className="mt-2 text-sm font-bold text-zinc-500">
            네트워크 상태를 확인한 뒤 다시 시도해주세요.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={runFetch}
            className="rounded-full bg-lime-400 py-3 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-zinc-800 py-3 text-sm font-black tracking-wide text-zinc-400 uppercase active:border-zinc-600"
          >
            그만하기
          </button>
        </div>
      </div>
    );
  }

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
