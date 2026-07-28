// Vercel Edge Function — 회원별 운동 알림 시간을 Upstash Redis에 저장한다.
// anonKey는 클라이언트에서 getAnonymousKey()로 받아온 값을 그대로 넘긴다.
// 로그인 없이도 동작하도록 anonKey만으로 식별한다(회원 개념 없음).

import { Redis } from '@upstash/redis';

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
  const anonKey = payload.anonKey as string | undefined;
  const reminderTime = payload.reminderTime as string | undefined;

  if (!anonKey || !reminderTime) {
    return Response.json(
      { error: 'anonKey, reminderTime가 모두 필요해요.' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const redis = Redis.fromEnv();
    await redis.set(`reminder:${anonKey}`, reminderTime);
    return Response.json({ ok: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
