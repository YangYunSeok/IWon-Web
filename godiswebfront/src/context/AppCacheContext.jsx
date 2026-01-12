import React, { createContext, useContext, useRef, useState, useMemo } from 'react';

/**
 * 전역 캐시 스토어
 * - 어떤 리스트든 그대로 저장(컬럼 보존)
 * - key 별로 raw 배열 보관
 * - 선택적으로 특정 컬럼으로 인덱스(Map)도 생성/사용 가능
 *
 * 예)
 *  setCache('messages', msgList); // [{MSG_CD, MSG_NM, ...}, ...]
 *  buildIndex('messages', 'MSG_CD'); // 코드→row 맵
 *  getRow('messages', 'MSG_CD', 'MGE00890');
 *  getList('messages'); // raw array 그대로
 */
const AppCacheContext = createContext(null);

export function AppCacheProvider({ children, persist = false }) {
  // 내부 저장: key -> rows(Array of objects)
  const rawRef = useRef(new Map());
  // 인덱스 저장: key$field -> Map(value -> row)
  const indexRef = useRef(new Map());
  // 변경 알림용 tick (값만 바꿔 리렌더)
  const [tick, setTick] = useState(0);

  // 선택: localStorage 복원
  React.useEffect(() => {
    if (!persist) return;
    try {
      const json = localStorage.getItem('__APP_CACHE__');
      if (json) {
        const parsed = JSON.parse(json);
        Object.entries(parsed.raw || {}).forEach(([k, arr]) => {
          rawRef.current.set(k, Array.isArray(arr) ? arr : []);
        });
        setTick(t => t + 1);
      }
    } catch {}
  }, [persist]);

  const saveIfNeeded = () => {
    if (!persist) return;
    try {
      const rawObj = {};
      rawRef.current.forEach((v, k) => (rawObj[k] = v));
      localStorage.setItem('__APP_CACHE__', JSON.stringify({ raw: rawObj }));
    } catch {}
  };

  const setCache = (key, rows) => {
    rawRef.current.set(key, Array.isArray(rows) ? rows : []);
    // 해당 key 관련 인덱스는 무효화(다시 buildIndex 해야 함)
    for (const mapKey of Array.from(indexRef.current.keys())) {
      if (mapKey.startsWith(`${key}::`)) indexRef.current.delete(mapKey);
    }
    saveIfNeeded();
    setTick(t => t + 1);
  };

  const appendCache = (key, rows) => {
    const cur = rawRef.current.get(key) || [];
    rawRef.current.set(key, cur.concat(Array.isArray(rows) ? rows : []));
    saveIfNeeded();
    setTick(t => t + 1);
  };

  const getList = (key) => rawRef.current.get(key) || [];

  // 인덱스 생성: key + field
  const buildIndex = (key, field) => {
    const mapKey = `${key}::${field}`;
    if (indexRef.current.has(mapKey)) return indexRef.current.get(mapKey);
    const idx = new Map();
    (rawRef.current.get(key) || []).forEach(row => {
      const v = row?.[field];
      if (v !== undefined) idx.set(String(v), row);
    });
    indexRef.current.set(mapKey, idx);
    return idx;
  };

  // 인덱스 조회
  const getIndex = (key, field) => {
    const mapKey = `${key}::${field}`;
    return indexRef.current.get(mapKey) || null;
  };

  // 단건 row 가져오기(인덱스 있으면 사용, 없으면 선형검색)
  const getRow = (key, field, value) => {
    const mapKey = `${key}::${field}`;
    const vStr = String(value);
    if (indexRef.current.has(mapKey)) {
      return indexRef.current.get(mapKey).get(vStr) || null;
    }
    const list = rawRef.current.get(key) || [];
    return list.find(r => String(r?.[field]) === vStr) || null;
  };

  // 메시지 헬퍼: messages 리스트에 {MSG_CD, MSG_NM} 있다고 가정
  const getMessage = (code) => {
    if (code == null) return '';
    // 인덱스 우선
    const row = getRow('messages', 'MSG_CD', code);
    return row?.MSG_NM ?? '';
  };

  const value = useMemo(() => ({
    // set / append
    setCache, appendCache,
    // get raw list
    getList,
    // index helpers
    buildIndex, getIndex, getRow,
    // message shortcut
    getMessage,
    // 디버그/관리
    _tick: tick
  }), [tick]);

  return (
    <AppCacheContext.Provider value={value}>
      {children}
    </AppCacheContext.Provider>
  );
}

export const useAppCache = () => {
  const ctx = useContext(AppCacheContext);
  if (!ctx) throw new Error('useAppCache must be used within <AppCacheProvider>');
  return ctx;
};
