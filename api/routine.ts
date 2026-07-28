// Vercel Edge Function — Gemini API 키를 서버 환경변수로만 보관해
// 프론트엔드 번들에 키가 노출되지 않도록 프록시한다.
// 배포 시 Vercel 프로젝트 환경변수에 GEMINI_API_KEY를 설정할 것.
// 실제 루틴 생성 로직은 로컬 dev 서버(rsbuild.config.ts)와 공유한다.

import { handleRoutineRequest } from '../src/lib/routineHandler';
import type { FitnessGoal, FitnessLevel, TargetArea } from '../src/types';

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

  const { status, body } = await handleRoutineRequest({
    fitnessLevel: (payload.fitnessLevel as FitnessLevel | undefined) ?? null,
    goal: (payload.goal as FitnessGoal | undefined) ?? null,
    targetAreas: (payload.targetAreas as TargetArea[] | undefined) ?? null,
  });

  // 토스 인앱 웹뷰는 이 API와 다른 오리진에서 실행되므로 CORS 허용이 필요하다.
  return Response.json(body, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
