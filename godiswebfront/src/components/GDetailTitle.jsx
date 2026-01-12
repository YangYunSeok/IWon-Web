/**
 * GDetailTitle - 상세 영역 타이틀 컴포넌트
 * 
 * 사용 위치: 화면의 상세 영역(Detail Area)에서 섹션 제목을 표시할 때 사용
 * 
 * 사용 예시:
 *   <GDetailTitle title="계층코드 상세" />
 *   <GDetailTitle title="사용자 정보" iconSize={18} />
 *   <GDetailTitle title="메뉴관리" action={<Button>추가</Button>} />
 * 
 * @param {string} title - 타이틀 텍스트 (필수)
 * @param {number} iconSize - GTitleIcon 크기 (기본값: 16)
 * @param {ReactNode} action - 우측 액션 영역에 표시할 컴포넌트 (선택)
 * @param {object} sx - 추가 스타일 (선택)
 */
import React from 'react';
import { Box, useTheme } from '@mui/material';
import GTitleIcon from './GTitleIcon';

export default function GDetailTitle({ 
  title, 
  iconSize = 16, 
  action = null,
  sx = {} 
}) {
  const theme = useTheme();
  // GContentBox와 동일한 배경색 사용 (background.paper)
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: theme.palette.background.paper,
        padding: '4px 8px', 
        marginBottom: '8px',
        flexShrink: 0,
        ...sx 
      }}
    >
      <Box sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <GTitleIcon size={iconSize} />
        {title}
      </Box>
      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
}

