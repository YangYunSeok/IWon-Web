// src/components/GMessageBox.jsx
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
} from '@mui/material';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { useData } from '@/context/DataContext.jsx';

// ---------- 유틸 ----------

function fmt(text, args = []) {
  if (!text) return '';
  let out = String(text);
  (args || []).forEach((v, i) => {
    out = out.replace(new RegExp(`\\{${i}\\}`, 'g'), v ?? '');
  });
  return out;
}

const PRESETS = {
  Ok: ['ok'],
  OkCancel: ['ok', 'cancel'],
  YesNo: ['yes', 'no'],
  YesNoCancel: ['yes', 'no', 'cancel'],
};

function labelOf(key, labels) {
  const defaults = {
    ok: 'OK',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
  };
  return (labels && labels[key]) || defaults[key] || key;
}

function IconByType({ type = 'info' }) {
  const sx = { fontSize: 28 };

  switch (type) {
    case 'warning':
      return <WarningAmberOutlinedIcon color="warning" sx={sx} />;
    case 'error':
      return <ErrorOutlineOutlinedIcon color="error" sx={sx} />;
    case 'success':
      return <CheckCircleOutlineOutlinedIcon color="success" sx={sx} />;
    case 'question':
      return <HelpOutlineIcon color="info" sx={sx} />;
    case 'info':
    default:
      return <InfoOutlinedIcon color="info" sx={sx} />;
  }
}

// MSG_TP_CD → GMessageBox type 매핑
function mapMsgTypeCd(msgTpCd) {
  const v = String(msgTpCd || '').trim();
  switch (v) {
    case '02':
      return 'info';
    case '03':
      return 'error';
    case '04':
      return 'warning';
    case '05':
      return 'question';
    default:
      return null; // 모르면 건드리지 않음
  }
}

function safeUseData() {
  try {
    return useData();
  } catch (e) {
    return null;
  }
}

// ---------- Dialog 컴포넌트 ----------

function MessageBoxControl(props) {
  const {
    open,
    onClose,
    title,
    message,
    code,
    args,
    buttons = 'Ok',
    buttonLabels,
    type = 'info',        // 호출 시 직접 지정 가능
    maxWidth = 'xs',
    keepMounted = true,
  } = props;

  const dataCtx = safeUseData();

  const getMessage = dataCtx?.getMessage;
  const messagesMap =
    dataCtx?.messages ||
    (dataCtx?.globalData && dataCtx.globalData.messages) ||
    {};

  // 🔹 effectiveType: props.type 를 기본으로 하고,
  // 코드 + MSG_TP_CD 가 있으면 그걸 반영
  const [effectiveType, setEffectiveType] = React.useState(type || 'info');
  const [text, setText] = React.useState('');

  // 메시지 텍스트 해석
  React.useEffect(() => {
    let resolved = '';

    if (message) {
      resolved = fmt(message, args);
    } else if (code) {
      const key = String(code).trim();

      if (typeof getMessage === 'function') {
        resolved = fmt(getMessage(key, messagesMap[key] ?? key), args);
      } else {
        resolved = fmt(messagesMap[key] ?? key, args);
      }
    }

    setText(resolved);
  }, [open, message, code, JSON.stringify(args), getMessage, messagesMap]);

  // MSG_TP_CD 기반 타입 결정
  React.useEffect(() => {
    let nextType = type || 'info';

    // 명시적인 type이 없고(code 기반 호출) DataContext에 raw가 있을 때만 MSG_TP_CD 적용
    if (!message && code && dataCtx) {
      const raw =
        dataCtx.messagesRaw ||
        (dataCtx.globalData && dataCtx.globalData.messagesRaw) ||
        [];

      if (Array.isArray(raw) && raw.length > 0) {
        const key = String(code).trim();
        const row = raw.find((r) =>
          String(
            r.MSG_CD ??
            r.MSG_ID ??
            r.msgCd ??
            r.code ??
            ''
          ).trim() === key
        );

        if (row && row.MSG_TP_CD != null) {
          const mapped = mapMsgTypeCd(row.MSG_TP_CD);
          if (mapped) {
            nextType = mapped;
          }
        }
      }
    }

    setEffectiveType(nextType);
  }, [type, message, code, dataCtx]);

  const btnKeys = Array.isArray(buttons)
    ? buttons
    : PRESETS[buttons] || PRESETS.Ok;

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'Enter') {
      onClose?.(btnKeys.includes('ok') ? 'ok' : btnKeys[0]);
    } else if (e.key === 'Escape') {
      const esc = btnKeys.includes('cancel')
        ? 'cancel'
        : btnKeys.includes('no')
        ? 'no'
        : null;
      if (esc) onClose?.(esc);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose?.('cancel')}
      onKeyDown={handleKeyDown}
      maxWidth={maxWidth}
      fullWidth
      keepMounted={keepMounted}
    >
      <DialogTitle sx={{ py: 1.25 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <IconByType type={effectiveType} />
          <Typography variant="subtitle1" fontWeight={700}>
            {title || (code ? String(code).trim() : effectiveType.toUpperCase())}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1.5, pb: 2 }}>
        <Box
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 14.5,
          }}
        >
          {text}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        {btnKeys.map((k) => (
          <Button
            key={k}
            variant={k === 'ok' || k === 'yes' ? 'contained' : 'outlined'}
            color={
              k === 'ok' || k === 'yes'
                ? effectiveType === 'error'
                  ? 'error'
                  : 'primary'
                : 'inherit'
            }
            onClick={() => onClose?.(k)}
            autoFocus={k === btnKeys[0]}
            sx={{ minWidth: 76 }}
          >
            {labelOf(k, buttonLabels)}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}

// ---------- 이벤트 버스 + Host ----------

const _listeners = new Set();

function _emit(v) {
  _listeners.forEach((fn) => {
    try {
      fn(v);
    } catch (e) {
      console.error(e);
    }
  });
}

function _sub(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// App 최상단에서 <GMessageBox.Host /> 한 번만 렌더
function Host() {
  const [state, setState] = React.useState(null);

  React.useEffect(() => {
    return _sub((payload) => {
      setState(payload);
    });
  }, []);

  if (!state || !state.open) return null;

  const { opts, onClose } = state;

  const handleClose = (result) => {
    onClose?.(result);
    setState(null);
  };

  return (
    <MessageBoxControl
      {...opts}
      open={state.open}
      onClose={handleClose}
    />
  );
}

// ---------- 정적 API ----------

function Show(code, buttons = 'Ok', ...params) {
  // params 전체를 args 배열로 넘겨서 {0}, {1}, ... 치환에 사용
  return ShowEx({
    code,
    buttons,
    args: params,
  });
}

function ShowEx(opts = {}) {
  return new Promise((resolve) => {
    const payload = {
      open: true,
      opts,
      onClose: (result) => {
        resolve(result);
      },
    };
    _emit(payload);
  });
}

const GMessageBox = {
  Host,
  Show,
  ShowEx,
};

export default GMessageBox;
