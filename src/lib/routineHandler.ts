// api/routine.ts(프로덕션 Vercel Edge Function)와 rsbuild dev 미들웨어
// (rsbuild.config.ts)가 동일한 로직을 공유하기 위한 순수 함수.

import type { FitnessGoal, FitnessLevel, Routine, TargetArea } from '../types';

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

  // TODO: Claude API 연동 — 프로필/goal 기반 프롬프트 구성 후 루틴 JSON 파싱
  return { status: 200, body: buildDummyRoutine(fitnessLevel, targetAreas) };
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
