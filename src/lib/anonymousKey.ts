import { getAnonymousKey } from '@apps-in-toss/web-framework';

// 인앱 웹뷰 밖(프리뷰)이거나 구버전 앱이면 undefined/'ERROR'가 올 수 있어
// 항상 null로 안전하게 정규화한다. 로그인과 무관한 별도 SDK 함수라
// 로그인 기능이 꺼져 있어도 사용할 수 있다.
export async function fetchAnonymousKey(): Promise<string | null> {
  try {
    const result = await getAnonymousKey();
    if (!result || result === 'ERROR') return null;
    return result.hash;
  } catch {
    return null;
  }
}
