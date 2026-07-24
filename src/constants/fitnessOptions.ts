import type { FitnessGoal, FitnessLevel, TargetArea } from '../types';

export const FITNESS_LEVELS: { value: FitnessLevel; label: string }[] = [
  { value: 'beginner', label: '입문' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '숙련' },
];

export const FITNESS_GOALS: { value: FitnessGoal; label: string }[] = [
  { value: 'weight_loss', label: '체중 감량' },
  { value: 'muscle_gain', label: '근력 향상' },
  { value: 'flexibility', label: '유연성' },
  { value: 'rehab', label: '재활 · 통증 완화' },
];

export const TARGET_AREAS: { value: TargetArea; label: string }[] = [
  { value: 'upper', label: '상체' },
  { value: 'lower', label: '하체' },
  { value: 'core', label: '코어' },
  { value: 'full_body', label: '전신' },
];
