import { AdBanner } from '../components/AdBanner';
import { NotificationSubscribeButton } from '../components/NotificationSubscribeButton';
import { TARGET_AREAS } from '../constants/fitnessOptions';
import type { UserProfile } from '../types';

function toAreaLabels(targetAreas: UserProfile['targetAreas']): string {
  return targetAreas
    .map((area) => TARGET_AREAS.find((option) => option.value === area)?.label ?? area)
    .join(', ');
}

const HOME_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_HOME_BANNER_AD_GROUP_ID;

interface HomeScreenProps {
  profile: UserProfile;
  streakCount: number;
  isGeneratingRoutine: boolean;
  onStartRoutine: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
}

export function HomeScreen({
  profile,
  streakCount,
  isGeneratingRoutine,
  onStartRoutine,
  onShowHistory,
  onShowSettings,
}: HomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-black px-6 py-8 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black tracking-widest text-lime-400 uppercase">
          핏메이트 🏃
        </p>
        <button
          type="button"
          onClick={onShowSettings}
          aria-label="설정"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 active:border-lime-400 active:text-lime-400"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="rounded-2xl border border-lime-400/30 bg-zinc-900 px-5 py-4">
        <p className="text-xs font-bold tracking-widest text-lime-400 uppercase">연속 운동</p>
        <p className="mt-1 text-3xl font-black text-white">
          {streakCount}
          <span className="text-lg text-zinc-500">일째</span>
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-6 text-center">
        <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">오늘의 목표</p>
        <p className="mt-2 text-xl font-black uppercase">
          {toAreaLabels(profile.targetAreas)} 중심 루틴
        </p>
        <button
          type="button"
          onClick={onStartRoutine}
          disabled={isGeneratingRoutine}
          className="mt-6 w-full rounded-full bg-lime-400 py-3 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {isGeneratingRoutine ? '생성 중...' : '오늘의 루틴 생성하기'}
        </button>
      </div>

      <AdBanner adGroupId={HOME_BANNER_AD_GROUP_ID} />

      <button
        type="button"
        onClick={onShowHistory}
        className="text-sm font-bold text-zinc-500 underline"
      >
        운동 기록 보기
      </button>

      <NotificationSubscribeButton />
    </div>
  );
}
