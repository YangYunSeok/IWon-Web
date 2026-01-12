/**
 * 현재 활성 메뉴 ID 가져오기 (ErrorHandler와 동일한 로직)
 */
const getCurrentMenuId = () => {
  try {
    // 1. sessionStorage에서 활성 탭 정보 가져오기
    const savedState = sessionStorage.getItem('app_tabs_state');
    if (savedState) {
      const data = JSON.parse(savedState);
      const { savedTabs, savedActiveKey } = data;
      
      if (savedTabs && Array.isArray(savedTabs) && savedActiveKey) {
        const activeTab = savedTabs.find(tab => tab.key === savedActiveKey);
        if (activeTab && activeTab.nodeKey) {
          return activeTab.nodeKey;
        }
      }
    }
    
    // 2. window 객체에서 현재 메뉴 정보 가져오기
    if (window.currentMenuId) {
      return window.currentMenuId;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * 현재 액션 타입 설정 (GButton에서 사용)
 */
let currentActionType = null;

export function setActionType(actionType) {
  currentActionType = actionType;
}

/**
 * 버튼 클릭 시에만 로그 저장 (GButton에서 명시적으로 설정한 경우만)
 */
function inferActionType(method, url, options) {
  // 이미 헤더에 있으면 사용
  if (options?.headers?.['X-Action-Type']) {
    return options.headers['X-Action-Type'];
  }
  
  // 전역 변수에 있으면 사용 (GButton에서 설정한 경우)
  if (currentActionType) {
    return currentActionType;
  }
  
  return null;
}

export function createHttp({ baseURL = '', timeout = 10000, defaultHeaders = {} } = {}) {
  const firstKey = (obj) => (obj && typeof obj === 'object') ? Object.keys(obj)[0] : undefined;

  const normalizeByShape = (shape, payload) => {
    if (!shape) return payload;

    switch (shape) {
      case 'dataset': {
        // 기대형: { tableName1: [...], tableName2: [...] }
        // 표준화: { tables: { tableName1: [...], tableName2: [...] } }
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          // 그대로 감싸서 반환
          return { tables: payload };
        }
        // 서버가 단일 배열만 줬다면 table1 이름으로 감쌈
        if (Array.isArray(payload)) {
          return { tables: { table1: payload } };
        }
        return { tables: {} };
      }
      case 'datatable': {
        // 기대형(1): { tableName: [...] }
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const k = firstKey(payload);
          if (k && Array.isArray(payload[k])) {
            return { name: k, table: payload[k] };
          }
          // 객체인데 rows 배열 key가 없는 경우: 객체 1행으로 가정
          return { name: undefined, table: [payload] };
        }
        // 기대형(2): [ ... ]
        if (Array.isArray(payload)) {
          return { name: undefined, table: payload };
        }
        return { name: undefined, table: [] };
      }
      case 'datarow': {
        // 기대형(1): { ... }
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          return { row: payload };
        }
        // 기대형(2): [ { ... }, ... ]
        if (Array.isArray(payload)) {
          return { row: payload[0] ?? null };
        }
        return { row: null };
      }
      default:
        return payload;
    }
  };

  const core = async (method, url, {
    params,
    body,
    headers,
    signal,
    noJson,
    accept = 'application/json',
    shape,                   // 'dataset' | 'table' | 'row'
    shapeIn = 'header',      // 'header' | 'query'  (서버 구현에 맞게)
  } = {}) => {
    // shape 전달 (헤더 or 쿼리)
    const paramsWithShape =
      shape && shapeIn === 'query'
        ? { ...(params || {}), resultShape: shape }
        : (params || undefined);

    const qs = paramsWithShape ? `?${new URLSearchParams(paramsWithShape).toString()}` : '';

    // Timeout + Abort
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeout);

    try {
      // 현재 메뉴 ID 가져오기
      const currentMenuId = getCurrentMenuId();
      
      // 액션 타입 추론
      const actionType = inferActionType(method, url, { headers });
      
      // 실행 시간 측정 시작
      const startTime = performance.now();
      
      const res = await fetch(baseURL + url + qs, {
        method,
        headers: {
          Accept: accept,
          ...(body && !noJson ? { 'Content-Type': 'application/json' } : {}),
          ...(shape && shapeIn === 'header' ? { 'X-Result-Shape': shape } : {}),
          ...(currentMenuId ? { 'X-Menu-Id': currentMenuId } : {}), // 현재 메뉴 ID 헤더 추가
          ...(actionType ? { 'X-Action-Type': actionType } : {}), // 액션 타입 헤더 추가
          ...defaultHeaders,
          ...headers,
        },
        body: body ? (noJson ? body : JSON.stringify(body)) : undefined,
        signal: signal || controller.signal,
        credentials: 'include',
      });
      
      // 실행 시간 측정 완료
      const endTime = performance.now();
      const clientExecutionTime = Math.round(endTime - startTime);
      
      // 서버 실행 시간 (응답 헤더에서 가져오기)
      const serverExecutionTime = res.headers.get('X-Server-Execution-Time');
      
      // 액션 타입이 있으면 클라이언트 측 시간을 헤더로 전달 (선택사항)
      // 백엔드에서 이미 저장하므로 생략 가능

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        let errorData = null;
        
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            errorData = await res.json();
            msg = errorData?.message || msg;
          } else {
            try { msg = await res.text(); } catch {}
          }
        } catch {
          try { msg = await res.text(); } catch {}
        }
        
        // 서버에서 success: false로 응답한 경우 자동으로 팝업 표시
        // await를 제거하여 팝업이 닫힐 때까지 기다리지 않고 즉시 다음 단계로 진행
        if (errorData && errorData.success === false) {
          // 비동기로 팝업 표시 (await 제거)
          (async () => {
            const GMessageBox = (await import('@/components/GMessageBox')).default;
            
            const errorType = errorData.errorType || 'SYSTEM';
            let messageType = 'error';
            
            switch (errorType) {
              case 'BIZ':
                messageType = 'warning';
                break;
              case 'DB':
                messageType = 'error';
                break;
              case 'VALIDATION':
                messageType = 'info';
                break;
              case 'SYSTEM':
              default:
                messageType = 'error';
                break;
            }
            
            if (errorData.code) {
              let args = [];
              if (errorData.args) {
                try {
                  args = typeof errorData.args === 'string' 
                    ? JSON.parse(errorData.args) 
                    : errorData.args;
                } catch (e) {
                  args = [];
                }
              }
              
              // GMessageBox.Show(code, buttons, ...args) 형식으로 호출
              await GMessageBox.Show(errorData.code, 'Ok', ...(Array.isArray(args) ? args : []));
            } else if (errorData.message) {
              // message만 있는 경우
              await GMessageBox.ShowEx({
                message: errorData.message,
                type: messageType,
                buttons: 'Ok',
              });
            } else {
              await GMessageBox.ShowEx({
                message: msg,
                type: 'error',
                buttons: 'Ok',
              });
            }
          })();
        }
        
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }

      const ct = res.headers.get('content-type') || '';
      const raw = ct.includes('application/json') ? await res.json() : await res.text();
      const normalized = normalizeByShape(shape, raw);
      
      // 서버에서 success: false로 응답한 경우 자동으로 팝업 표시
      // await를 제거하여 팝업이 닫힐 때까지 기다리지 않고 즉시 다음 단계로 진행
      if (normalized && typeof normalized === 'object' && normalized.success === false) {
        // 비동기로 팝업 표시 (await 제거)
        (async () => {
          const GMessageBox = (await import('@/components/GMessageBox')).default;
          
          // errorType에 따라 다른 타입의 팝업 표시
          const errorType = normalized.errorType || 'SYSTEM';
          let messageType = 'error'; // 기본값
          
          switch (errorType) {
            case 'BIZ':
              messageType = 'warning';
              break;
            case 'DB':
              messageType = 'error';
              break;
            case 'VALIDATION':
              messageType = 'info';
              break;
            case 'SYSTEM':
            default:
              messageType = 'error';
              break;
          }
          
          // code가 있으면 code 기반, 없으면 message 기반으로 팝업 표시
          if (normalized.code) {
            // args가 JSON 문자열이면 파싱
            let args = [];
            if (normalized.args) {
              try {
                args = typeof normalized.args === 'string' 
                  ? JSON.parse(normalized.args) 
                  : normalized.args;
              } catch (e) {
                args = [];
              }
            }
            
            // GMessageBox.Show(code, buttons, ...args) 형식으로 호출
            await GMessageBox.Show(normalized.code, 'Ok', ...(Array.isArray(args) ? args : []));
          } else if (normalized.message) {
            // message만 있는 경우
            await GMessageBox.ShowEx({
              message: normalized.message,
              type: messageType,
              buttons: 'Ok',
            });
          } else {
            await GMessageBox.ShowEx({
              message: '오류가 발생했습니다.',
              type: 'error',
              buttons: 'Ok',
            });
          }
        })();
      }
      
      // 요청 완료 후 액션 타입 초기화
      currentActionType = null;
      
      return normalized;
    } catch (error) {
      // 에러 발생 시에도 액션 타입 초기화
      currentActionType = null;
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    get: (url, opts) => core('GET', url, opts),
    post: (url, body, opts = {}) => core('POST', url, { ...opts, body }),
    put: (url, body, opts = {}) => core('PUT', url, { ...opts, body }),
    del: (url, opts) => core('DELETE', url, opts),
    request: core,
  };
}