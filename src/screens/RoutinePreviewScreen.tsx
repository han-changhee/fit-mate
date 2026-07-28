import { FITNESS_LEVELS } from '../constants/fitnessOptions';
import type { Routine } from '../types';

interface RoutinePreviewScreenProps {
  routine: Routine;
  completedIndices: number[];
  onSelectExercise: (index: number) => void;
  onBack: () => void;
}

function toDifficultyLabel(difficulty: Routine['difficulty']): string {
  return FITNESS_LEVELS.find((option) => option.value === difficulty)?.label ?? difficulty;
}

export function RoutinePreviewScreen({
  routine,
  completedIndices,
  onSelectExercise,
  onBack,
}: RoutinePreviewScreenProps) {
  const doneCount = completedIndices.length;
  const totalCount = routine.exercises.length;

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
    </div>
  );
}
