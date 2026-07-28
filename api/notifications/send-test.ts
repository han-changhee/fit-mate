// Vercel Serverless Function (Node.js 런타임 — Edge 아님, mTLS 클라이언트 인증서 때문).
// 스마트 발송 연동이 실제로 동작하는지 수동으로 확인하기 위한 테스트용 엔드포인트.
// anonKey는 앱에서 getAnonymousKey()로 받아온 값을 그대로 넘기면 된다.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendTossNotification } from '../../src/lib/tossNotifyClient';

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
    const result = await sendTossNotification({
      anonKey,
      templateSetCode: 'fit-mate-reminder',
    });
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.body));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
