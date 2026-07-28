// Vercel Cron이 주기적으로 호출하는 엔드포인트(vercel.json의 crons 설정 참고).
// Node.js 런타임 — mTLS 클라이언트 인증서가 필요해서 Edge Function으로는 못 만든다
// (이 프로젝트는 "type": "module"이라 Node 함수에서 다른 파일 import가 깨지므로,
// api/notifications/send-test.ts와 마찬가지로 발송 로직을 이 파일 안에 그대로 둔다).
//
// Redis에 저장된 reminder:{anonKey} -> "HH:mm" 항목을 전부 훑어서, 지금 한국 시간과
// 일치하는 사용자에게 토스 스마트 발송 API로 알림을 실제로 보낸다.

import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Redis } from '@upstash/redis';

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

function sendTossNotification(anonKey: string): Promise<{ status: number; body: unknown }> {
  const cert = decodeBase64Env('TOSS_MTLS_CERT');
  const key = decodeBase64Env('TOSS_MTLS_PRIVATE_KEY');
  const body = JSON.stringify({ templateSetCode: TEMPLATE_SET_CODE, context: {} });

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

// 서버는 UTC로 도는 경우가 많아 한국 시간(KST, UTC+9)으로 변환해서 "HH:mm"으로 비교한다.
function currentKstHHmm(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const mm = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // QStash 콘솔의 커스텀 헤더 UI가 불안정해서, 헤더 대신 쿼리 파라미터(?secret=...)로
  // 검증한다. 아무나 이 엔드포인트를 호출해서 알림을 뿌리지 못하도록 막는 용도.
  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = new URL(req.url ?? '', 'http://localhost').searchParams.get('secret');
  if (cronSecret && requestSecret !== cronSecret) {
    res.statusCode = 401;
    res.end('Unauthorized');
    return;
  }

  const nowKst = currentKstHHmm();
  const redis = Redis.fromEnv();
  const sentTo: string[] = [];
  const failedTo: { anonKey: string; status: number }[] = [];

  try {
    let cursor: string | number = 0;
    do {
      const [nextCursor, keys]: [string, string[]] = await redis.scan(cursor, {
        match: 'reminder:*',
        count: 100,
      });
      cursor = nextCursor;

      for (const redisKey of keys) {
        const reminderTime = await redis.get<string>(redisKey);
        if (reminderTime !== nowKst) continue;

        const anonKey = redisKey.replace(/^reminder:/, '');
        const result = await sendTossNotification(anonKey);
        if (result.status >= 200 && result.status < 300) {
          sentTo.push(anonKey);
        } else {
          failedTo.push({ anonKey, status: result.status });
        }
      }
    } while (cursor !== '0');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ nowKst, sentCount: sentTo.length, failedCount: failedTo.length, failedTo }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
