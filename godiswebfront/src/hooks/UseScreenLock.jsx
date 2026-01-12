import { useState, useEffect } from 'react';

export default function useScreenLock(lockMinutes = 1, logoutMinutes = 2) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let lockTimer;
    let logoutTimer;

    const logout = () => {
      // 로그아웃 API 호출 및 이동
      window.location.replace('/login');
    };

    const resetTimers = () => {
      // 1. 기존 타이머들 클리어
      if (lockTimer) clearTimeout(lockTimer);
      if (logoutTimer) clearTimeout(logoutTimer);

      // 2. 잠금 타이머 설정 (잠긴 상태가 아닐 때만 리셋)
      if (!isLocked) {
        lockTimer = setTimeout(() => {
          setIsLocked(true); // 10분 뒤 화면 잠금
        }, lockMinutes * 60 * 1000);
      }

      // 3. 로그아웃 타이머 설정 (항상 30분 뒤 실행)
      logoutTimer = setTimeout(logout, logoutMinutes * 60 * 1000);
    };

    // 잠긴 상태가 아닐 때만 마우스 움직임으로 타이머 리셋
    if (!isLocked) {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      events.forEach(event => window.addEventListener(event, resetTimers));
      resetTimers();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimers));
        if (lockTimer) clearTimeout(lockTimer);
        if (logoutTimer) clearTimeout(logoutTimer);
      };
    }
  }, [isLocked, lockMinutes, logoutMinutes]);

  return { isLocked, setIsLocked };
}