import { useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import { NotificationSubscribeButton } from '../components/NotificationSubscribeButton';
import { fetchAnonymousKey } from '../lib/anonymousKey';
import { saveReminderTime } from '../lib/reminderApi';

const STORAGE_KEY = 'REMINDER_TIME';
const DEFAULT_REMINDER_TIME = '19:00';

interface SettingsScreenProps {
  onBack: () => void;
  // 회원탈퇴 비활성화 — 아래 JSX/handleWithdraw 주석과 함께 재활성화할 것
  // onWithdraw: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  // const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        if (raw) setReminderTime(raw);
      });
  }, []);

  const handleChange = (value: string) => {
    setReminderTime(value);
    Storage.setItem(STORAGE_KEY, value).catch(() =>
      window.localStorage.setItem(STORAGE_KEY, value)
    );

    // 서버에도 저장해야 알림 스케줄러가 이 시간을 알 수 있다. 익명 키를 못
    // 받아오거나 서버 저장이 실패해도 로컬 값은 이미 반영됐으니 조용히 넘어간다.
    fetchAnonymousKey().then((anonKey) => {
      if (!anonKey) return;
      saveReminderTime(anonKey, value).catch(() => {});
    });
  };

  // const handleWithdraw = () => {
  //   Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
  //   onWithdraw();
  // };

  return (
    <div className="flex min-h-screen flex-col gap-6 px-6 py-8">
      <button type="button" onClick={onBack} className="self-start text-sm text-gray-400">
        ← 뒤로
      </button>

      <h1 className="text-lg font-bold text-gray-800">설정</h1>

      <div className="rounded-2xl border border-gray-200 px-5 py-4">
        <p className="text-sm font-medium text-gray-700">운동 알림 시간</p>
        <input
          type="time"
          value={reminderTime}
          onChange={(event) => handleChange(event.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <p className="mt-2 text-xs text-gray-400">
          알림을 실제로 받으려면 아래에서 알림 동의가 필요해요.
        </p>
      </div>

      <NotificationSubscribeButton />

      {/* 회원탈퇴 비활성화 — DB 추가 후 onWithdraw prop과 함께 재활성화
      <div className="mt-auto">
        {confirmingWithdraw ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center">
            <p className="text-sm text-red-600">
              정말 탈퇴하시겠어요? 저장된 프로필과 운동 기록이 모두 삭제돼요.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingWithdraw(false)}
                className="flex-1 rounded-full border border-gray-200 py-2 text-sm text-gray-500"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                className="flex-1 rounded-full bg-red-500 py-2 text-sm font-bold text-white"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingWithdraw(true)}
            className="w-full text-center text-xs text-gray-300 underline"
          >
            회원탈퇴
          </button>
        )}
      </div>
      */}
    </div>
  );
}
