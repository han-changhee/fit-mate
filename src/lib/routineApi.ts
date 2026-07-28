import { API_BASE_URL } from './apiBase';
import type { Routine, UserProfile } from '../types';

export async function fetchRoutine(profile: UserProfile): Promise<Routine> {
  const response = await fetch(`${API_BASE_URL}/api/routine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('루틴을 생성하지 못했어요.');
  }

  return response.json();
}
