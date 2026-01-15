import React, { useEffect, useState, memo } from 'react';


// ------------------------------
// Vite 전용 Dynamic Import 시스템
// ------------------------------
const modules = import.meta.glob(
  '/src/screens/**/*.jsx',
  { eager: false }
);

function resolveScreenPath(clssNm) {
  if (!clssNm) return null;

  let clean = clssNm.trim().replace(/\.(jsx|js|tsx|ts)$/i, '');
  clean = clean.replace(/\.+/g, '/');

  // Vite의 glob 키: "/src/screens/경로/파일.jsx"
  return `/src/screens/${clean}.jsx`;
}

// ------------------------------
// PageHost (수정된 버전)
// ------------------------------
function PageHost({ clssNm, title }) {
  const [Comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setComp(null);

      const key = resolveScreenPath(clssNm);

      if (!key) {
        if (mounted) {
          setError(new Error("clss_nm 값이 비어있습니다."));
          setLoading(false);
        }
        return;
      }

      const loader = modules[key];

      if (!loader) {
        if (mounted) {
          setError(new Error(`화면 모듈을 찾을 수 없습니다: ${key}`));
          setLoading(false);
        }
        return;
      }

      try {
        const mod = await loader();
        if (mounted) {
          setComp(() => mod.default || mod);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(new Error(`JSX 모듈 로딩 실패: ${key}\n${e}`));
          setLoading(false);
        }
      }
    }

    load();
    return () => (mounted = false);
  }, [clssNm]);

  return (
    <div>
      {loading && <div>로딩 중…</div>}
      {!loading && error && (
        <div style={{ padding: '12px', color: 'red' }}>
          <strong>JSX 모듈 로딩 실패</strong>
          <br />
          {String(error)}
        </div>
      )}
      {!loading && !error && Comp && (
        <Comp />
      )}
    </div>
  );
}


export default memo(PageHost);
