// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useMemo } from 'react';

const STORAGE_KEY = 'MetaDomix_Global_v1';

const DataContext = createContext({
  globalData: { messages: {}, messagesRaw: [] },
  messages: {},
  messagesRaw: [],
  setGlobalData: () => {},
  getMessage: (code, fallback) => fallback ?? code ?? '',
});

export function DataProvider({ children }) {
  // 초기값: localStorage에 저장된 globalData 복원
  const [globalData, setGlobalDataState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          messages: parsed.messages || {},
          messagesRaw: parsed.messagesRaw || [],
        };
      }
    } catch (e) {
      console.warn('[DataContext] load error', e);
    }
    return { messages: {}, messagesRaw: [] };
  });

  // App.jsx에서 쓰는 setGlobalData
  const setGlobalData = (updater) => {
    setGlobalDataState((prev) => {
      const base = prev || {};
      const next =
        typeof updater === 'function'
          ? updater(base)
          : { ...base, ...(updater || {}) };

      // localStorage에 같이 저장
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            messages: next.messages || {},
            messagesRaw: next.messagesRaw || [],
          }),
        );
      } catch (e) {
        console.warn('[DataContext] save error', e);
      }

      return next;
    });
  };

  // GMessageBox / 화면 공용 메시지 조회
  const getMessage = (code, fallback) => {
    if (!code) return fallback ?? '';
    const key = String(code).trim();
    const msg = globalData.messages?.[key];
    return msg ?? fallback ?? key;
  };

  const value = useMemo(
    () => ({
      globalData,
      messages: globalData.messages || {},
      messagesRaw: globalData.messagesRaw || [],
      setGlobalData,
      getMessage,
    }),
    [globalData],
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
