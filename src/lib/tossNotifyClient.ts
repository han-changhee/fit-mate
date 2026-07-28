import https from 'node:https';

const TOSS_API_HOST = 'apps-in-toss-api.toss.im';
const SEND_MESSAGE_PATH = '/api-partner/v1/apps-in-toss/messenger/send-message';

interface SendTossNotificationParams {
  anonKey: string;
  templateSetCode: string;
  context?: Record<string, string>;
}

interface TossNotificationResult {
  status: number;
  body: unknown;
}

function decodeBase64Env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았어요.`);
  }
  return Buffer.from(value, 'base64').toString('utf-8');
}

// 토스 스마트 발송 API(단일 메시지 발송)는 mTLS(클라이언트 인증서)로 서버 간 통신을
// 검증한다. fetch()로는 클라이언트 인증서를 붙일 수 없어 Node의 https 모듈을 직접
// 쓴다 — 그래서 이 함수는 Edge Function이 아니라 Node.js 런타임에서만 호출해야 한다.
export function sendTossNotification({
  anonKey,
  templateSetCode,
  context = {},
}: SendTossNotificationParams): Promise<TossNotificationResult> {
  const cert = decodeBase64Env('TOSS_MTLS_CERT');
  const key = decodeBase64Env('TOSS_MTLS_PRIVATE_KEY');
  const body = JSON.stringify({ templateSetCode, context });

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
