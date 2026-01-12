// src/components/GMessageToast.jsx
import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useData } from '@/context/DataContext.jsx';

// ------------ 유틸 공통 ------------

function fmt(text, args = []) {
  if (!text) return '';
  let out = String(text);
  (args || []).forEach((v, i) => {
    out = out.replace(new RegExp(`\\{${i}\\}`, 'g'), v ?? '');
  });
  return out;
}

// MSG_TP_CD → type/severity 매핑
// (없으면 info)
function mapMsgTypeCd(msgTpCd) {
  const v = String(msgTpCd || '').trim();
  switch (v) {
    case '02': return 'info';      // Information
    case '03': return 'error';     // Error
    case '04': return 'warning';   // Warning
    case '05': return 'info';      // Question → info 톤으로
    default:  return null;
  }
}

// toast.type → MUI Alert severity 매핑
function toSeverity(type) {
  switch (type) {
    case 'success':
    case 'ok':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    case 'question':
    default:
      return 'info';
  }
}

function safeUseData() {
  try {
    return useData();
  } catch (e) {
    return null;
  }
}

// ------------ 메시지 해석 ------------

/**
 * opts: { code, message, args, type, msgTypeCd }
 * dataCtx: DataContext (messages / messagesRaw 포함)
 */
function resolveToastPayload(opts, dataCtx) {
  const { code, message, args = [], type, msgTypeCd } = opts || {};

  // 1) 텍스트
  let text = '';

  if (message) {
    text = fmt(message, args);
  } else if (code) {
    const key = String(code).trim();

    // 1-1) DataContext.getMessage
    const getMessage = dataCtx?.getMessage;
    const messagesMap =
      dataCtx?.messages ||
      (dataCtx?.globalData && dataCtx.globalData.messages) ||
      {};

    if (typeof getMessage === 'function') {
      text = fmt(getMessage(key, messagesMap[key] ?? key), args);
    } else if (messagesMap && typeof messagesMap === 'object') {
      text = fmt(messagesMap[key] ?? key, args);
    } else {
      text = key;
    }
  }

  // 2) 타입 (우선순위: 직접 지정 type → msgTypeCd → DataContext.messagesRaw의 MSG_TP_CD)
  let effectiveType = type || null;

  // msgTypeCd 직접 넘어온 경우
  if (!effectiveType && msgTypeCd) {
    const mapped = mapMsgTypeCd(msgTypeCd);
    if (mapped) effectiveType = mapped;
  }

  // code 기반이고 아직 타입 없으면, raw에서 MSG_TP_CD 조회
  if (!effectiveType && !message && opts?.code && dataCtx) {
    const key = String(opts.code).trim();
    const raw =
      dataCtx.messagesRaw ||
      (dataCtx.globalData && dataCtx.globalData.messagesRaw) ||
      [];

    if (Array.isArray(raw)) {
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
        if (mapped) effectiveType = mapped;
      }
    }
  }

  if (!effectiveType) effectiveType = 'info';

  return {
    code: opts?.code ? String(opts.code).trim() : '',
    text,
    type: effectiveType,
  };
}

// ------------ Host (렌더러) ------------

const _listeners = new Set();

function _emit(toast) {
  _listeners.forEach((fn) => {
    try {
      fn(toast);
    } catch (e) {
      console.error(e);
    }
  });
}

function _sub(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/**
 * App 최상단(예: <App /> 안)에서 한 번만:
 * <GMessageToast.Host />
 */
function Host() {
  const dataCtx = safeUseData();

  const [queue, setQueue] = React.useState([]);
  const [current, setCurrent] = React.useState(null);

  // 이벤트 구독: 어디서든 GMessageToast.ShowEx(...) 하면 여기로 들어옴
  React.useEffect(() => {
    return _sub((opts) => {
      if (!opts) return;
      setQueue((prev) => [...prev, opts]);
      // current 없으면 바로 하나 꺼내게 아래 useEffect에서 처리
    });
  }, []);

  // queue에서 current로 하나씩 꺼내기
  React.useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      const resolved = resolveToastPayload(next, dataCtx);
      setCurrent({
        ...next,
        ...resolved,
      });
      setQueue(rest);
    }
  }, [queue, current, dataCtx]);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setCurrent(null);
  };

  if (!current) return null;

  const severity = toSeverity(current.type);
  const duration =
    typeof current.duration === 'number'
      ? current.duration
      : 3000;

  const anchorOrigin =
    current.anchorOrigin || { vertical: 'top', horizontal: 'center' };

  return (
    <Snackbar
      open
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ alignItems: 'flex-start' }}
      >
        <Stack spacing={0.3}>
          {current.code && (
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, opacity: 0.9 }}
            >
              {current.code}
            </Typography>
          )}
          <Typography variant="body2">
            {current.text}
          </Typography>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

// ------------ 정적 API ------------

/**
 * 사용법1) 코드 + 치환 파라미터
 *  GMessageToast.Show('MGW00019', '공통코드그룹을');
 *  // MSG: "{0}을(를) 선택하세요." → "공통코드그룹을을(를) 선택하세요."
 *
 * 사용법2) 직접 옵션
 *  GMessageToast.ShowEx({ message: '저장되었습니다', type: 'success' });
 *  GMessageToast.ShowEx({ code: 'MGW00019', args: ['AAA', 'BBB'] });
 */
function Show(code, ...params) {
  // code만 받은 경우: 코드 기반 메시지, params는 {0}.. 치환 인자
  _emit({
    code,
    args: params,
  });
}

/**
 * opts:
 *  - code: 메시지 코드 (캐시에서 찾음)
 *  - message: 직접 문구 (code 대신)
 *  - args: [..] {0},{1} 치환 용
 *  - type: 'info' | 'success' | 'warning' | 'error' | 'question'
 *  - msgTypeCd: '02' | '03' | '04' | '05' (서버에서 온 값 있으면 넘겨도 됨)
 *  - duration: ms (기본 3000)
 *  - anchorOrigin: { vertical, horizontal } (MUI Snackbar 옵션)
 */
function ShowEx(opts = {}) {
  _emit(opts);
}

const GMessageToast = {
  Host,
  Show,
  ShowEx,
};

export default GMessageToast;
