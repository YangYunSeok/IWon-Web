import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GButton from '@/components/GButton';

/**
 * 공통 모달 컴포넌트
 * @param {boolean} open - 모달 열림 상태
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {string} title - 모달 제목
 * @param {React.ReactNode} children - 모달 내용
 * @param {Array} buttons - 버튼 목록 [{ label, onClick, auth, variant, color }]
 * @param {string} maxWidth - 모달 최대 너비 ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {boolean} fullWidth - 전체 너비 사용 여부
 * @param {boolean} showCloseButton - X 닫기 버튼 표시 여부
 */
export default function GModal({
  open = false,
  onClose,
  title,
  children,
  buttons = [],
  maxWidth = 'md',
  fullWidth = true,
  showCloseButton = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }
      }}
    >
      {/* 제목 영역 */}
      {title && (
        <DialogTitle
          sx={{
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '500', color: '#333' }}>
            {title}
          </span>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: '#666',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* 내용 영역 */}
      <DialogContent
        sx={{
          padding: '24px',
        }}
      >
        {children}
      </DialogContent>

      {/* 버튼 영역 */}
      {buttons && buttons.length > 0 && (
        <DialogActions
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            backgroundColor: '#fafafa',
            gap: '8px',
          }}
        >
          {buttons.map((button, index) => (
            <GButton
              key={index}
              label={button.label}
              onClick={button.onClick}
              auth={button.auth || 'Default'}
              variant={button.variant}
              color={button.color}
            />
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
}