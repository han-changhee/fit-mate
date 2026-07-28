import { AdBanner } from './AdBanner';

interface AdZoneProps {
  bannerAdGroupId?: string;
  label: string;
}

// 전면(인터스티셜) 광고는 네이티브 오버레이라 이 컴포넌트가 직접 렌더링하지 않는다
// (호출은 화면 쪽에서 loadFullScreenAd/showFullScreenAd로 별도 처리). 이 컴포넌트는
// 전면광고가 뜨기 전/실패했을 때도 자리를 채워줄 배너 영역 + 안내 문구를 담당한다.
export function AdZone({ bannerAdGroupId, label }: AdZoneProps) {
  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-center text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
        {label}
      </p>
      <div className="mt-2">
        <AdBanner adGroupId={bannerAdGroupId} />
      </div>
    </div>
  );
}
