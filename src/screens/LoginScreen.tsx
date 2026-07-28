import { useState } from 'react';
import { appLogin } from '@apps-in-toss/web-framework';
import { verifyTossLogin } from '../lib/authApi';

interface LoginScreenProps {
  onLoggedIn: (authorizationCode: string) => void;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleLogin = async () => {
    if (!agreed || status === 'loading') return;
    setStatus('loading');
    try {
      const { authorizationCode, referrer } = await appLogin();
      await verifyTossLogin(authorizationCode, referrer);
      onLoggedIn(authorizationCode);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-3xl">🏃</p>
        <h1 className="mt-3 text-lg font-bold text-gray-800">핏메이트</h1>
        <p className="mt-2 text-sm text-gray-500">토스 로그인으로 바로 시작해요</p>
      </div>

      <label className="flex w-full items-start gap-2 text-left text-xs text-gray-500">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          [필수] 이용약관 및 개인정보처리방침에 동의하며, 토스 로그인을 통해 회원가입을
          진행합니다.
        </span>
      </label>

      <button
        type="button"
        onClick={handleLogin}
        disabled={!agreed || status === 'loading'}
        className="w-full rounded-full bg-blue-500 py-3 text-sm font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
      >
        {status === 'loading' ? '로그인 중...' : '토스로 시작하기'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-500">로그인에 실패했어요. 토스 앱에서 다시 시도해주세요.</p>
      )}
    </div>
  );
}
