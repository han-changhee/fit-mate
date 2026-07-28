import { share } from '@apps-in-toss/web-framework';
import { showFullScreenAdIfAvailable } from '../lib/fullScreenAd';

const REWARD_AD_GROUP_ID = import.meta.env.PUBLIC_REWARD_AD_GROUP_ID;

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
  const handleWatchReward = () => {
    showFullScreenAdIfAvailable(REWARD_AD_GROUP_ID);
  };

  const handleShare = () => {
    share({ message: `오늘도 운동 완료! ${streakCount}일 연속 달성 중 🔥` }).catch(() => {});
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-4xl">🎉</p>
      <h1 className="text-lg font-bold text-gray-800">오늘의 운동 완료!</h1>
      <p className="text-sm text-gray-500">{streakCount}일 연속 달성 중이에요</p>

      <button
        type="button"
        onClick={handleWatchReward}
        className="rounded-full border border-blue-500 px-5 py-2 text-sm font-bold text-blue-500"
      >
        광고 보고 포인트 2배 받기
      </button>

      <div className="flex gap-4">
        <button type="button" onClick={handleShare} className="text-sm text-gray-400 underline">
          공유하기
        </button>
        <button type="button" onClick={onShowHistory} className="text-sm text-gray-400 underline">
          기록 보기
        </button>
      </div>

      <button
        type="button"
        onClick={onGoHome}
        className="mt-4 rounded-full bg-blue-500 px-6 py-3 text-sm font-bold text-white active:bg-blue-600"
      >
        홈으로
      </button>
    </div>
  );
}
