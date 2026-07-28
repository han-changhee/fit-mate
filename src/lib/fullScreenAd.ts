import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { isFullScreenAdSupported } from './adSupport';

// 광고 슬롯이 없거나, 로드/노출에 실패하거나, 사용자가 닫으면 항상 onDone을 정확히
// 한 번만 호출한다. 광고 SDK 이벤트가 어떤 이유로든 오지 않는 경우를 대비해 타임아웃
// 폴백도 둔다 — 화면 전환이 광고 콜백에 의존하므로, 콜백이 아예 안 오면 로딩 화면에
// 영원히 멈춰있게 되는 걸 막기 위함이다.
export function showFullScreenAdIfAvailable(
  adGroupId: string | undefined,
  onDone: () => void
): void {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };

  if (!adGroupId || !isFullScreenAdSupported()) {
    finish();
    return;
  }

  const timeoutId = setTimeout(finish, 8000);
  const finishOnce = () => {
    clearTimeout(timeoutId);
    finish();
  };

  try {
    loadFullScreenAd({
      options: { adGroupId },
      onEvent: () => {
        try {
          showFullScreenAd({
            options: { adGroupId },
            onEvent: (data) => {
              if (data.type === 'dismissed' || data.type === 'failedToShow') {
                finishOnce();
              }
            },
            onError: finishOnce,
          });
        } catch {
          finishOnce();
        }
      },
      onError: finishOnce,
    });
  } catch {
    finishOnce();
  }
}
