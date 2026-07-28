import { API_BASE_URL } from './apiBase';

interface TossAuthResult {
  verified: boolean;
  referrer: string | null;
}

export async function verifyTossLogin(
  authorizationCode: string,
  referrer: string
): Promise<TossAuthResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/toss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });

  if (!response.ok) {
    throw new Error('로그인 검증에 실패했어요.');
  }

  return response.json();
}
