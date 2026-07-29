import { useState } from 'react';
import { FITNESS_LEVELS } from '../constants/fitnessOptions';
import type { Routine } from '../types';

interface RoutinePreviewScreenProps {
  routine: Routine;
  completedIndices: number[];
  onSelectExercise: (index: number) => void;
  onRegenerate: () => void;
  onBack: () => void;
}

function toDifficultyLabel(difficulty: Routine['difficulty']): string {
  return FITNESS_LEVELS.find((option) => option.value === difficulty)?.label ?? difficulty;
}

export function RoutinePreviewScreen({
  routine,
  completedIndices,
  onSelectExercise,
  onRegenerate,
  onBack,
}: RoutinePreviewScreenProps) {
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const doneCount = completedIndices.length;
  const totalCount = routine.exercises.length;

  const handleRegenerateClick = () => {
    if (doneCount > 0) {
      setConfirmingRegenerate(true);
      return;
    }
    onRegenerate();
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-black px-6 py-8 text-white">
      <button type="button" onClick={onBack} className="self-start text-sm font-bold text-zinc-500">
        ← 뒤로
      </button>

      <div>
        <p className="text-xs font-bold tracking-widest text-lime-400 uppercase">
          예상 {routine.estimatedMinutes}분 · {toDifficultyLabel(routine.difficulty)}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase">오늘의 루틴</h1>
        <p className="mt-1 text-sm font-bold text-zinc-500">
          {doneCount} / {totalCount} 완료 — 운동을 탭해서 시작하세요
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {routine.exercises.map((exercise, index) => {
          const isDone = completedIndices.includes(index);
          return (
            <li key={`${exercise.name}-${index}`}>
              <button
                type="button"
                onClick={() => onSelectExercise(index)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left ${
                  isDone
                    ? 'border-zinc-800 bg-zinc-900/50 opacity-50'
                    : 'border-zinc-800 bg-zinc-900 active:border-lime-400'
                }`}
              >
                <div>
                  <p className="text-base font-black uppercase">{exercise.name}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500">
                    {exercise.sets}세트 ·{' '}
                    {exercise.mode === 'time'
                      ? `${exercise.durationSec}초 진행`
                      : `${exercise.reps}회`}{' '}
                    / {exercise.restSec}초 휴식
                  </p>
                </div>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    isDone ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto">
        {confirmingRegenerate ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-center">
            <p className="text-sm font-bold text-zinc-300">
              완료한 운동 기록이 사라져요. 그래도 다시 만들까요?
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingRegenerate(false)}
                className="flex-1 rounded-full border border-zinc-800 py-2 text-sm font-bold text-zinc-400"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="flex-1 rounded-full bg-lime-400 py-2 text-sm font-black text-black"
              >
                다시 만들기
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRegenerateClick}
            className="w-full rounded-full border border-zinc-800 py-3 text-sm font-black tracking-wide text-zinc-400 uppercase active:border-cyan-400 active:text-cyan-400"
          >
            🔄 루틴 다시 만들기 (광고 시청)
          </button>
        )}
      </div>
    </div>
  );
}
