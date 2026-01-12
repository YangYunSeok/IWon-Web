// /src/components/GlobalLoader.jsx
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { keyframes } from '@emotion/react';

const LOADING_EVENT = 'http:loading';

// 컨테이너를 일정 속도로 계속 회전
const spin = keyframes`
  100% { transform: rotate(360deg); }
`;

export default function GlobalLoader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const active = e.detail?.active ?? 0;
      setOpen(active > 0);
    };
    window.addEventListener(LOADING_EVENT, handler);
    return () => window.removeEventListener(LOADING_EVENT, handler);
  }, []);

  if (!open) return null;

  const size = 100;      // 크기
  const thickness = 5.5; // 두께
  const arcPercent = 20; // 컬러 호 길이(%) — 35~45 정도 추천

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 13000,
        pointerEvents: 'none',
      }}
    >
      <Box sx={{ position: 'relative', width: size, height: size }}>
        {/* 1) 회색 베이스(고정) */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ color: 'rgba(0, 0, 0, 0.15)' }}
        />

        {/* 2) 컬러 호: 길이 고정 + 컨테이너 회전 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            animation: `${spin} 1.4s linear infinite`, // 속도는 여기서만 제어
          }}
        >
          <CircularProgress
            variant="determinate"
            value={arcPercent}       // ✅ 처음부터 이 길이로 고정 (짧게 시작 안 함)
            size={size}
            thickness={thickness}
            sx={{
              color: (t) => t.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
