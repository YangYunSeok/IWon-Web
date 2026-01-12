// useAutoLogout.js
import { useEffect } from 'react';
import { http } from '@/libs/TaskHttp';

export default function AutoLogout(timeoutMinutes = 1440) {
  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        http.post('/auth/logout', {}, {})
          .finally(() => window.location.href = '/login');
      }, timeoutMinutes*60*1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer(); // 초기 타이머

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      if(logoutTimer) clearTimeout(logoutTimer);
    };
  }, [timeoutMinutes]);
}