import { useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import { NotificationSubscribeButton } from '../components/NotificationSubscribeButton';
import { fetchAnonymousKey } from '../lib/anonymousKey';
import { saveReminderTime } from '../lib/reminderApi';

const STORAGE_KEY = 'REMINDER_TIME';
const DEFAULT_REMINDER_TIME = '19:00';
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function parseTime(value: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  return {
    hour: Number.isNaN(hour) ? 19 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  };
}

// 발송 스케줄러(cron)가 15분 간격으로만 도는 무료 티어라, 그 시각과 정확히
// 일치해야 알림이 울린다. 브라우저 시간 선택기가 15분 단위를 무시하고 값을
// 넘기는 경우에도 안전하도록 항상 가까운 15분 단위로 반올림해서 저장한다.
function roundToNearest15(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const totalMinutes = (hour * 60 + Math.round(minute / 15) * 15) % (24 * 60);
  const roundedHour = Math.floor(totalMinutes / 60);
  const roundedMinute = totalMinutes % 60;
  return `${String(roundedHour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`;
}

interface SettingsScreenProps {
  onBack: () => void;
  onEditProfile: () => void;
  // 회원탈퇴 비활성화 — 아래 JSX/handleWithdraw 주석과 함께 재활성화할 것
  // onWithdraw: () => void;
}

export function SettingsScreen({ onBack, onEditProfile }: SettingsScreenProps) {
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  // const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        if (raw) setReminderTime(raw);
      });
  }, []);

  const handleChange = (rawValue: string) => {
    const value = roundToNearest15(rawValue);
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

  const { hour, minute } = parseTime(reminderTime);

  // const handleWithdraw = () => {
  //   Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
  //   onWithdraw();
  // };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-black px-6 py-8 text-white">
      <button type="button" onClick={onBack} className="self-start text-sm font-bold text-zinc-500">
        ← 뒤로
      </button>

      <h1 className="text-2xl font-black tracking-tight uppercase">설정</h1>

      <button
        type="button"
        onClick={onEditProfile}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left"
      >
        <span className="text-sm font-bold text-zinc-300">운동 정보 수정</span>
        <span className="text-xs font-bold text-zinc-600">체력 수준 · 목적 · 부위 →</span>
      </button>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <p className="text-sm font-bold text-zinc-300">운동 알림 시간</p>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={hour}
            onChange={(event) =>
              handleChange(`${event.target.value.padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
            }
            className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-bold text-lime-400"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}시
              </option>
            ))}
          </select>
          <span className="text-lg font-black text-lime-400">:</span>
          <select
            value={minute}
            onChange={(event) =>
              handleChange(`${String(hour).padStart(2, '0')}:${event.target.value.padStart(2, '0')}`)
            }
            className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-bold text-lime-400"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}분
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs font-bold text-zinc-600">
          15분 단위(정각/15분/30분/45분)로만 설정할 수 있어요.
        </p>
        <p className="mt-1 text-xs font-bold text-zinc-600">
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
