// src/pages/AutoLogin.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { http } from '@/libs/TaskHttp';

export default function AutoLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      alert('유효하지 않은 접근입니다.');
      navigate('/login');
      return;
    }

    (async () => {
      try {
        console.log('[AutoLogin] 토큰으로 로그인 시도:', token);
        
        const res = await http.post('/auth/loginWithToken', null, {
          params: { token }  // query parameter로 전달
        });
        
        if (res.success) {
          console.log('[AutoLogin] 로그인 성공:', res.user);
          setUser(res.user);
          navigate('/');
        } else {
          alert('로그인 실패: ' + (res.message || '알 수 없는 오류'));
          navigate('/login');
        }
      } catch (e) {
        console.error('[AutoLogin] 자동 로그인 실패:', e);
        alert('자동 로그인 실패: ' + (e.message || ''));
        navigate('/login');
      }
    })();
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '20px',
      color: '#333',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #1976d2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div>자동 로그인 중입니다...</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}