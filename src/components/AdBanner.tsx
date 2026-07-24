import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import { isBannerAdSupported } from '../lib/adSupport';

interface AdBannerProps {
  adGroupId?: string;
}

export function AdBanner({ adGroupId }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!adGroupId || !containerRef.current || !isBannerAdSupported()) return;

    // attachBanner 자체가 특정 상황(초기화 전 호출 등)에서 예외를 던질 수 있어서,
    // 배너 하나 실패했다고 화면 전체가 죽지 않도록 감싼다.
    try {
      const { destroy } = TossAds.attachBanner(adGroupId, containerRef.current, {
        theme: 'auto',
        variant: 'card',
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
  }, [adGroupId]);

  if (!adGroupId || !visible) return null;

  return (
    <div className="w-full">
      <div ref={containerRef} />
    </div>
  );
}
