import { useEffect, useState } from 'react';
import type { Routine } from '../types';

interface WorkoutSessionScreenProps {
  routine: Routine;
  onComplete: () => void;
  onExit: () => void;
}

type Phase = 'active' | 'rest';

export function WorkoutSessionScreen({ routine, onComplete, onExit }: WorkoutSessionScreenProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('active');
  const exercise = routine.exercises[exerciseIndex];
  const [secondsLeft, setSecondsLeft] = useState(exercise.durationSec);

  useEffect(() => {
    setSecondsLeft(phase === 'active' ? exercise.durationSec : exercise.restSec);
  }, [exerciseIndex, phase, exercise.durationSec, exercise.restSec]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (phase === 'active') {
        setPhase('rest');
        return;
      }

      const nextIndex = exerciseIndex + 1;
      if (nextIndex >= routine.exercises.length) {
        onComplete();
        return;
      }
      setExerciseIndex(nextIndex);
      setPhase('active');
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, phase, exerciseIndex, routine.exercises.length, onComplete]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <button
        type="button"
        onClick={onExit}
        className="absolute top-8 left-6 text-sm text-gray-400"
      >
        종료
      </button>

      <p className="text-sm text-gray-500">
        {exerciseIndex + 1} / {routine.exercises.length}
      </p>
      <h1 className="text-xl font-bold text-gray-800">
        {phase === 'active' ? exercise.name : '휴식'}
      </h1>
      <p className="text-5xl font-bold text-blue-500">{secondsLeft}</p>
    </div>
  );
}
