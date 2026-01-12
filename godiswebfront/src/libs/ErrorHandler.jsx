import { http } from './TaskHttp';

let isInitialized = false;

const sendErrorToServer = async (errorInfo) => {
  try {
    const currentUrl = window.location.pathname + window.location.search;
    const menuId = getCurrentMenuId();
    
    await http.post('/error/log', {
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack || '',
      url: currentUrl,
      menuId: menuId,
      timestamp: new Date().toISOString(),
    }, {
      showSpinner: false,
    });
  } catch (e) {
    // 무시
  }
};

const getCurrentMenuId = () => {
  try {
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
    
    if (window.currentMenuId) {
      return window.currentMenuId;
    }
    
    const url = window.location.pathname;
    const match = url.match(/\/([A-Z0-9]+)$/);
    if (match) {
      return match[1];
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

export const initErrorHandler = () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  window.addEventListener('error', (event) => {
    const errorInfo = {
      message: event.message || 'Unknown error',
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    };
    
    sendErrorToServer(errorInfo);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    
    if (reason && typeof reason === 'object') {
      if (reason.status !== undefined || reason.response !== undefined) {
        return;
      }
      
      if (reason instanceof Error && reason.message && reason.message.includes('HTTP')) {
        return;
      }
    }
    
    const errorInfo = {
      message: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack || '',
    };
    
    sendErrorToServer(errorInfo);
  });

  window.reportFrontendError = (error, errorInfo) => {
    const errorData = {
      message: error?.message || String(error) || 'React error',
      stack: error?.stack || errorInfo?.componentStack || '',
    };
    
    sendErrorToServer(errorData);
  };
};

