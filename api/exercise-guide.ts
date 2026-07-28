// Vercel Edge Function — 운동 자세 가이드를 반환한다.
// 같은 운동 이름이면 Upstash Redis 캐시를 재사용해 모든 사용자가 공유한다.
// 실제 로직은 로컬 dev 서버(rsbuild.config.ts)와 공유한다.

import { handleExerciseGuideRequest } from '../src/lib/exerciseGuideHandler';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  // .ait로 번들된 앱은 다른 오리진(로컬 번들)에서 이 API를 호출하므로 브라우저가
  // 실제 POST 전에 OPTIONS 프리플라이트를 보낼 수 있다.
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const payload = await request.json().catch(() => ({}) as Record<string, unknown>);

  const { status, body } = await handleExerciseGuideRequest({
    name: (payload.name as string | undefined) ?? null,
  });

  return Response.json(body, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
