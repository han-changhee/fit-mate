import { API_BASE_URL } from './apiBase';

export interface ExerciseGuide {
  name: string;
  points: string[];
}

export async function fetchExerciseGuide(name: string): Promise<ExerciseGuide> {
  const response = await fetch(`${API_BASE_URL}/api/exercise-guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('자세 가이드를 불러오지 못했어요.');
  }

  return response.json();
}
