import { useEffect, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isAdInitSupported } from './lib/adSupport';
import { useStreak } from './hooks/useStreak';
import { useUserProfile } from './hooks/useUserProfile';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RoutineLoadingScreen } from './screens/RoutineLoadingScreen';
import { RoutinePreviewScreen } from './screens/RoutinePreviewScreen';
import { WorkoutSessionScreen } from './screens/WorkoutSessionScreen';
import { WorkoutCompleteScreen } from './screens/WorkoutCompleteScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { Routine } from './types';

type Screen = 'home' | 'loading' | 'preview' | 'session' | 'complete' | 'history' | 'settings';

export default function App() {
  const { profile, saveProfile } = useUserProfile();
  const { streak, markCompletedToday } = useStreak();
  const [screen, setScreen] = useState<Screen>('home');
  const [routine, setRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    if (!isAdInitSupported()) return;
    try {
      TossAds.initialize({});
    } catch {
      // 광고 초기화 실패는 앱 전체에 영향을 주면 안 되므로 무시한다.
    }
  }, []);

  if (profile === undefined) {
    return <div className="min-h-screen" />;
  }

  if (profile === null) {
    return <OnboardingScreen onComplete={saveProfile} />;
  }

  if (screen === 'loading') {
    return (
      <RoutineLoadingScreen
        profile={profile}
        onLoaded={(next) => {
          setRoutine(next);
          setScreen('preview');
        }}
        onError={() => setScreen('home')}
      />
    );
  }

  if (screen === 'preview' && routine) {
    return (
      <RoutinePreviewScreen
        routine={routine}
        onStart={() => setScreen('session')}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'session' && routine) {
    return (
      <WorkoutSessionScreen
        routine={routine}
        onComplete={() => {
          markCompletedToday();
          setScreen('complete');
        }}
        onExit={() => setScreen('home')}
      />
    );
  }

  if (screen === 'complete') {
    return (
      <WorkoutCompleteScreen
        streakCount={streak.count}
        onGoHome={() => setScreen('home')}
        onShowHistory={() => setScreen('history')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        streakCount={streak.count}
        lastCompletedDate={streak.lastCompletedDate}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      profile={profile}
      streakCount={streak.count}
      onStartRoutine={() => setScreen('loading')}
      onShowHistory={() => setScreen('history')}
      onShowSettings={() => setScreen('settings')}
    />
  );
}
