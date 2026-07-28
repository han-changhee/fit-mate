import { AdBanner } from './AdBanner';

interface AdZoneProps {
  bannerAdGroupId?: string;
  label: string;
  variant?: 'card' | 'expanded';
}

// 전면(인터스티셜) 광고는 닫으면 이전 화면(예: 로딩 화면)이 다시 보이는 게
// 어색해서 쓰지 않는다. 대신 이 컴포넌트가 "Sponsored" 라벨 + 인라인 배너로
// 광고 영역을 채운다. variant="expanded"를 쓰면 더 존재감 있는 크기로 보인다.
export function AdZone({ bannerAdGroupId, label, variant = 'card' }: AdZoneProps) {
  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-center text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
        {label}
      </p>
      <div className="mt-2">
        <AdBanner adGroupId={bannerAdGroupId} variant={variant} />
      </div>
    </div>
  );
}
