/**
 * GContentBox - 그리드/컨텐츠 영역 래퍼 컴포넌트
 * 
 * 사용 위치: 그리드, 상세 영역 등을 감싸는 컨테이너로 사용
 * 
 * 사용 예시:
 *   {고정 높이 영역}
 *   <GContentBox flex={false} marginBottom="8px">
 *     <GDataGrid ... />
 *     <GButtonGroup>...</GButtonGroup>
 *   </GContentBox>
 *   
 *   {확장 가능 영역}
 *   <GContentBox flex={true}>
 *     <GDataGrid ... />
 *     <GButtonGroup>...</GButtonGroup>
 *   </GContentBox>
 * 
 * @param {ReactNode} children - 컨텐츠 (필수)
 * @param {boolean} flex - 확장 가능 여부: true면 flex: 1, false면 flexShrink: 0 (기본값: false)
 * @param {string|number} marginBottom - 하단 마진 (기본값: flex=false일 때 '8px', flex=true일 때 0)
 * @param {string} overflow - overflow 속성 (기본값: flex=true일 때 'hidden', flex=false일 때 'visible')
 * @param {string} display - display 속성 (기본값: flex=true일 때 'flex', flex=false일 때 'block')
 * @param {string} flexDirection - flexDirection 속성 (기본값: flex=true일 때 'column', flex=false일 때 'row')
 * @param {number} minHeight - minHeight 속성 (기본값: flex=true일 때 0, flex=false일 때 'auto')
 * @param {object} sx - 추가 스타일 (선택)
 */
import React from 'react';
import { Box, useTheme } from '@mui/material';

export default function GContentBox({ 
  children, 
  flex = false,
  marginBottom,
  overflow,
  display,
  flexDirection,
  minHeight,
  sx = {} 
}) {
  const theme = useTheme();
  
  // flex에 따른 기본값 설정
  const defaultMarginBottom = marginBottom !== undefined 
    ? marginBottom 
    : (flex ? 0 : '8px');
  
  const defaultOverflow = overflow !== undefined 
    ? overflow 
    : (flex ? 'hidden' : 'visible');
  
  const defaultDisplay = display !== undefined 
    ? display 
    : (flex ? 'flex' : 'block');
  
  const defaultFlexDirection = flexDirection !== undefined 
    ? flexDirection 
    : (flex ? 'column' : 'row');
  
  const defaultMinHeight = minHeight !== undefined 
    ? minHeight 
    : (flex ? 0 : 'auto');

  const baseStyles = {
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.background.paper,
  };

  const flexStyles = flex 
    ? {
        flex: 1,
        minHeight: defaultMinHeight,
        display: defaultDisplay,
        flexDirection: defaultFlexDirection,
        overflow: defaultOverflow,
      }
    : {
        flexShrink: 0,
        marginBottom: defaultMarginBottom,
      };

  return (
    <Box 
      sx={{ 
        ...baseStyles,
        ...flexStyles,
        ...sx 
      }}
    >
      {children}
    </Box>
  );
}

