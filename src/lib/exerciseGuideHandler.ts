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
                text: [
                  `"${name}" 운동의 올바른 자세 가이드를 작성해줘.`,
                  '초보자가 바로 따라할 수 있도록 3~4개의 짧은 포인트로 나눠줘.',
                  '각 포인트는 한 문장, 반드시 한국어로만 작성해줘.',
                  '자세 순서, 호흡, 흔한 실수 교정 중심으로 실용적으로 작성해줘.',
                ].join('\n'),
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
