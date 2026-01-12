import React, { useContext, useRef, useLayoutEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LayoutContext } from './GLayoutGroup';

/**
 * props.
 * - label, colon, labelPosition('left'|'top')
 * - labelStyle: 레이블 텍스트(Typography)에 적용
 * - labelContainerStyle: 레이블 셀(Box)에 적용 (배경/테두리 등)
 * - labelWidth: 고정 레이블 폭(px). 지정 시 컨텍스트 계산 무시
 * - labelPaddingX: 컨텍스트 정렬 시 텍스트폭에 더해줄 좌우 여유(px)
 * - contentStyle: 우측 콘텐츠 셀 스타일
 * - backgroundColor: 전체 아이템(컨트롤 영역) 배경색
 * - contentAlign: 'left' | 'center' | 'right'  (컨트롤 가로 정렬)
 * - border/borderColor/borderRadius: LayoutItem 수준 테두리(지정 시에만 적용)
 * - borderVariant: 'row'(행 전체 한 줄) | 'cells'(각 셀별)
 * - height: LayoutItem 행 높이(px) — grid 컨테이너에만 부여
 */
export default function LayoutItem({
  label,
  colon = false,
  labelPosition = 'left',
  labelStyle = {},
  labelContainerStyle = {},
  labelWidth,
  labelPaddingX = 40,
  contentStyle = {},
  children,
  sx,
  backgroundColor,         // ✅ 추가
  contentAlign = 'left',   // ✅ 추가: 'left' | 'center' | 'right'
  border,                  // ex) '1px solid #aaa' (지정 시에만 적용)
  borderColor,             // ex) '#999' or 'divider'
  borderRadius,
  borderVariant = 'row',   // 'row' | 'cells'
  height = 30,
}) {
  const context = useContext(LayoutContext);
  const textRef = useRef(null);


  // 콜론 자동
  let displayLabel = label ;
  if (colon && typeof label === 'string') {
    displayLabel = label.endsWith(':') ? label : `${label} :`;
  }

  const hasLabel = !!displayLabel; // 레이블 존재 여부

  // 컨텐츠 가로 정렬 -> flex justifyContent로 변환
  const justify =
    contentAlign === 'center'
      ? 'center'
      : contentAlign === 'right'
      ? 'flex-end'
      : 'flex-start';

  // 컨텍스트 정렬용 폭 측정: 텍스트 폭 + 좌우 패딩 여유치 등록
  useLayoutEffect(() => {
    if (!hasLabel) return;
    if (context && textRef.current && labelPosition === 'left' && labelWidth == null) {
      const measured = textRef.current.offsetWidth + labelPaddingX + 5;
      context.registerLabelWidth(measured);
    }
  }, [hasLabel, context, labelPosition, labelWidth, labelPaddingX]);

  // 최종 레이블 컬럼 폭(px)
  const labelColWidth =
    labelPosition === 'left'
      ? (labelWidth ?? (context ? context.maxLabelWidth : undefined)) || 120
      : undefined;

  // ----- TOP 레이아웃 -----
  if (labelPosition === 'top') {
    if (borderVariant === 'row') {
      // 행 전체 테두리: 지정 시에만 적용
      return (
        <Box
          sx={{
            width: '100%',
            mb: 0,
            p: 0,
            ...(border
              ? { border, borderColor: borderColor || 'divider', borderRadius }
              : {}),
          }}
        >
          {hasLabel && (
            <Box sx={{ padding: '0px 8px', ...labelContainerStyle }}>
              <Typography ref={textRef} variant="body2" sx={labelStyle}>
                {displayLabel}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              width: '100%',
              height: `${height}px`,
              maxHeight: `${height}px`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: justify,
              backgroundColor, // ✅ 전체 배경
              // 하위 MUI 입력 컨트롤 자동 높이 동기화
              '& .MuiFormControl-root': { height: '100%', maxHeight: '100%' },
              '& .MuiInputBase-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
              '& .MuiOutlinedInput-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
              '& .MuiOutlinedInput-input': {
                height: '100%',
                maxHeight: '100%',
                padding: '0 8px',
                boxSizing: 'border-box',
              },
              '& .MuiInputBase-input': {
                height: '100%',
                maxHeight: '100%',
                padding: '0 8px',
                boxSizing: 'border-box',
              },
              '& textarea': {
                padding: '0 8px !important',
                boxSizing: 'border-box',
                overflow: 'auto !important',
              },
              '& .MuiSelect-select': {
                height: '100%',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiInputAdornment-root': { height: '100%', maxHeight: '100%' },

              ...contentStyle,
            }}
          >
            {children}
          </Box>
        </Box>
      );
    }

    // cells 테두리: 지정 시에만 각 요소에 개별 테두리
    return (
      <Box sx={{ width: '100%', mb: 0, ...sx }}>
        {hasLabel && (
          <Box
            sx={{
              padding: '0px 8px',
              ...(border
                ? { border, borderColor: borderColor || 'divider', borderRadius }
                : {}),
              ...labelContainerStyle,
            }}
          >
            <Typography ref={textRef} variant="body2" sx={labelStyle}>
              {displayLabel}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            width: '100%',
            height: `${height}px`,
            maxHeight: `${height}px`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: justify,
            backgroundColor,
            ...(border
              ? { border, borderColor: borderColor || 'divider', borderRadius }
              : {}),
            p: 0,
            // 하위 MUI 입력 컨트롤 자동 높이 동기화
            '& .MuiFormControl-root': { height: '100%', maxHeight: '100%' },
            '& .MuiInputBase-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
            '& .MuiOutlinedInput-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
            '& .MuiOutlinedInput-input': {
              height: '100%',
              maxHeight: '100%',
              padding: '0 8px',
              boxSizing: 'border-box',
            },
            '& .MuiInputBase-input': {
              height: '100%',
              maxHeight: '100%',
              padding: '0 8px',
              boxSizing: 'border-box',
            },
            '& textarea': {
              padding: '0 8px !important',
              boxSizing: 'border-box',
              overflow: 'auto !important',
            },
            '& .MuiSelect-select': {
              height: '100%',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiInputAdornment-root': { height: '100%', maxHeight: '100%' },

            ...contentStyle,
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  // ----- LEFT 레이아웃 (좌 레이블, 우 입력) -----

  // 1) 레이블이 없는 경우: 왼쪽 공간 없이 컨트롤만 렌더
  if (!hasLabel && labelPosition === 'left') {
    return (
      <Box
        sx={{
          width: '100%',
          mb: 0,
          height: `${height}px`,
          maxHeight: `${height}px`,
          overflow: 'hidden',
          ...sx,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: justify,
            backgroundColor,
            p: 0,

            '& .MuiFormControl-root': { height: '100%', maxHeight: '100%' },
            '& .MuiInputBase-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
            '& .MuiOutlinedInput-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
            '& .MuiOutlinedInput-input': {
              height: '100%',
              maxHeight: '100%',
              padding: '0 8px',
              boxSizing: 'border-box',
            },
            '& .MuiInputBase-input': {
              height: '100%',
              maxHeight: '100%',
              padding: '0 8px',
              boxSizing: 'border-box',
            },
            '& textarea': {
              padding: '0 8px !important',
              boxSizing: 'border-box',
              overflow: 'auto !important',
            },
            '& .MuiSelect-select': {
              height: '100%',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiInputAdornment-root': { height: '100%', maxHeight: '100%' },

            ...(borderVariant === 'cells' && border
              ? { border, borderColor: borderColor || 'divider', borderRadius }
              : {}),
            ...contentStyle,
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  // 2) 레이블 있는 일반 LEFT 레이아웃
  const gridContent = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${labelColWidth}px 1fr`,
        alignItems: 'center',
        columnGap: '0px',
        height: `${height}px`,
        maxHeight: `${height}px`,
        overflow: 'hidden',
        backgroundColor,
      }}
    >
      {/* 레이블 셀 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          padding: '0px 8px',
          ...(borderVariant === 'cells' && border
            ? { border, borderColor: borderColor || 'divider', borderRadius }
            : {}),
          ...labelContainerStyle,
        }}
      >
        {hasLabel && (
          <Typography ref={textRef} variant="body2" sx={labelStyle}>
            {displayLabel}
          </Typography>
        )}
      </Box>

      {/* 입력 셀 */}
      <Box
        sx={{
          minWidth: 0,
          height: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: justify,
          p: 0,
          overflow: 'hidden',

          '& .MuiFormControl-root': { height: '100%', maxHeight: '100%' },
          '& .MuiInputBase-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
          '& .MuiOutlinedInput-root': { height: '100%', maxHeight: '100%', overflow: 'auto' },
          '& .MuiOutlinedInput-input': {
            height: '100%',
            maxHeight: '100%',
            padding: '0 8px',
            boxSizing: 'border-box',
          },
          '& .MuiInputBase-input': {
            height: '100%',
            maxHeight: '100%',
            padding: '0 8px',
            boxSizing: 'border-box',
          },
          '& textarea': {
            padding: '0 8px !important',
            boxSizing: 'border-box',
            overflow: 'auto !important',
          },
          '& .MuiSelect-select': {
            height: '100%',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiInputAdornment-root': { height: '100%', maxHeight: '100%' },

          ...(borderVariant === 'cells' && border
            ? { border, borderColor: borderColor || 'divider', borderRadius }
            : {}),
          ...contentStyle,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  // row 테두리: 바깥 래퍼에 한 번만 (지정 시에만) 적용
  if (borderVariant === 'row') {
    return (
      <Box
        sx={{
          width: '100%',
          mb: 0,
          p: 0,
          ...(border
            ? { border, borderColor: borderColor || 'divider', borderRadius }
            : {}),
        }}
      >
        {gridContent}
      </Box>
    );
  }

  // cells 테두리
  return <Box sx={{ width: '100%', mb: 0, ...sx}}>{gridContent}</Box>;
}
