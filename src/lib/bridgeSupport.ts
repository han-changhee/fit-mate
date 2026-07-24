// 토스 인앱 웹뷰 밖(일반 브라우저 프리뷰)에서는 SDK의 .isSupported() 자체가
// 네이티브 브릿지가 없다는 예외를 던진다 (false를 반환하지 않는다).
// 그래서 항상 이 래퍼로 감싸서 "예외 = 미지원"으로 취급한다.
export function safeIsSupported(check: () => boolean): boolean {
  try {
    return check();
  } catch {
    return false;
  }
}
