export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'flexibility' | 'rehab';
export type TargetArea = 'upper' | 'lower' | 'core' | 'full_body';

export interface UserProfile {
  fitnessLevel: FitnessLevel;
  goal: FitnessGoal;
  targetAreas: TargetArea[];
}

export type ExerciseMode = 'time' | 'reps';

export interface Exercise {
  name: string;
  targetArea: TargetArea;
  sets: number;
  mode: ExerciseMode;
  durationSec?: number; // mode === 'time'일 때만 사용
  reps?: number; // mode === 'reps'일 때만 사용
  restSec: number;
  notes?: string;
}

export interface Routine {
  routineId: string;
  estimatedMinutes: number;
  difficulty: FitnessLevel;
  exercises: Exercise[];
}
