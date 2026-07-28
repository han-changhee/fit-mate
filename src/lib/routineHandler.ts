// api/routine.ts(프로덕션 Vercel Edge Function)와 rsbuild dev 미들웨어
// (rsbuild.config.ts)가 동일한 로직을 공유하기 위한 순수 함수.

import type { Exercise, FitnessGoal, FitnessLevel, Routine, TargetArea } from '../types';

// 고정된 스냅샷 모델 ID(예: gemini-2.5-flash-lite, gemini-2.0-flash-lite)는
// 프로젝트별로 할당량이 없거나(429 limit: 0) 신규 사용자에게 제공되지 않을(404) 수 있다.
// "-latest" 별칭은 그 시점에 실제로 사용 가능한 최신 flash-lite 모델로 자동 라우팅되고
// 무료 티어 할당량도 정상 배정되어 있어 이걸 기본값으로 쓴다.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-lite-latest';

const GOAL_LABELS: Record<FitnessGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근력 향상',
  flexibility: '유연성',
  rehab: '재활 · 통증 완화',
};

const AREA_LABELS: Record<TargetArea, string> = {
  upper: '상체',
  lower: '하체',
  core: '코어',
  full_body: '전신',
};

interface RoutineRequest {
  fitnessLevel: FitnessLevel | null;
  goal: FitnessGoal | null;
  targetAreas: TargetArea[] | null;
}

export async function handleRoutineRequest({
  fitnessLevel,
  goal,
  targetAreas,
}: RoutineRequest): Promise<{ status: number; body: unknown }> {
  if (!fitnessLevel || !goal || !targetAreas || targetAreas.length === 0) {
    return {
      status: 400,
      body: { error: 'fitnessLevel, goal, targetAreas가 모두 필요해요.' },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Gemini API 키가 아직 설정되지 않은 개발 초기 단계에서도
    // 화면 흐름을 확인할 수 있도록 더미 루틴을 반환한다.
    return { status: 200, body: buildDummyRoutine(fitnessLevel, targetAreas) };
  }

  try {
    const routine = await generateRoutineWithAI(apiKey, fitnessLevel, goal, targetAreas);
    return { status: 200, body: routine };
  } catch {
    // AI 호출 실패 시에도 화면 흐름이 끊기지 않도록 더미 루틴으로 폴백한다.
    return { status: 200, body: buildDummyRoutine(fitnessLevel, targetAreas) };
  }
}

async function generateRoutineWithAI(
  apiKey: string,
  fitnessLevel: FitnessLevel,
  goal: FitnessGoal,
  targetAreas: TargetArea[]
): Promise<Routine> {
  const areaLabels = targetAreas.map((area) => AREA_LABELS[area]).join(', ');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
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
                  `체력 수준: ${fitnessLevel}`,
                  `운동 목적: ${GOAL_LABELS[goal]}`,
                  `선호 부위: ${areaLabels}`,
                  '위 조건에 맞는 오늘의 운동 루틴을 5~6개 동작으로 구성해줘.',
                  '각 동작은 시간으로 재는 게 자연스러우면 mode를 "time"으로 하고 durationSec을 채우고,',
                  '횟수로 세는 게 자연스러우면(예: 스쿼트, 크런치) mode를 "reps"로 하고 reps를 채워줘.',
                  '두 모드를 적절히 섞어서 구성해줘. sets, restSec은 모든 동작에 항상 포함해야 해.',
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
              estimatedMinutes: { type: 'NUMBER' },
              exercises: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    targetArea: { type: 'STRING', enum: Object.keys(AREA_LABELS) },
                    sets: { type: 'NUMBER' },
                    mode: { type: 'STRING', enum: ['time', 'reps'] },
                    durationSec: { type: 'NUMBER' },
                    reps: { type: 'NUMBER' },
                    restSec: { type: 'NUMBER' },
                    notes: { type: 'STRING' },
                  },
                  required: ['name', 'targetArea', 'sets', 'mode', 'restSec'],
                },
              },
            },
            required: ['estimatedMinutes', 'exercises'],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API 호출 실패: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content: { parts: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content.parts[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답에서 루틴 데이터를 찾지 못했어요.');
  }

  const parsed = JSON.parse(text) as { estimatedMinutes: number; exercises: Exercise[] };

  return {
    routineId: `ai_${Date.now()}`,
    estimatedMinutes: parsed.estimatedMinutes,
    difficulty: fitnessLevel,
    exercises: parsed.exercises,
  };
}

function buildDummyRoutine(fitnessLevel: FitnessLevel, targetAreas: TargetArea[]): Routine {
  const area = targetAreas[0];
  return {
    routineId: `dummy_${Date.now()}`,
    estimatedMinutes: 25,
    difficulty: fitnessLevel,
    exercises: [
      {
        name: '플랭크',
        targetArea: area,
        sets: 3,
        mode: 'time',
        durationSec: 40,
        restSec: 20,
        notes: 'GEMINI_API_KEY 설정 후 실제 AI 루틴으로 교체돼요',
      },
      {
        name: '스쿼트',
        targetArea: area,
        sets: 3,
        mode: 'reps',
        reps: 15,
        restSec: 20,
      },
    ],
  };
}
