interface HistoryScreenProps {
  streakCount: number;
  lastCompletedDate: string | null;
  onBack: () => void;
}

export function HistoryScreen({ streakCount, lastCompletedDate, onBack }: HistoryScreenProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-black px-6 py-8 text-white">
      <button type="button" onClick={onBack} className="self-start text-sm font-bold text-zinc-500">
        ← 뒤로
      </button>

      <h1 className="text-2xl font-black tracking-tight uppercase">운동 기록</h1>

      <div className="rounded-2xl border border-lime-400/30 bg-zinc-900 px-5 py-4">
        <p className="text-xs font-bold tracking-widest text-lime-400 uppercase">연속 운동</p>
        <p className="mt-1 text-3xl font-black text-white">
          {streakCount}
          <span className="text-lg text-zinc-500">일째</span>
        </p>
        {lastCompletedDate && (
          <p className="mt-1 text-xs font-bold text-zinc-500">마지막 완료일: {lastCompletedDate}</p>
        )}
      </div>

      <p className="text-xs font-bold text-zinc-600">
        주간 캘린더 · 누적 운동량 통계는 다음 단계에서 추가될 예정이에요.
      </p>
    </div>
  );
}
