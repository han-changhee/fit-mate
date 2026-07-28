// Vercel Serverless Function (Node.js 런타임 — Edge 아님, mTLS 클라이언트 인증서 때문).
// 스마트 발송 연동이 실제로 동작하는지 수동으로 확인하기 위한 테스트용 엔드포인트.
// anonKey는 앱에서 getAnonymousKey()로 받아온 값을 그대로 넘기면 된다.
//
// 이 프로젝트의 package.json은 "type": "module"이라 Vercel Node 함수가 Node의 네이티브
// ESM 로더로 실행되는데, 이 로더는 확장자 없는 상대경로 import(예: '../../src/lib/x')를
// 해석하지 못해 ERR_MODULE_NOT_FOUND로 죽는다(Edge Function은 esbuild로 번들링돼서
// 이 문제가 없었다). 그래서 mTLS 발송 로직을 별도 모듈로 안 빼고 이 파일 안에 그대로 둔다.

import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

const TOSS_API_HOST = 'apps-in-toss-api.toss.im';
const SEND_MESSAGE_PATH = '/api-partner/v1/apps-in-toss/messenger/send-message';
const TEMPLATE_SET_CODE = 'fit-mate-reminder';

function decodeBase64Env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았어요.`);
  }
  return Buffer.from(value, 'base64').toString('utf-8');
}

function sendTossNotification(
  anonKey: string,
  context: Record<string, string> = {}
): Promise<{ status: number; body: unknown }> {
  const cert = decodeBase64Env('TOSS_MTLS_CERT');
  const key = decodeBase64Env('TOSS_MTLS_PRIVATE_KEY');
  const body = JSON.stringify({ templateSetCode: TEMPLATE_SET_CODE, context });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: TOSS_API_HOST,
        path: SEND_MESSAGE_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-anon-key': anonKey,
        },
        cert,
        key,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const payload = await readJsonBody(req);
  const anonKey = payload.anonKey as string | undefined;

  if (!anonKey) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'anonKey가 필요해요.' }));
    return;
  }

  try {
    const result = await sendTossNotification(anonKey);
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.body));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
