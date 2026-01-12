import { useEffect } from 'react';
import { http } from '@/libs/TaskHttp';
import { throttle } from 'lodash';

export default function SessionKeepStatus() {
  useEffect(() => {
    const sendKeepStatus = throttle(() => {
    console.log('sendKeepStatus 호출:', new Date().toLocaleTimeString());
      http.post('/auth/keepsession', {}, {})
        .then(() => console.log('세션 갱신'))
        .catch(err => console.error('세션 갱신 실패', err));
    }, 60 * 1000); // 1분에 1번 호출

    window.addEventListener('mousemove', sendKeepStatus);
    window.addEventListener('keydown', sendKeepStatus);
    window.addEventListener('click', sendKeepStatus);
    window.addEventListener('scroll', sendKeepStatus);

    const interval = setInterval(() => sendKeepStatus(), 5*60*1000);

    return () => {
      window.removeEventListener('mousemove', sendKeepStatus);
      window.removeEventListener('keydown', sendKeepStatus);
      window.removeEventListener('click', sendKeepStatus);
      window.removeEventListener('scroll', sendKeepStatus);
      clearInterval(interval);
    };
  }, []);
}