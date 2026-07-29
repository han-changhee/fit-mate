import { share } from '@apps-in-toss/web-framework';

interface WorkoutCompleteScreenProps {
  streakCount: number;
  onGoHome: () => void;
  onShowHistory: () => void;
}

export function WorkoutCompleteScreen({
  streakCount,
  onGoHome,
  onShowHistory,
}: WorkoutCompleteScreenProps) {
  const handleShare = () => {
    share({ message: `오늘도 운동 완료! ${streakCount}일 연속 달성 중 🔥` }).catch(() => {});
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
      <p className="text-5xl">🔥</p>
      <h1 className="text-3xl font-black tracking-tight uppercase">오늘의 운동 완료!</h1>
      <p className="text-sm font-bold text-lime-400">{streakCount}일 연속 달성 중이에요</p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleShare}
          className="text-sm font-bold text-zinc-500 underline"
        >
          공유하기
        </button>
        <button
          type="button"
          onClick={onShowHistory}
          className="text-sm font-bold text-zinc-500 underline"
        >
          기록 보기
        </button>
      </div>

      <button
        type="button"
        onClick={onGoHome}
        className="mt-4 rounded-full bg-lime-400 px-6 py-3 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300"
      >
        홈으로
      </button>
    </div>
  );
}
