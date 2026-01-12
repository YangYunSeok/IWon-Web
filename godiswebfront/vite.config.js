import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    host: '127.0.0.1',     // IPv6(::1) 이슈 회피
    port: 3000,            // ← 프론트(React) 포트
    strictPort: true,      // 3000 사용 중이면 바로 에러(자동 변경 방지)
    proxy: {
      // 프론트에서 '/api'로 호출하면 8080으로 프록시
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // 백엔드가 /api 없이 동작한다면 주석 해제해 /api 프리픽스 제거
        // rewrite: p => p.replace(/^\/api/, ''),
      },
      // 추가 경로가 있다면 여기에 계속 선언
      // '/swagger-ui': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      // '/ws': { target: 'ws://127.0.0.1:8080', ws: true, changeOrigin: true },
    },
    // 필요시 개발 중 에러 오버레이 끄기
    // hmr: { overlay: false },
    hmr: {
      reconnect: false, // 자동 재접속 끄기
      clientPort: 3000, // 클라이언트 포트 지정
      overlay: false,   // 에러 오버레이 꺼서 덜 불안정하게
      protocol: 'ws',   // wss로 바꿔도 됨
    }
  },
})