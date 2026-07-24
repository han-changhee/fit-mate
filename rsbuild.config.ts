import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { handleRoutineRequest } from './src/lib/routineHandler';
import type { FitnessGoal, FitnessLevel, TargetArea } from './src/types';

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
    },
  },
});
