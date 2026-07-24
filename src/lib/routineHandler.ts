// api/routine.ts(프로덕션 Vercel Edge Function)와 rsbuild dev 미들웨어
// (rsbuild.config.ts)가 동일한 로직을 공유하기 위한 순수 함수.

import type { Exercise, FitnessGoal, FitnessLevel, Routine, TargetArea } from '../types';

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

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

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Claude API 키가 아직 설정되지 않은 개발 초기 단계에서도
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      tools: [
        {
          name: 'return_routine',
          description: '오늘의 운동 루틴을 구조화된 형식으로 반환해요.',
          input_schema: {
            type: 'object',
            properties: {
              estimatedMinutes: { type: 'number' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    targetArea: { type: 'string', enum: Object.keys(AREA_LABELS) },
                    sets: { type: 'number' },
                    durationSec: { type: 'number' },
                    restSec: { type: 'number' },
                    notes: { type: 'string' },
                  },
                  required: ['name', 'targetArea', 'sets', 'durationSec', 'restSec'],
                },
              },
            },
            required: ['estimatedMinutes', 'exercises'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'return_routine' },
      messages: [
        {
          role: 'user',
          content: [
            `체력 수준: ${fitnessLevel}`,
            `운동 목적: ${GOAL_LABELS[goal]}`,
            `선호 부위: ${areaLabels}`,
            '위 조건에 맞는 오늘의 운동 루틴을 5~6개 동작으로 구성해줘. 각 동작은 세트/진행시간/휴식시간을 포함해야 해.',
          ].join('\n'),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API 호출 실패: ${response.status}`);
  }

  const data = (await response.json()) as {
    content: { type: string; input?: { estimatedMinutes: number; exercises: Exercise[] } }[];
  };
  const toolUse = data.content.find((block) => block.type === 'tool_use');
  if (!toolUse?.input) {
    throw new Error('Claude 응답에서 루틴 데이터를 찾지 못했어요.');
  }

  return {
    routineId: `ai_${Date.now()}`,
    estimatedMinutes: toolUse.input.estimatedMinutes,
    difficulty: fitnessLevel,
    exercises: toolUse.input.exercises,
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
        durationSec: 40,
        restSec: 20,
        notes: 'ANTHROPIC_API_KEY 설정 후 실제 AI 루틴으로 교체돼요',
      },
      {
        name: '스쿼트',
        targetArea: area,
        sets: 3,
        durationSec: 30,
        restSec: 20,
      },
    ],
  };
}
