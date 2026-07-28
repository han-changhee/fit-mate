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

type Phase = 'active' | 'rest';

export function ExerciseDetailScreen({
  exercise,
  exerciseNumber,
  totalExercises,
  onComplete,
  onExit,
}: ExerciseDetailScreenProps) {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('active');
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
        {phase === 'active' ? exercise.name : '휴식'}
      </h1>
      {exercise.notes && phase === 'active' && (
        <p className="mt-2 text-center text-sm text-zinc-500">{exercise.notes}</p>
      )}

      {phase === 'active' && (
        <div className="mt-4">
          <ExerciseGuideBox exerciseName={exercise.name} />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
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
    </div>
  );
}
