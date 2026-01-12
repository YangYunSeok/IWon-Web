import React from 'react';
import * as MuiIcons from '@mui/icons-material';

export const GMenuIcon = ({ iconName, size = 24, color = '#999999', sx = {} }) => {
  // 아이콘 이름이 없거나 유효하지 않으면 빈 박스 표시
  if (!iconName || !MuiIcons[iconName]) {
    return null;  // 또는 <div /> 빈 div 반환
  }

  const IconComponent = MuiIcons[iconName];

  return React.createElement(IconComponent, {
    sx: { fontSize: size, color, ...sx },
  });
};