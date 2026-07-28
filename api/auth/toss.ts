// Vercel Edge Function — 토스 로그인(appLogin())으로 받은 인가 코드를 서버에서 처리한다.
// 토스 파트너 콘솔에서 앱을 등록해 TOSS_CLIENT_ID/TOSS_CLIENT_SECRET을 발급받기
// 전까지는 실제 사용자 식별 없이 인가 코드 수신만 확인한다.
// 실제 검증 로직은 로컬 dev 서버(rsbuild.config.ts)와 공유한다.

import { handleTossAuthRequest } from '../../src/lib/authHandler';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const payload = await request.json().catch(() => ({}) as Record<string, unknown>);

  const { status, body } = await handleTossAuthRequest({
    authorizationCode: (payload.authorizationCode as string | undefined) ?? null,
    referrer: (payload.referrer as string | undefined) ?? null,
  });

  return Response.json(body, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
