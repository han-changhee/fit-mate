import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isBannerAdSupported } from '../lib/adSupport';

interface AdBannerProps {
  adGroupId?: string;
  // 'expanded'는 'card'보다 크게 렌더링되는 인라인 배너 포맷이다. 전면(인터스티셜)
  // 광고처럼 오버레이로 뜨지는 않지만, 더 존재감 있는 배너가 필요한 자리(예: AI 루틴
  // 생성 대기 화면)에서 'card' 대신 쓴다.
  variant?: 'card' | 'expanded';
}

export function AdBanner({ adGroupId, variant = 'card' }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!adGroupId || !containerRef.current || !isBannerAdSupported()) return;

    // attachBanner 자체가 특정 상황(초기화 전 호출 등)에서 예외를 던질 수 있어서,
    // 배너 하나 실패했다고 화면 전체가 죽지 않도록 감싼다.
    try {
      const { destroy } = TossAds.attachBanner(adGroupId, containerRef.current, {
        theme: 'auto',
        variant,
        callbacks: {
          onNoFill: () => setVisible(false),
          onAdFailedToRender: () => setVisible(false),
        },
      });

      return () => {
        try {
          destroy();
        } catch {
          // 이미 정리됐거나 실패해도 무시한다.
        }
      };
    } catch {
      setVisible(false);
      return;
    }
  }, [adGroupId, variant]);

  if (!adGroupId || !visible) return null;

  return (
    <div className="w-full">
      <div ref={containerRef} />
    </div>
  );
}
