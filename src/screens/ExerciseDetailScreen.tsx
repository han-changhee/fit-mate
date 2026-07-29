import { useEffect, useState } from 'react';
import { AdBanner } from '../components/AdBanner';
import { ExerciseGuideBox } from '../components/ExerciseGuideBox';
import type { Exercise } from '../types';

const WORKOUT_BANNER_AD_GROUP_ID = import.meta.env.PUBLIC_WORKOUT_BANNER_AD_GROUP_ID;

interface ExerciseDetailScreenProps {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
  onComplete: () => void;
  onExit: () => void;
}

type Phase = 'ready' | 'active' | 'rest';

export function ExerciseDetailScreen({
  exercise,
  exerciseNumber,
  totalExercises,
  onComplete,
  onExit,
}: ExerciseDetailScreenProps) {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [repCount, setRepCount] = useState(0);
  const isLastSet = setIndex >= exercise.sets - 1;

  const goToNextSet = () => {
    if (isLastSet) {
      onComplete();
      return;
    }
    setSetIndex((prev) => prev + 1);
    setPhase('active');
    setRepCount(0);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-black px-6 py-8 text-white">
      <button
        type="button"
        onClick={onExit}
        className="self-start text-sm font-bold text-zinc-500 active:text-zinc-300"
      >
        ← 목록으로
      </button>

      <p className="mt-8 text-center text-xs font-bold tracking-widest text-lime-400 uppercase">
        운동 {exerciseNumber} / {totalExercises} · 세트 {setIndex + 1} / {exercise.sets}
      </p>
      <h1 className="mt-2 text-center text-3xl font-black tracking-tight uppercase">
        {phase === 'rest' ? '휴식' : exercise.name}
      </h1>
      {exercise.notes && phase !== 'rest' && (
        <p className="mt-2 text-center text-sm text-zinc-500">{exercise.notes}</p>
      )}

      {phase !== 'rest' && (
        <div className="mt-4">
          <ExerciseGuideBox exerciseName={exercise.name} />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {phase === 'ready' ? (
          <button
            type="button"
            onClick={() => setPhase('active')}
            className="flex h-40 w-40 items-center justify-center rounded-full bg-lime-400 text-xl font-black tracking-wide text-black uppercase active:bg-lime-300"
          >
            운동 시작
          </button>
        ) : null}

        {phase === 'active' && exercise.mode === 'time' ? (
          <TimerCounter
            durationSec={exercise.durationSec ?? 30}
            onFinish={() => setPhase('rest')}
          />
        ) : null}

        {phase === 'active' && exercise.mode === 'reps' ? (
          <RepCounter
            target={exercise.reps ?? 10}
            count={repCount}
            onIncrement={() => setRepCount((prev) => prev + 1)}
            onFinishSet={() => setPhase('rest')}
          />
        ) : null}

        {phase === 'rest' ? (
          <RestCounter
            restSec={exercise.restSec}
            isLastSet={isLastSet}
            onFinish={goToNextSet}
          />
        ) : null}
      </div>

      <AdBanner adGroupId={WORKOUT_BANNER_AD_GROUP_ID} />
    </div>
  );
}

function TimerCounter({
  durationSec,
  onFinish,
}: {
  durationSec: number;
  onFinish: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec);

  useEffect(() => {
    setSecondsLeft(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <p className="text-8xl font-black tabular-nums text-lime-400">{secondsLeft}</p>
  );
}

function RepCounter({
  target,
  count,
  onIncrement,
  onFinishSet,
}: {
  target: number;
  count: number;
  onIncrement: () => void;
  onFinishSet: () => void;
}) {
  // 매번 손으로 세는 게 번거롭다는 피드백을 반영해, 목표 횟수에 닿기 전까지는
  // 3초마다 자동으로 올라간다. 페이스가 다르면 눌러서 직접 조절할 수도 있다.
  useEffect(() => {
    if (count >= target) return;
    const timer = setTimeout(onIncrement, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, target]);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
        목표 {target}회
      </p>
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-40 w-40 items-center justify-center rounded-full bg-zinc-900 text-6xl font-black text-cyan-400 ring-4 ring-cyan-400 active:bg-zinc-800"
      >
        {count}
      </button>
      <p className="text-xs font-bold text-zinc-600">
        3초마다 자동으로 올라가요 · 눌러서 직접 조절할 수도 있어요
      </p>
      <button
        type="button"
        onClick={onFinishSet}
        className="rounded-full bg-lime-400 px-8 py-3 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300"
      >
        세트 완료
      </button>
    </div>
  );
}

function RestCounter({
  restSec,
  isLastSet,
  onFinish,
}: {
  restSec: number;
  isLastSet: boolean;
  onFinish: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(restSec);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-8xl font-black tabular-nums text-cyan-400">{secondsLeft}</p>
      <p className="text-sm font-bold text-zinc-500">
        {isLastSet ? '마지막 휴식이에요, 곧 완료!' : '다음 세트 준비하세요'}
      </p>
      <button
        type="button"
        onClick={onFinish}
        className="mt-2 rounded-full border border-zinc-800 px-6 py-2 text-xs font-black tracking-wide text-zinc-400 uppercase active:border-cyan-400 active:text-cyan-400"
      >
        건너뛰기
      </button>
    </div>
  );
}
