import { FITNESS_LEVELS } from '../constants/fitnessOptions';
import type { Routine } from '../types';

interface RoutinePreviewScreenProps {
  routine: Routine;
  onStart: () => void;
  onBack: () => void;
}

function toDifficultyLabel(difficulty: Routine['difficulty']): string {
  return FITNESS_LEVELS.find((option) => option.value === difficulty)?.label ?? difficulty;
}

export function RoutinePreviewScreen({ routine, onStart, onBack }: RoutinePreviewScreenProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <button type="button" onClick={onBack} className="self-start text-sm text-gray-400">
        ← 뒤로
      </button>

      <div>
        <p className="text-sm text-gray-500">
          예상 소요시간 {routine.estimatedMinutes}분 · {toDifficultyLabel(routine.difficulty)}
        </p>
        <h1 className="mt-2 text-lg font-bold text-gray-800">오늘의 루틴</h1>
      </div>

      <ul className="flex flex-col gap-3">
        {routine.exercises.map((exercise, index) => (
          <li
            key={`${exercise.name}-${index}`}
            className="rounded-xl border border-gray-200 px-4 py-3"
          >
            <p className="text-sm font-bold text-gray-800">{exercise.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {exercise.sets}세트 · {exercise.durationSec}초 진행 / {exercise.restSec}초 휴식
            </p>
            {exercise.notes && <p className="mt-1 text-xs text-gray-400">{exercise.notes}</p>}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="mt-auto rounded-full bg-blue-500 py-3 text-sm font-bold text-white active:bg-blue-600"
      >
        운동 시작하기
      </button>
    </div>
  );
}
