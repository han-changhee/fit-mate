import { dirname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { handleRoutineRequest } from './src/lib/routineHandler';
import { handleTossAuthRequest } from './src/lib/authHandler';
import { handleExerciseGuideRequest } from './src/lib/exerciseGuideHandler';
import type { FitnessGoal, FitnessLevel, TargetArea } from './src/types';

// rsbuild는 .env.local을 클라이언트 번들 주입용으로만 다루고 Node 프로세스의
// process.env는 자동으로 채우지 않는다. 아래 dev 미들웨어가 process.env.GEMINI_API_KEY를
// 직접 읽으므로, 서버가 요청을 받기 전에 .env* 파일을 process.env로 로드해둔다.
// `npm --prefix fit-mate run dev`처럼 다른 디렉터리에서 실행되면 process.cwd()가
// 이 프로젝트 루트가 아닐 수 있어, 이 설정 파일 자신의 위치를 기준으로 삼는다.
loadEnv({ cwd: dirname(fileURLToPath(import.meta.url)) });

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  server: {
    port: 3000,
    // 프로덕션에서는 api/routine.ts(Vercel Edge Function)가 이 요청을 처리한다.
    // `rsbuild dev`만으로도 루틴 생성 플로우를 확인할 수 있도록 동일 로직을 dev 서버에 붙인다.
    setup: (context) => {
      if (context.action !== 'dev') return;
      context.server.middlewares.use(
        '/api/routine',
        async (req: IncomingMessage, res: ServerResponse) => {
          const payload = await readJsonBody(req);
          const { status, body } = await handleRoutineRequest({
            fitnessLevel: (payload.fitnessLevel as FitnessLevel | undefined) ?? null,
            goal: (payload.goal as FitnessGoal | undefined) ?? null,
            targetAreas: (payload.targetAreas as TargetArea[] | undefined) ?? null,
          });
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        }
      );

      // 프로덕션에서는 api/auth/toss.ts(Vercel Edge Function)가 이 요청을 처리한다.
      context.server.middlewares.use(
        '/api/auth/toss',
        async (req: IncomingMessage, res: ServerResponse) => {
          const payload = await readJsonBody(req);
          const { status, body } = await handleTossAuthRequest({
            authorizationCode: (payload.authorizationCode as string | undefined) ?? null,
            referrer: (payload.referrer as string | undefined) ?? null,
          });
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        }
      );

      // 프로덕션에서는 api/exercise-guide.ts(Vercel Edge Function)가 이 요청을 처리한다.
      context.server.middlewares.use(
        '/api/exercise-guide',
        async (req: IncomingMessage, res: ServerResponse) => {
          const payload = await readJsonBody(req);
          const { status, body } = await handleExerciseGuideRequest({
            name: (payload.name as string | undefined) ?? null,
          });
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        }
      );
    },
  },
});
