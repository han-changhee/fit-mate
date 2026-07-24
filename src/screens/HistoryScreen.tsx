interface HistoryScreenProps {
  streakCount: number;
  lastCompletedDate: string | null;
  onBack: () => void;
}

export function HistoryScreen({ streakCount, lastCompletedDate, onBack }: HistoryScreenProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <button type="button" onClick={onBack} className="self-start text-sm text-gray-400">
        ← 뒤로
      </button>

      <h1 className="text-lg font-bold text-gray-800">운동 기록</h1>

      <div className="rounded-2xl bg-blue-50 px-5 py-4">
        <p className="text-xs text-blue-500">연속 운동</p>
        <p className="mt-1 text-2xl font-bold text-blue-600">{streakCount}일째</p>
        {lastCompletedDate && (
          <p className="mt-1 text-xs text-gray-500">마지막 완료일: {lastCompletedDate}</p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        주간 캘린더 · 누적 운동량 통계는 다음 단계에서 추가될 예정이에요.
      </p>
    </div>
  );
}
