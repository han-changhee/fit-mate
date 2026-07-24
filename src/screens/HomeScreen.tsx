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
  onStartRoutine: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
}

export function HomeScreen({
  profile,
  streakCount,
  onStartRoutine,
  onShowHistory,
  onShowSettings,
}: HomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-blue-500">핏메이트 🏃</p>
        <button type="button" onClick={onShowSettings} className="text-sm text-gray-400">
          설정
        </button>
      </div>

      <div className="rounded-2xl bg-blue-50 px-5 py-4">
        <p className="text-xs text-blue-500">연속 운동</p>
        <p className="mt-1 text-2xl font-bold text-blue-600">{streakCount}일째</p>
      </div>

      <div className="rounded-2xl border border-gray-200 px-5 py-6 text-center">
        <p className="text-sm text-gray-500">오늘의 목표</p>
        <p className="mt-2 text-base font-bold text-gray-800">
          {toAreaLabels(profile.targetAreas)} 중심 루틴
        </p>
        <button
          type="button"
          onClick={onStartRoutine}
          className="mt-6 w-full rounded-full bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600"
        >
          오늘의 루틴 생성하기
        </button>
      </div>

      <AdBanner adGroupId={HOME_BANNER_AD_GROUP_ID} />

      <button type="button" onClick={onShowHistory} className="text-sm text-gray-400 underline">
        운동 기록 보기
      </button>

      <NotificationSubscribeButton />
    </div>
  );
}
