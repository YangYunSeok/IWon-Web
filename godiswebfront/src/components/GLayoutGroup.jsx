// src/components/GLayoutGroup.jsx
import React, { createContext, useContext, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ✅ 실제 import된 컴포넌트를 참조로 비교하기 위해 import
import GLayoutItem from './GLayoutItem';
import GLayoutGroup from './GLayoutGroup';

/**
 * LayoutContext
 * - GLayoutItem에서 레이블 최대 폭을 공유하기 위한 컨텍스트
 */
export const LayoutContext = createContext(null);

/**
 * GLayoutGroup
 * - 하위 GLayoutItem, GLayoutGroup에 공통 속성(border, labelWidth, itemHeight 등) 전달
 */
export default function LayoutGroup({
  children,
  orientation = 'vertical',
  spacing = 0,
  labelAlignment,
  header,
  collapsible = false,

  backgroundColor,
  border,
  borderColor,
  borderRadius,
  padding,
  width,
  height,
  verticalAlign = 'top',
  itemBorder,
  itemBorderColor,
  labelWidth,
  itemHeight,
  sx,
}) {
  // 레이블 폭 공유용 컨텍스트
  const parentContext = useContext(LayoutContext);
  const isLocal = labelAlignment === 'local';

  const [maxLabelWidth, setMaxLabelWidth] = useState(0);
  const registerLabelWidth = (w) => {
    setMaxLabelWidth((prev) => (w > prev ? w : prev));
  };

  const contextValue =
    isLocal || !parentContext
      ? { maxLabelWidth, registerLabelWidth }
      : parentContext;

  // width/height 해석: 숫자면 px, 문자열이면 그대로
  const resolvedWidth =
    width == null
      ? '100%'
      : typeof width === 'number'
      ? `${width}px`
      : width;

  const resolvedHeight =
    height == null
      ? undefined
      : typeof height === 'number'
      ? `${height}px`
      : height;

  // vertical 정렬 옵션 매핑
  const alignMap = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  };

  const mainJustify =
    orientation === 'vertical' ? alignMap[verticalAlign] || 'flex-start' : undefined;

  const crossAlign =
    orientation === 'horizontal' ? alignMap[verticalAlign] || 'center' : undefined;

  // ✅ children에 itemBorder, labelWidth, itemHeight를 안전하게 주입 (빌드 난독화 방지)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === GLayoutItem || child.type === GLayoutGroup) {
      return React.cloneElement(child, {
        border: child.props.border || itemBorder,
        borderColor: child.props.borderColor || itemBorderColor,
        labelWidth: child.props.labelWidth || labelWidth,
        height: child.props.height || itemHeight,
      });
    }

    return child;
  });

  const content = (
    <Stack
      direction={orientation === 'vertical' ? 'column' : 'row'}
      spacing={spacing}
      justifyContent={mainJustify}
      alignItems={crossAlign}
      sx={{ width: '100%', height: '100%' }}
    >
      {childrenWithProps}
    </Stack>
  );

  // 그룹 외곽 Box/Accordion 공통 스타일
  const rootSx = {
    width: resolvedWidth,
    ...(resolvedHeight ? { height: resolvedHeight } : null),
    ...(backgroundColor ? { backgroundColor } : null),
    ...(border ? { border } : null),
    ...(borderColor ? { borderColor } : null),
    ...(borderRadius ? { borderRadius } : null),
    ...(padding != null ? { p: padding } : null),
    ...sx,
  };

  let groupBody;

  if (collapsible) {
    // 접었다 펴는 Accordion 그룹
    groupBody = (
      <Accordion defaultExpanded sx={rootSx}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 32,
            '& .MuiAccordionSummary-content': { margin: 0 },
          }}
        >
          {header && <Typography variant="subtitle2">{header}</Typography>}
        </AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    );
  } else if (header) {
    // 헤더가 있는 일반 박스 형태 그룹
    groupBody = (
      <Box
        sx={{
          border: border || 1,
          borderColor: borderColor || 'divider',
          borderRadius: borderRadius ?? 1,
          p: padding ?? 1,
          ...rootSx,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {header}
        </Typography>
        {content}
      </Box>
    );
  } else {
    // 헤더/아코디언 없는 기본 그룹
    groupBody = <Box sx={rootSx}>{content}</Box>;
  }

  return (
    <LayoutContext.Provider value={contextValue}>
      {groupBody}
    </LayoutContext.Provider>
  );
}
