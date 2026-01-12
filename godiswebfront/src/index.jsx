// src/index.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import 'antd/dist/reset.css';

import { ConfigProvider } from 'antd';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { ThemeModeContext } from '@/theme/ThemeModeContext';
import { createMuiThemeFromTokens } from '@/theme/muiThemeFromTokens';
import { createAntdThemeConfig } from '@/theme/antdThemeFromMui';

import { AuthProvider } from '@/context/AuthContext.jsx';
import { PermissionProvider } from '@/authz/PermissionStore';
import PermissionEnforcer from '@/authz/PermissionEnforcer.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { DataProvider } from '@/context/DataContext.jsx';
import { http } from '@/libs/TaskHttp';
import { initErrorHandler } from '@/libs/ErrorHandler';

import App from '@/App';
import Login from '@/login.jsx';

// 프론트엔드 전역 오류 핸들러 초기화
initErrorHandler();

// 🔹 세션 체크 전용 컴포넌트 (기존 로직 유지)
function AuthGate() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState({ loading: true, loggedIn: false });

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const res = await http.post('/auth/session', {});
        if (canceled) return;

        if (!res || !res.success) {
          console.log('[AuthGate] 세션 없음 또는 오류:', res);
          setUser(null);
          setStatus({ loading: false, loggedIn: false });
          navigate('/login');
        } else {
          console.log('[AuthGate] 세션 유효 - 사용자:', res.user?.userId);
          setUser(res.user);
          setStatus({ loading: false, loggedIn: true });
        }
      } catch (e) {
        console.error('[AuthGate] 세션 체크 실패:', e);
        if (canceled) return;

        setUser(null);
        setStatus({ loading: false, loggedIn: false });
        //navigate('/login');
      }
    })();

    return () => {
      canceled = true;
    };
  }, [setUser]);
  //}, [setUser, navigate]);

  // user 상태가 변경되면 loggedIn 상태도 동기화
  useEffect(() => {
    if (!user?.userId && status.loggedIn) {
      console.log('[AuthGate] 사용자 로그아웃 감지 - 로그인 화면 표시');
      setStatus({ loading: false, loggedIn: false });
    }
  }, [user, status.loggedIn]);

  if (status.loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef3f9'
      }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  // if (status.loading) {
  //   return <div>Loading...</div>;
  // }

  // 🔹 여기서부터 DataProvider 안에 있으므로
  // App, Login, GMessageBox 모두 useData() 사용 가능
  if (!status.loggedIn) {
    return (
      <Login
        onSuccess={() => {
          console.log('[AuthGate] 로그인 성공 - 메인 화면 표시');
          setStatus({ loading: false, loggedIn: true })
        }}
      />
    );
  }

  return <App />;
}

function Root() {
  const [mode, setMode] = useState(
    () => localStorage.getItem('mode') || 'light'
  );

  useEffect(() => {
    localStorage.setItem('mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // tokens.json → MUI theme
  const muiTheme = useMemo(
    () => createMuiThemeFromTokens(mode),
    [mode]
  );

  // MUI theme → AntD theme config
  const antdThemeConfig = useMemo(
    () => createAntdThemeConfig(muiTheme, mode),
    [muiTheme, mode]
  );

  return (
    <BrowserRouter>
      <ThemeModeContext.Provider value={{ mode, setMode }}>
        <ConfigProvider theme={antdThemeConfig}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <AuthProvider>
              <PermissionProvider>
                <PermissionEnforcer>
                  {/* 🔹 전역 메시지/데이터 컨텍스트: AuthGate 전체를 감쌈 */}
                  <DataProvider>
                    <AuthGate />
                  </DataProvider>
                </PermissionEnforcer>
              </PermissionProvider>
            </AuthProvider>
          </ThemeProvider>
        </ConfigProvider>
      </ThemeModeContext.Provider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
