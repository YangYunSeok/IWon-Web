/**
 * GSearchSection - 검색 영역 래퍼 컴포넌트
 * 
 * 사용 위치: 화면 상단의 검색 영역(GSearchHeader)을 감싸는 컨테이너로 사용
 * 
 * 사용 예시:
 *   <GSearchSection>
 *     <GSearchHeader
 *       fields={[...]}
 *       buttons={[...]}
 *     />
 *   </GSearchSection>
 * 
 * @param {ReactNode} children - 검색 헤더 컴포넌트 (필수, 일반적으로 GSearchHeader)
 * @param {boolean} flexShrink - flex-shrink 속성 (기본값: true)
 * @param {object} sx - 추가 스타일 (선택)
 */
import React from 'react';
import { Box } from '@mui/material';

export default function GSearchSection({ 
  children, 
  flexShrink = true,
  sx = {} 
}) {
  return (
    <Box 
      sx={{ 
        flexShrink: flexShrink ? 0 : 'auto',
        ...sx 
      }}
    >
      {children}
    </Box>
  );
}

