import { useState } from 'react';
import { FITNESS_GOALS, FITNESS_LEVELS, TARGET_AREAS } from '../constants/fitnessOptions';
import type { FitnessGoal, FitnessLevel, TargetArea, UserProfile } from '../types';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [targetAreas, setTargetAreas] = useState<TargetArea[]>([]);

  const toggleArea = (area: TargetArea) => {
    setTargetAreas((prev) =>
      prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]
    );
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!fitnessLevel || !goal || targetAreas.length === 0) return;
    onComplete({ fitnessLevel, goal, targetAreas });
  };

  const canProceed =
    (step === 0 && fitnessLevel !== null) ||
    (step === 1 && goal !== null) ||
    (step === 2 && targetAreas.length > 0);

  const optionClass = (selected: boolean) =>
    `rounded-xl border px-4 py-3 text-left text-sm font-bold uppercase ${
      selected
        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
    }`;

  return (
    <div className="flex min-h-screen flex-col justify-between bg-black px-6 py-10 text-white">
      <div>
        <p className="text-xs font-black tracking-widest text-lime-400 uppercase">
          {step + 1} / 3
        </p>

        {step === 0 && (
          <>
            <h1 className="mt-2 text-2xl font-black tracking-tight uppercase">
              체력 수준을 알려주세요
            </h1>
            <div className="mt-6 flex flex-col gap-3">
              {FITNESS_LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFitnessLevel(option.value)}
                  className={optionClass(fitnessLevel === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mt-2 text-2xl font-black tracking-tight uppercase">
              운동 목적을 알려주세요
            </h1>
            <div className="mt-6 flex flex-col gap-3">
              {FITNESS_GOALS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value)}
                  className={optionClass(goal === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mt-2 text-2xl font-black tracking-tight uppercase">
              선호 부위를 알려주세요 (중복 가능)
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              {TARGET_AREAS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleArea(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold uppercase ${
                    targetAreas.includes(option.value)
                      ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canProceed}
        className="rounded-full bg-lime-400 py-3 text-sm font-black tracking-wide text-black uppercase disabled:bg-zinc-800 disabled:text-zinc-600"
      >
        {step < 2 ? '다음' : '시작하기'}
      </button>
    </div>
  );
}
