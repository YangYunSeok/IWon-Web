// GTitleIcon.jsx - 타이틀용 파란색 아이콘 컴포넌트
import React, { useMemo } from 'react';

/**
 * GTitleIcon - 타이틀 옆에 표시되는 파란색 배지 아이콘
 * @param {number} size - 아이콘 크기 (기본: 16)
 * @param {string} color - 시작 그라데이션 색상 (기본: '#1976d2')
 */
export default function GTitleIcon({ size = 16, color = '#1976d2' }) {
  // 각 인스턴스마다 고유한 ID 생성 (렌더링마다 동일하게 유지)
  const gradientId = useMemo(() => `gtitle-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#42a5f5" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${gradientId})`} />
      <path
        d="M12 4.5l1.4 3.4 3.6.3-2.8 2.3.9 3.5-3.1-1.9-3.1 1.9.9-3.5-2.8-2.3 3.6-.3L12 4.5z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M5 9c2-3.2 6.5-4.6 10-3.3"
        fill="none"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}