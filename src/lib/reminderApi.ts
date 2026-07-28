// 서버 저장은 알림 발송 스케줄러가 참고하는 부가 데이터일 뿐이라, 실패해도
// 로컬(Storage/localStorage)에는 이미 반영돼 있으므로 화면 흐름을 막지 않는다.
export async function saveReminderTime(anonKey: string, reminderTime: string): Promise<void> {
  await fetch('/api/reminders/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonKey, reminderTime }),
  });
}
