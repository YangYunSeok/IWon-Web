import { createHttp } from '@/libs/Protocol';

export const http = createHttp({
  baseURL: '/api',
  timeout: 15000,
  defaultHeaders: {},
});

/** 전역 로딩 이벤트 키 */
const LOADING_EVENT = 'http:loading';
let activeRequests = 0;

const safeEmitLoading = () => {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: { active: activeRequests } }));
    }
  } catch (e) {
    // 콘솔만 찍고 앱이 죽지 않도록
    // console.error('[loading emit error]', e);
  }
};

const startLoading = (show) => { if (show) { activeRequests += 1; safeEmitLoading(); } };
const stopLoading  = (show) => { if (show) { activeRequests = Math.max(0, activeRequests - 1); safeEmitLoading(); } };

/** 호출 옵션에서 showSpinner 읽기 (기본값 false) */
const shouldShow = (cfg) => (cfg?.showSpinner === true);

/** ---- 1) axios 인터셉터 경로 ---- */
if (http?.interceptors?.request && http?.interceptors?.response) {
  http.interceptors.request.use(
    (config) => { startLoading(shouldShow(config)); return config; },
    (error)  => { stopLoading(shouldShow(error?.config)); return Promise.reject(error); }
  );
  http.interceptors.response.use(
    (res)    => { stopLoading(shouldShow(res?.config)); return res; },
    (error)  => { stopLoading(shouldShow(error?.config)); return Promise.reject(error); }
  );
}
/** ---- 2) 인터셉터가 없으면 메서드 래핑 ---- */
else {
  ['get','post','put','patch','delete'].forEach((m) => {
    if (typeof http[m] === 'function') {
      const orig = http[m].bind(http);
      http[m] = async (...args) => {
        // axios와 다를 수 있으니 세 번째 인자(옵션)에서 showSpinner 추출 시도
        const cfg = args[2] ?? args[1]; // post(url, data, cfg) | get(url, cfg)
        const show = shouldShow(cfg);
        startLoading(show);
        try {
          const res = await orig(...args);
          // fetch 스타일의 경우 config가 없을 수 있으므로 stop은 show 기준으로만
          return res;
        } catch (e) {
          throw e;
        } finally {
          stopLoading(show);
        }
      };
    }
  });
}

export default http;
