// src/theme/muiThemeFromTokens.js
import { createTheme } from '@mui/material/styles';
import tokens from './tokens.json';

// ----- 유틸 -----
const get = (obj, path) =>
  path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);

const tv = (obj) => {
  if (obj == null) return undefined;
  if (typeof obj === 'object') {
    if ('$value' in obj) return obj.$value;
    if ('value' in obj) return obj.value;
  }
  return obj;
};

const resolveRef = (all, raw) => {
  const v = tv(raw);
  if (typeof v !== 'string') return v;
  const m = v.match(/^\{(.+)\}$/);
  if (!m) return v; // 이미 hex 또는 일반 문자열
  const ref = get(all, m[1]);
  return tv(ref) ?? v;
};

const must = (name, v) => {
  if (v == null || v === '') {
    throw new Error(`[muiThemeFromTokens] Missing required token: ${name}`);
  }
  return v;
};

// ----- 공개 함수 -----
export function createMuiThemeFromTokens(mode = 'light') {
  const semantic = get(tokens, `${mode}.semantic`) || {};

  const primaryMain   = must(`${mode}.semantic.primaryMain`,   resolveRef(tokens, semantic.primaryMain));
  const onPrimary     = resolveRef(tokens, semantic.onPrimary);
  const bgCanvas      = must(`${mode}.semantic.bgCanvas`,      resolveRef(tokens, semantic.bgCanvas));
  const bgSurface     = must(`${mode}.semantic.bgSurface`,     resolveRef(tokens, semantic.bgSurface));
  const textPrimary   = must(`${mode}.semantic.textPrimary`,   resolveRef(tokens, semantic.textPrimary));
  const textSecondary = must(`${mode}.semantic.textSecondary`, resolveRef(tokens, semantic.textSecondary));
  const divider       = resolveRef(tokens, semantic.divider);
  // 다크모드일 때 그리드 헤더 색상을 메인 헤더(primary.main)와 동일하게 설정
  const gridHeaderBg = mode === 'dark' 
    ? primaryMain 
    : resolveRef(tokens, semantic.gridHeaderBg);
  const gridHeaderText = resolveRef(tokens, semantic.gridHeaderText);

// ---------- 📌 폰트 토큰 읽기 ----------
  const fontFamily = tv(
    get(tokens, 'global.typography.fontFamily') ||
    get(tokens, 'global.font.family.default')
  ) || "Pretendard, sans-serif";

  const fontSize = Number(tv(
    get(tokens, 'global.typography.fontSize') ||
    get(tokens, 'global.font.size.body')
  )) || 13;


  const radiusMd = tv(get(tokens, 'global.radius.md')) ?? 4;

  // ---------- 1차 theme: palette + typography ----------
  const baseTheme = createTheme({
    palette: {
      mode,
      primary: { main: primaryMain },
      background: { default: bgCanvas, paper: bgSurface },
      text: { primary: textPrimary, secondary: textSecondary },

      dataGrid: {
        headerBg: gridHeaderBg,
        headerText: gridHeaderText,
      },
      ...(divider ? { divider } : {}),
    },

    typography: {
      fontFamily,
      fontSize,
      body2: { fontFamily, fontSize }
    }
  });

  // ---------- 2차 theme: DataGrid 전역 스타일링 ----------
  const theme = createTheme(baseTheme, {
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            color: baseTheme.palette.text.primary,
          },
          columnHeaders: {
            background: gridHeaderBg,
            color: gridHeaderText,
            fontSize: fontSize,
            fontFamily: fontFamily,
            fontWeight: 600
          },
          cell: {
            fontSize: fontSize,
            fontFamily: fontFamily,
          }
        }
      }
    }
  });

  return theme;
}
