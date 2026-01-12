/**
 * GButtonGroup - 버튼 그룹 영역 컴포넌트
 * 
 * 사용 위치: 그리드 하단, 상세 영역 하단 등에서 여러 버튼을 그룹화하여 표시할 때 사용
 * 
 * 사용 예시:
 *   <GButtonGroup>
 *     <GButton auth="Save" label="Save" onClick={handleSave} />
 *   </GButtonGroup>
 *   
 *   <GButtonGroup justifyContent="space-between">
 *     <GButton auth="CacheDeploy" label="Cache Deploy" onClick={handleDeploy} />
 *     <GButton auth="Save" label="Save" onClick={handleSave} />
 *   </GButtonGroup>
 * 
 *   <GButtonGroup sx={{ mt: '8px' }}>
 *     <GButton auth="Save" label="Save" onClick={handleSave} />
 *   </GButtonGroup>
 * 
 * @param {ReactNode} children - 버튼 컴포넌트들 (필수)
 * @param {string} justifyContent - 버튼 정렬 방식: 'flex-start' | 'center' | 'flex-end' | 'space-between' (기본값: 'flex-end')
 * @param {string|number} marginTop - 상단 마진 (기본값: '8px')
 * @param {boolean} flexShrink - flex-shrink 속성 (기본값: true)
 * @param {object} sx - 추가 스타일 (선택)
 */
import React from 'react';
import { Box } from '@mui/material';

export default function GButtonGroup({ 
  children, 
  justifyContent = 'flex-end',
  marginTop = '8px',
  flexShrink = true,
  sx = {}
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent, 
        gap: 1, 
        marginTop,
        flexShrink: flexShrink ? 0 : 'auto',
        ...sx 
      }}
    >
      {children}
    </Box>
  );
}

