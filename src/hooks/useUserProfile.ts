import { useCallback, useEffect, useState } from 'react';
import { Storage } from '@apps-in-toss/web-framework';
import type { UserProfile } from '../types';

const STORAGE_KEY = 'USER_PROFILE';

export function useUserProfile() {
  // undefined = 아직 로딩 중, null = 저장된 프로필 없음(온보딩 필요)
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    // 토스 인앱 웹뷰 밖(일반 브라우저 프리뷰)에서는 네이티브 브릿지가 없어
    // localStorage로 폴백한다.
    Storage.getItem(STORAGE_KEY)
      .catch(() => window.localStorage.getItem(STORAGE_KEY))
      .then((raw) => {
        setProfile(raw ? JSON.parse(raw) : null);
      });
  }, []);

  const saveProfile = useCallback((next: UserProfile) => {
    const serialized = JSON.stringify(next);
    Storage.setItem(STORAGE_KEY, serialized).catch(() =>
      window.localStorage.setItem(STORAGE_KEY, serialized)
    );
    setProfile(next);
  }, []);

  const clearProfile = useCallback(() => {
    Storage.removeItem(STORAGE_KEY).catch(() => window.localStorage.removeItem(STORAGE_KEY));
    setProfile(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}
