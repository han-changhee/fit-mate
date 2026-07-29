import { useCallback, useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isAdInitSupported } from './lib/adSupport';
import { fetchRoutine } from './lib/routineApi';
import { showFullScreenAdIfAvailable } from './lib/fullScreenAd';
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
import { RoutineErrorScreen } from './screens/RoutineErrorScreen';
import { RoutinePreviewScreen } from './screens/RoutinePreviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { WorkoutCompleteScreen } from './screens/WorkoutCompleteScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { Routine } from './types';

const ROUTINE_AD_GROUP_ID = import.meta.env.PUBLIC_ROUTINE_LOADING_AD_GROUP_ID;

type Screen =
  | 'home'
  | 'preview'
  | 'exercise'
  | 'complete'
  | 'history'
  | 'settings'
  | 'editProfile'
  | 'routineError';

export default function App() {
  // const { session, login, logout } = useAuth();
  const { profile, saveProfile } = useUserProfile();
  const { streak, markCompletedToday } = useStreak();
  const { session: activeSession, saveSession, clearSession } = useActiveSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const restoredRef = useRef(false);
  const generationRunIdRef = useRef(0);

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

  // 버튼을 누르면 화면 전환 없이 그 자리에서(홈이든 미리보기든) 버튼만 "생성
  // 중..."으로 바뀌고 뒤에서 AI 요청을 진행한다. 광고는 결과가 성공으로 온
  // 뒤에만 띄운다 — 실패했는데 광고부터 보여주면 사용자 입장에서 "광고만 보고
  // 아무것도 못 받은" 셈이 되므로, 실패 시에는 광고 없이 곧장 실패 화면으로 간다.
  const generateRoutine = useCallback(() => {
    if (!profile) return;
    const runId = ++generationRunIdRef.current;
    setIsGeneratingRoutine(true);

    fetchRoutine(profile)
      .then((next) => {
        if (runId !== generationRunIdRef.current) return;
        showFullScreenAdIfAvailable(ROUTINE_AD_GROUP_ID, () => {
          if (runId !== generationRunIdRef.current) return;
          setIsGeneratingRoutine(false);
          setRoutine(next);
          setCompletedIndices([]);
          saveSession({ routine: next, completedIndices: [] });
          setScreen('preview');
        });
      })
      .catch(() => {
        if (runId !== generationRunIdRef.current) return;
        setIsGeneratingRoutine(false);
        setScreen('routineError');
      });
  }, [profile, saveSession]);

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

  if (screen === 'routineError') {
    return (
      <RoutineErrorScreen
        hasExistingRoutine={routine !== null}
        onRetry={generateRoutine}
        onExit={() => setScreen(routine ? 'preview' : 'home')}
      />
    );
  }

  if (screen === 'preview' && routine) {
    return (
      <RoutinePreviewScreen
        routine={routine}
        completedIndices={completedIndices}
        isRegenerating={isGeneratingRoutine}
        onSelectExercise={(index) => {
          setActiveExerciseIndex(index);
          setScreen('exercise');
        }}
        onRegenerate={generateRoutine}
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
      isGeneratingRoutine={isGeneratingRoutine}
      onStartRoutine={generateRoutine}
      onShowHistory={() => setScreen('history')}
      onShowSettings={() => setScreen('settings')}
    />
  );
}
