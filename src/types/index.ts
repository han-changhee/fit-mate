export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'flexibility' | 'rehab';
export type TargetArea = 'upper' | 'lower' | 'core' | 'full_body';

export interface UserProfile {
  fitnessLevel: FitnessLevel;
  goal: FitnessGoal;
  targetAreas: TargetArea[];
}

export interface Exercise {
  name: string;
  targetArea: TargetArea;
  sets: number;
  durationSec: number;
  restSec: number;
  notes?: string;
}

export interface Routine {
  routineId: string;
  estimatedMinutes: number;
  difficulty: FitnessLevel;
  exercises: Exercise[];
}
