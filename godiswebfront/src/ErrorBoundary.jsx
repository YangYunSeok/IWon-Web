// src/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { 
    console.error('[ErrorBoundary]', error, info);
    
    // 전역 오류 핸들러에 보고
    if (window.reportFrontendError) {
      window.reportFrontendError(error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace' }}>
          <h2>💥 UI 에러 발생</h2>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <p style={{opacity:.7}}>콘솔을 열어 stacktrace를 확인하세요.</p>
          {this.props.fallback || null}
        </div>
      );
    }
    return this.props.children;
  }
}
