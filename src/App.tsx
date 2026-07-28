import { useEffect, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isAdInitSupported } from './lib/adSupport';
// 회원가입/로그인/회원탈퇴 비활성화 — 서버 DB가 없어서 토스 로그인이 아직 실질적인
// 기능이 없다(인가 코드만 받고 아무것도 저장/검증하지 않음). DB를 붙이는 시점에
// 아래 import와 이 파일 하단의 관련 코드 주석을 풀면 된다.
// import { useAuth } from './hooks/useAuth';
import { useStreak } from './hooks/useStreak';
import { useUserProfile } from './hooks/useUserProfile';
// import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RoutineLoadingScreen } from './screens/RoutineLoadingScreen';
import { RoutinePreviewScreen } from './screens/RoutinePreviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { WorkoutCompleteScreen } from './screens/WorkoutCompleteScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { Routine } from './types';

type Screen = 'home' | 'loading' | 'preview' | 'exercise' | 'complete' | 'history' | 'settings';

export default function App() {
  // const { session, login, logout } = useAuth();
  const { profile, saveProfile } = useUserProfile();
  const { streak, markCompletedToday } = useStreak();
  const [screen, setScreen] = useState<Screen>('home');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdInitSupported()) return;
    try {
      TossAds.initialize({});
    } catch {
      // 광고 초기화 실패는 앱 전체에 영향을 주면 안 되므로 무시한다.
    }
  }, []);

  // const handleWithdraw = () => {
  //   clearProfile();
  //   resetStreak();
  //   logout();
  //   setRoutine(null);
  //   setScreen('home');
  // };

  // if (session === undefined) {
  //   return <div className="min-h-screen" />;
  // }

  // if (session === null) {
  //   return <LoginScreen onLoggedIn={login} />;
  // }

  if (profile === undefined) {
    return <div className="min-h-screen bg-black" />;
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
          setCompletedIndices([]);
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
        completedIndices={completedIndices}
        onSelectExercise={(index) => {
          setActiveExerciseIndex(index);
          setScreen('exercise');
        }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'exercise' && routine && activeExerciseIndex !== null) {
    return (
      <ExerciseDetailScreen
        exercise={routine.exercises[activeExerciseIndex]}
        exerciseNumber={activeExerciseIndex + 1}
        totalExercises={routine.exercises.length}
        onComplete={() => {
          const next = completedIndices.includes(activeExerciseIndex)
            ? completedIndices
            : [...completedIndices, activeExerciseIndex];
          setCompletedIndices(next);
          setActiveExerciseIndex(null);

          if (next.length >= routine.exercises.length) {
            markCompletedToday();
            setScreen('complete');
          } else {
            setScreen('preview');
          }
        }}
        onExit={() => {
          setActiveExerciseIndex(null);
          setScreen('preview');
        }}
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
    // 회원탈퇴 재활성화 시: <SettingsScreen onBack={...} onWithdraw={handleWithdraw} />
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
