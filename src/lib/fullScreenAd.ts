import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { isFullScreenAdSupported } from './adSupport';

// 전면 광고는 반드시 사용자의 탭(버튼 클릭) 같은 실제 사용자 동작 문맥에서 곧바로
// 호출해야 한다. 화면 전환 후 useEffect 안에서 비동기로 호출하면 광고 SDK가
// 웹뷰를 리로드시키는 등 예상과 다르게 동작해 화면 상태가 초기화될 수 있다
// (루틴 생성 대기 화면에서 광고 후 홈으로 돌아가버리는 문제로 실제 확인됨).
export function showFullScreenAdIfAvailable(adGroupId: string | undefined): void {
  if (!adGroupId || !isFullScreenAdSupported()) return;

  try {
    loadFullScreenAd({
      options: { adGroupId },
      onEvent: () => {
        try {
          showFullScreenAd({
            options: { adGroupId },
            onEvent: () => {},
            onError: () => {},
          });
        } catch {
          // 노출 실패는 무시한다.
        }
      },
      onError: () => {
        // 로드 실패는 무시한다.
      },
    });
  } catch {
    // 초기화 전 호출 등으로 인한 예외는 무시한다.
  }
}
