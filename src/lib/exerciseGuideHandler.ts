// api/exercise-guide.ts(프로덕션 Vercel Edge Function)와 rsbuild dev 미들웨어
// (rsbuild.config.ts)가 동일한 로직을 공유하기 위한 순수 함수.
//
// 같은 운동은 사용자마다 다시 생성하지 않고, 최초 1회만 Gemini로 자세 가이드를
// 만들어 Upstash Redis에 저장해두고 모든 사용자가 재사용한다(운동 이름을 키로 사용).

import { Redis } from '@upstash/redis';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-lite-latest';

interface GuideRequest {
  name: string | null;
}

interface ExerciseGuide {
  name: string;
  points: string[];
}

export async function handleExerciseGuideRequest({
  name,
}: GuideRequest): Promise<{ status: number; body: unknown }> {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { status: 400, body: { error: 'name이 필요해요.' } };
  }

  try {
    const redis = Redis.fromEnv();
    const cached = await redis.get<ExerciseGuide>(`guide:${trimmedName}`);
    if (cached) {
      return { status: 200, body: cached };
    }

    const guide = await generateGuideWithAI(trimmedName);
    await redis.set(`guide:${trimmedName}`, guide);
    return { status: 200, body: guide };
  } catch {
    // Redis나 Gemini가 실패해도 화면이 끊기지 않도록 매번 생성되는 기본 가이드로 대체한다
    // (다음 요청에서 다시 캐시를 시도하므로 영구 실패가 아니면 곧 정상화된다).
    return { status: 200, body: await buildFallbackGuide(trimmedName) };
  }
}

async function generateGuideWithAI(name: string): Promise<ExerciseGuide> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackGuide(name);
  }

  // 루틴 생성과 마찬가지로 Vercel 플랫폼이 강제 종료하기 전에 먼저 타임아웃을 걸어
  // handleExerciseGuideRequest의 try/catch가 폴백 가이드를 돌려줄 시간을 확보한다.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 8000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      signal: timeoutController.signal,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `[역할 및 목표]
당신은 부상 방지와 정확한 근육 자극을 최우선으로 하는 10년 차 수석 헬스 트레이너입니다.
이제 막 운동을 시작한 초보자 회원이 혼자서도 완벽한 자세를 잡을 수 있도록 "${name}" 운동의 올바른 자세 가이드를 작성해 주세요.

[필수 작성 지침]
1. 구성: 초보자가 글을 읽으면서 즉시 몸을 움직여 따라 할 수 있도록 3~4개의 짧은 불릿 포인트(-)로 나누어 작성해 주세요.
2. 분량 및 언어: 각 포인트는 가독성을 위해 반드시 '단 한 문장'으로 명료하게 끝내야 하며, 100% 한국어로만 작성해 주세요 (알파벳/로마자 표기 절대 금지).
3. 핵심 내용: 각 포인트는 다음 흐름을 반드시 포함해야 합니다.
   - 포인트 1 [준비 자세]: 발의 보폭, 시선, 허리의 각도 등 정확한 시작 자세
   - 포인트 2 [동작 및 호흡]: 힘을 줄 때(수축)와 뺄 때(이완)의 정확한 호흡 타이밍 및 움직임
   - 포인트 3 [실수 교정]: 초보자가 가장 많이 하는 흔한 잘못된 자세와 이를 방지하기 위한 팁
   - 포인트 4 (필요시) [자극 팁]: 타겟 근육에 자극을 극대화할 수 있는 트레이너만의 직관적인 비유나 꿀팁
4. 톤앤매너: 실제 PT 수업 중 옆에서 밀착 지도하듯 친절하면서도 확신에 찬 전문적인 말투(~합니다, ~해 주세요)를 사용해 주세요.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              points: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['points'],
          },
        },
      }),
    }
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Gemini API 호출 실패: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content: { parts: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content.parts[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답에서 가이드를 찾지 못했어요.');
  }

  const parsed = JSON.parse(text) as { points: string[] };
  return { name, points: parsed.points };
}

function buildFallbackGuide(name: string): ExerciseGuide {
  return {
    name,
    points: [
      '허리와 목을 편안하게 유지한 상태에서 천천히 움직여요.',
      '동작 내내 호흡을 참지 말고 자연스럽게 이어가요.',
      '통증이 느껴지면 무리하지 말고 동작 범위를 줄여요.',
    ],
  };
}
