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
    // 더미 루틴으로 조용히 폴백하지 않는다 — AI가 실제로 실패했을 때 가짜
    // 운동 목록을 보여주는 대신, 클라이언트가 실패로 인식하고 별도의
    // 실패 화면(RoutineErrorScreen)으로 안내하도록 에러 상태를 그대로 응답한다.
    return { status: 502, body: { error: '루틴 생성에 실패했어요.' } };
  }
}

async function generateRoutineWithAI(
  apiKey: string,
  fitnessLevel: FitnessLevel,
  goal: FitnessGoal,
  targetAreas: TargetArea[]
): Promise<Routine> {
  const areaLabels = targetAreas.map((area) => AREA_LABELS[area]).join(', ');

  // Vercel Edge Function 자체의 실행 제한 시간(약 25초)에 걸려 플랫폼이 강제로
  // 끊어버리면 우리 코드가 catch할 기회조차 없이 502/504만 응답으로 나간다.
  // 그 전에 우리가 먼저 타임아웃을 걸어서, 아래 handleRoutineRequest의 try/catch가
  // 더미 루틴으로 폴백할 시간을 확보한다.
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
당신은 회원의 체형과 인생을 바꿔주는 페이스메이커이자, 압도적인 전문성으로 재등록률 100%를 자랑하는 수석 헬스 트레이너입니다.
아래 회원의 현재 상태와 목표를 분석하여, 오늘 당장 실천할 수 있는 가장 효과적이고 안전한 맞춤형 운동 루틴을 설계해 주세요.

[회원 상태 분석]
- 체력 수준: ${fitnessLevel}
- 운동 목적: ${GOAL_LABELS[goal]}
- 선호 부위: ${areaLabels}

[루틴 설계 필수 지침]
1. 위 조건에 완벽히 맞춰진 오늘의 운동 루틴을 5~6개 동작으로 알차게 구성해 주세요.
2. 각 동작의 성격에 맞춰 측정 방식(mode)을 명확히 구분해야 합니다.
   - 플랭크처럼 버티거나 시간 유지가 필요한 동작은 mode를 "time"으로 설정하고 durationSec(초 단위)을 채워주세요.
   - 스쿼트, 크런치처럼 횟수 반복이 중심이 되는 동작은 mode를 "reps"로 설정하고 reps(회 단위)를 채워주세요.
   - 두 가지 모드를 운동 성격과 심박수 변화에 맞춰 적절히 혼합하여 구성해 주세요.
3. 모든 동작에는 sets(세트 수)와 restSec(세트 간 휴식 시간, 초 단위)을 예외 없이 반드시 포함해야 합니다.
4. 운동 명칭(name)과 세부 설명/팁(notes)은 반드시 100% 한국어로만 작성해 주세요.
   - 영어 운동 이름이나 로마자(알파벳) 표기는 절대 금지합니다. (예: Plank ❌ -> 플랭크 ⭕, Bird Dog ❌ -> 버드 독 ⭕)
5. notes 항목은 실제 트레이너가 옆에서 PT(퍼스널 트레이닝)를 진행하며 자세를 잡아주듯 작성해 주세요.
   - 부상 방지를 위한 정확한 타겟 근육 자극 포인트, 호흡법, 그리고 끝까지 해낼 수 있도록 돕는 파이팅 넘치는 동기부여 멘트를 자연스럽게 녹여주세요.`,
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
                  required: ['name', 'targetArea', 'sets', 'mode', 'restSec', 'notes'],
                },
              },
            },
            required: ['estimatedMinutes', 'exercises'],
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
