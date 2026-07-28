// api/auth/toss.ts(프로덕션 Vercel Edge Function)와 rsbuild dev 미들웨어
// (rsbuild.config.ts)가 동일한 로직을 공유하기 위한 순수 함수.

interface TossAuthRequest {
  authorizationCode: string | null;
  referrer: string | null;
}

export async function handleTossAuthRequest({
  authorizationCode,
  referrer,
}: TossAuthRequest): Promise<{ status: number; body: unknown }> {
  if (!authorizationCode) {
    return { status: 400, body: { error: 'authorizationCode가 필요해요.' } };
  }

  const clientId = process.env.TOSS_CLIENT_ID;
  const clientSecret = process.env.TOSS_CLIENT_SECRET;

  // 토스 파트너 콘솔에서 앱을 등록해 TOSS_CLIENT_ID/TOSS_CLIENT_SECRET을 발급받기
  // 전까지는 인가 코드를 서버에서 검증하지 않고 그대로 통과시킨다.
  // 결제 등 실제 신원 확인이 필요한 기능에는 verified: false인 세션을 신뢰해서는 안 된다.
  if (!clientId || !clientSecret) {
    return { status: 200, body: { verified: false, referrer } };
  }

  // TODO: 토스 OAuth 토큰 교환 API에 authorizationCode를 전달해 실제 사용자
  // 식별 정보를 받아오는 로직 구현 (TOSS_CLIENT_ID/TOSS_CLIENT_SECRET 발급 후)
  return { status: 200, body: { verified: false, referrer } };
}
