import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';     // ✅ OK
import UndoIcon from '@mui/icons-material/Undo';                   // 🔄 Revert
import DoneAllIcon from '@mui/icons-material/DoneAll';             // 🟩 Apply
import CloudUploadIcon from '@mui/icons-material/CloudUpload';     // ☁️ Upload
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';   // 🚀 CacheDeploy 
import ImageIcon from '@mui/icons-material/Image';
import LockIcon from '@mui/icons-material/Lock';
import { setActionType } from '@/libs/Protocol';

export default function GButton({ auth, label, onClick, sx, iconOnly = false }) {
  let icon = null;
  let variant = 'outlined';
  let color = 'secondary';
  
 switch (label) {
    case "Init":
      icon = <RestartAltIcon />;
      break;
    case "Search":
      icon = <SearchIcon />;
      variant = "contained";
      color = "primary";
      break;
    case "Save":
      icon = <SaveIcon />;
      variant = "contained";
      color = "primary";
      break;
    case "Cancel":
      icon = <CancelIcon />;
      break;
    case "Ok":
      icon = <CheckCircleIcon />;
      variant = "contained";
      color = "success";
      break;
    case "Revert":
      icon = <UndoIcon />;
      color = "warning";
      break;
    case "Apply":
      icon = <DoneAllIcon />;
      variant = "contained";
      color = "info";
      break;
    case "Upload":
      icon = <CloudUploadIcon />;
      variant = "contained";
      color = "secondary";
      break;
    case "CacheDeploy":
      icon = <RocketLaunchIcon />;
      variant = "contained";
      color = "warning";
      break;
    case "Image":
      icon = <ImageIcon />;
      color = "secondary";
      break;
    case "Authority":
      icon = <LockIcon />;
      variant = "outlined";
      color = "warning";
      break;
    default:
      icon = null;
  }

  // 아이콘만 표시하는 버튼 (상세 영역용) - 각 버튼의 기존 색상 및 테두리 유지
  if (iconOnly) {
    // 각 색상에 따른 배경색, 테두리 색상, 호버 색상 설정
    const getColorStyles = (colorName, isOutlined) => {
      const getBorderColor = (theme) => {
        switch (colorName) {
          case 'primary':
            return theme.palette.primary.main;
          case 'secondary':
            return theme.palette.secondary.main;
          case 'success':
            return theme.palette.success.main;
          case 'warning':
            return theme.palette.warning.main;
          case 'info':
            return theme.palette.info.main;
          default:
            return theme.palette.divider;
        }
      };

      if (isOutlined) {
        // outlined 스타일: 배경 투명, 테두리와 텍스트는 색상에 맞게
        return {
          backgroundColor: 'transparent',
          color: getBorderColor,
          border: '1px solid',
          borderColor: getBorderColor,
          '&:hover': {
            backgroundColor: (theme) => theme.palette.action.hover,
            borderColor: getBorderColor,
          },
        };
      } else {
        // contained 스타일: 배경색과 테두리 색상 동일
        return {
          backgroundColor: (theme) => {
            switch (colorName) {
              case 'primary':
                return theme.palette.primary.main;
              case 'secondary':
                return theme.palette.secondary.main;
              case 'success':
                return theme.palette.success.main;
              case 'warning':
                return theme.palette.warning.main;
              case 'info':
                return theme.palette.info.main;
              default:
                return 'transparent';
            }
          },
          color: '#fff',
          border: '1px solid',
          borderColor: getBorderColor,
          '&:hover': {
            backgroundColor: (theme) => {
              switch (colorName) {
                case 'primary':
                  return theme.palette.primary.dark;
                case 'secondary':
                  return theme.palette.secondary.dark;
                case 'success':
                  return theme.palette.success.dark;
                case 'warning':
                  return theme.palette.warning.dark;
                case 'info':
                  return theme.palette.info.dark;
                default:
                  return 'transparent';
              }
            },
            borderColor: getBorderColor,
          },
        };
      }
    };

    const isOutlined = variant === 'outlined';
    const colorStyles = getColorStyles(color, isOutlined);

    const handleIconClick = (e) => {
      // auth 값이 있으면 액션 타입으로 설정
      if (auth) {
        setActionType(auth);
      }
      
      // 기존 onClick 실행
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Tooltip title={label || 'Button'}>
        <IconButton
          size="small"
          onClick={handleIconClick}
          sx={{
            ...colorStyles,
            width: '28px',
            height: '28px',
            padding: 0,
            borderRadius: 1,
            ...sx,
          }}
        >
          {icon && React.cloneElement(icon, { fontSize: 'small' })}
        </IconButton>
      </Tooltip>
    );
  }

  const handleClick = (e) => {
    // auth 값이 있으면 액션 타입으로 설정
    if (auth) {
      setActionType(auth);
    }
    
    // 기존 onClick 실행
    if (onClick) {
      onClick(e);
    }
    
    // 비동기 함수인 경우 액션 타입이 유지되도록 함
    // (Protocol.jsx에서 요청 완료 후 자동 초기화)
  };

  return (
    <Button
      variant={variant}
      color={color}
      startIcon={icon}
      onClick={handleClick}
      sx={{
        minWidth: '80px',   // 최소 너비
        height: '28px',      // 버튼 높이
        fontSize: '14px',    // 글자 크기
        padding: '0 12px',   // 좌우 패딩
        textTransform: 'none', // 대문자 변환 방지
        borderRadius: 2,       // 둥근 모서리
        boxShadow: variant === 'contained' ? 1 : 'none',
        ...sx,
      }}
    >
      {label}
    </Button>
  );
}