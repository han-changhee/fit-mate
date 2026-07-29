interface RoutineErrorScreenProps {
  onRetry: () => void;
  onExit: () => void;
  // 재생성 중 실패라면 기존 루틴이 남아있는 미리보기로 돌아갈 수 있어서
  // 버튼 문구가 달라진다.
  hasExistingRoutine: boolean;
}

export function RoutineErrorScreen({ onRetry, onExit, hasExistingRoutine }: RoutineErrorScreenProps) {
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
          onClick={onRetry}
          className="rounded-full bg-lime-400 py-3 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-zinc-800 py-3 text-sm font-black tracking-wide text-zinc-400 uppercase active:border-zinc-600"
        >
          {hasExistingRoutine ? '루틴으로 돌아가기' : '홈으로'}
        </button>
      </div>
    </div>
  );
}
