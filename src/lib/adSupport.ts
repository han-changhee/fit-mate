import { TossAds, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { safeIsSupported } from './bridgeSupport';

export function isAdInitSupported(): boolean {
  return safeIsSupported(TossAds.initialize.isSupported);
}

export function isBannerAdSupported(): boolean {
  return safeIsSupported(TossAds.attachBanner.isSupported);
}

export function isFullScreenAdSupported(): boolean {
  return (
    safeIsSupported(loadFullScreenAd.isSupported) &&
    safeIsSupported(showFullScreenAd.isSupported)
  );
}
