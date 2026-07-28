import { useState } from 'react';
import { fetchExerciseGuide } from '../lib/exerciseGuideApi';

interface ExerciseGuideBoxProps {
  exerciseName: string;
}

type LoadState = 'idle' | 'loading' | 'error';

export function ExerciseGuideBox({ exerciseName }: ExerciseGuideBoxProps) {
  const [open, setOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [points, setPoints] = useState<string[]>([]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && loadState === 'idle') {
      setLoadState('loading');
      fetchExerciseGuide(exerciseName)
        .then((guide) => {
          setPoints(guide.points);
          setLoadState('idle');
        })
        .catch(() => setLoadState('error'));
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-zinc-300"
      >
        <span>📖 자세 가이드 보기</span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-4 py-3">
          {loadState === 'loading' && (
            <p className="text-xs font-bold text-zinc-600">가이드를 불러오는 중...</p>
          )}
          {loadState === 'error' && (
            <p className="text-xs font-bold text-zinc-600">가이드를 불러오지 못했어요.</p>
          )}
          {loadState === 'idle' && points.length > 0 && (
            <ul className="flex flex-col gap-2">
              {points.map((point, index) => (
                <li key={index} className="flex gap-2 text-xs font-bold text-zinc-400">
                  <span className="text-lime-400">{index + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
