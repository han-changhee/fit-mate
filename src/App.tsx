import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isAdInitSupported } from './lib/adSupport';
// 회원가입/로그인/회원탈퇴 비활성화 — 서버 DB가 없어서 토스 로그인이 아직 실질적인
// 기능이 없다(인가 코드만 받고 아무것도 저장/검증하지 않음). 사용자가 늘어나서
// 기기 간 데이터 동기화가 필요해지는 시점에 아래 import와 이 파일 하단의 관련
// 코드 주석을 풀면 된다.
// import { useAuth } from './hooks/useAuth';
import { useActiveSession } from './hooks/useActiveSession';
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

type Screen =
  | 'home'
  | 'loading'
  | 'preview'
  | 'exercise'
  | 'complete'
  | 'history'
  | 'settings'
  | 'editProfile';

export default function App() {
  // const { session, login, logout } = useAuth();
  const { profile, saveProfile } = useUserProfile();
  const { streak, markCompletedToday } = useStreak();
  const { session: activeSession, saveSession, clearSession } = useActiveSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!isAdInitSupported()) return;
    try {
      TossAds.initialize({});
    } catch {
      // 광고 초기화 실패는 앱 전체에 영향을 주면 안 되므로 무시한다.
    }
  }, []);

  // 운동 도중 앱이 꺼졌다 다시 열렸을 때, 저장해둔 진행 중인 루틴이 있으면
  // 처음부터 다시 하지 않고 미리보기(완료 표시 포함)로 곧장 이어준다.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!profile || activeSession === undefined) return;
    restoredRef.current = true;

    if (activeSession) {
      setRoutine(activeSession.routine);
      setCompletedIndices(activeSession.completedIndices);
      setScreen('preview');
    }
  }, [profile, activeSession]);

  // const handleWithdraw = () => {
  //   clearProfile();
  //   resetStreak();
  //   logout();
  //   setRoutine(null);
  //   clearSession();
  //   setScreen('home');
  // };

  // if (session === undefined) {
  //   return <div className="min-h-screen" />;
  // }

  // if (session === null) {
  //   return <LoginScreen onLoggedIn={login} />;
  // }

  if (profile === undefined || activeSession === undefined) {
    return <div className="min-h-screen bg-black" />;
  }

  if (profile === null) {
    return <OnboardingScreen onComplete={saveProfile} />;
  }

  if (screen === 'editProfile') {
    return (
      <OnboardingScreen
        initialProfile={profile}
        onCancel={() => setScreen('settings')}
        onComplete={(next) => {
          saveProfile(next);
          setScreen('settings');
        }}
      />
    );
  }

  if (screen === 'loading') {
    return (
      <RoutineLoadingScreen
        profile={profile}
        onLoaded={(next) => {
          setRoutine(next);
          setCompletedIndices([]);
          saveSession({ routine: next, completedIndices: [] });
          setScreen('preview');
        }}
        // 첫 생성이면 홈으로, 루틴을 다시 만드는 중이었다면 기존 루틴이 남아있는
        // 미리보기로 — routine이 이미 있었는지로 구분한다.
        onCancel={() => setScreen(routine ? 'preview' : 'home')}
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
        onRegenerate={() => setScreen('loading')}
        onBack={() => {
          clearSession();
          setRoutine(null);
          setCompletedIndices([]);
          setScreen('home');
        }}
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
            clearSession();
            setScreen('complete');
          } else {
            saveSession({ routine, completedIndices: next });
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
    return (
      <SettingsScreen onBack={() => setScreen('home')} onEditProfile={() => setScreen('editProfile')} />
      // 회원탈퇴 재활성화 시: <SettingsScreen ... onWithdraw={handleWithdraw} />
    );
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
