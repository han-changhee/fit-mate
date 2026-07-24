import { IAP } from '@apps-in-toss/web-framework';

// IAP 함수들은 TossAds와 달리 별도의 isSupported() 플래그를 제공하지 않는다.
// 인앱 웹뷰 밖(프리뷰)에서 호출하면 예외를 던지므로 항상 try/catch로 감싼다.
export function safeCreateSubscriptionPurchaseOrder(
  ...args: Parameters<typeof IAP.createSubscriptionPurchaseOrder>
): (() => void) | undefined {
  try {
    return IAP.createSubscriptionPurchaseOrder(...args);
  } catch {
    return undefined;
  }
}
