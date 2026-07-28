import { useState } from 'react';
import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

// 토스 콘솔에서 알림 템플릿을 등록/승인받아야 발급되는 코드.
// 아직 없으면 버튼을 눌러도 안내 문구만 뜨고 동의 요청은 보내지 않는다.
const TEMPLATE_CODE = import.meta.env.PUBLIC_NOTIFICATION_TEMPLATE_CODE;

export function NotificationSubscribeButton() {
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = () => {
    if (!TEMPLATE_CODE) {
      setStatus('아직 준비 중인 기능이에요.');
      return;
    }

    requestNotificationAgreement({
      options: { templateCode: TEMPLATE_CODE },
      onEvent: (result) => {
        if (result.type === 'newAgreement' || result.type === 'alreadyAgreed') {
          setStatus('운동 알림을 받아볼게요!');
        } else {
          setStatus('알림 동의가 거절됐어요.');
        }
      },
      onError: () => {
        setStatus('알림 동의 요청에 실패했어요.');
      },
    });
  };

  return (
    <div className="w-full text-center">
      <button type="button" onClick={handleClick} className="text-sm font-bold text-cyan-400 underline">
        🔔 운동 알림 받기
      </button>
      {status && <p className="mt-1 text-xs font-bold text-zinc-500">{status}</p>}
    </div>
  );
}
