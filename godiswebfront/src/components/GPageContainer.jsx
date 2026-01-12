/**
 * GPageContainer - 화면 최상위 컨테이너 컴포넌트
 * 
 * 사용 위치: 모든 화면의 최상위 레이아웃 컨테이너로 사용
 * 
 * 사용 예시:
 *   <GPageContainer>
 *     <GSearchSection>
 *       <GSearchHeader ... />
 *     </GSearchSection>
 *     <GDataGrid ... />
 *   </GPageContainer>
 * 
 * @param {ReactNode} children - 화면 내용 (필수)
 * @param {string} height - 컨테이너 높이 (기본값: 'calc(100vh - 120px)')
 * @param {number|string} padding - 내부 패딩 (기본값: 0.5)
 * @param {number|string} gap - 자식 요소 간 간격 (기본값: 1)
 * @param {string} overflow - overflow 속성 (기본값: 'hidden')
 * @param {object} sx - 추가 스타일 (선택)
 */
import React from 'react';
import { Box } from '@mui/material';

export default function GPageContainer({ 
  children, 
  height = 'calc(100vh - 120px)',
  padding = 0.5,
  gap = 1,
  overflow = 'hidden',
  sx = {} 
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height,
        p: padding,
        gap,
        overflow,
        ...sx 
      }}
    >
      {children}
    </Box>
  );
}

