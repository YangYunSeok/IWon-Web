// src/theme/ThemeModeContext.js
import { createContext, useContext, useState } from 'react';

export const ThemeModeContext = createContext(null);

/** Provider가 없으면 로컬 state로 자동 폴백 */
export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  const [localMode, setLocalMode] = useState('light');
  if (ctx && typeof ctx.setMode === 'function') return ctx;
  return { mode: localMode, setMode: setLocalMode };
}
