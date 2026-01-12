# Web Admin 콘솔 개요 / 로그인

> 본 문서는 `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 의 `0~2` 장(네비게이션/로그인)을
> MCP UI 가이드 포맷으로 이관한 것입니다. Admin 전용 API 참조는 `docs/design/api/web-admin.md` 를 따른다.

## 1. 내비게이션 구조

- **Godis-Web 기반 Stack**: `Login → (성공) AdminConsole`
  - Godis-web 플랫폼 메뉴 추가 기능이용. 별도 구현 필요 없음.
- **사이드바(LNB)**
  - Dashboard
  - WalletMgmt (임직원 지갑 관리)
  - CoinDist (코인 지급/회수)
  - TxHistory (트랜잭션 조회)
  - Approval (온체인 승인 관리)
  - MonthlyPlan (월별 지급 계획)
- Active 메뉴는 고정 Highlight, URL 기반 Routing 은 추후 정의.

## 2. 로그인 화면 (웹)
※ Godis-Web 플랫폼의 기능을 사용. 별도 구현 필요 없음. ※
- 구성: 시스템 타이틀 `I-Won Admin System`, 중앙 로고, ID/비밀번호 입력, `로그인` 버튼.
- 에러 처리: 공통 에러 코드(`UNAUTHORIZED`) → 필드 밑 오류 메시지.
- 2차 인증(OTP): 현재 보류. 추후 `POST /auth/verify-otp` 연동 시 모달/재전송 UX 재활성화.

## 3. 권한/세션 흐름
※ Godis-Web 플랫폼의 기능을 사용. 별도 구현 필요 없음. ※
1. `POST /auth/login` 성공 → accessToken + role(userRole) 수신.
2. 추후 OTP 필요 시 challengeId 기반 프로세스 추가.
3. 세션 만료 시 전역 알림 후 Login 리디렉션.

## 4. 공통 UI 행동 지침

- Sidebar 상태는 Router state 로 관리, 새로고침 후에도 현재 메뉴 표시.
- Alert / Badge 색상 규칙은
  - 정상: Green
  - 경고: Amber
  - 치명적: Red
- UI에서 상태값 표시는 서버 canonical 을 그대로 매핑 (예: `walletStatus: 'uncreated' → "미생성"`).

## 5. 참고 API 맵(추후 결정)

| 화면 초기화 | 호출 API |
| --- | --- |
| 로그인 성공 후 첫 진입 | `GET /admin/stats/supply`, `GET /admin/stats/daily` (대시보드) |
| 권한 확인 | 로그인 응답의 `userRole` 로 분기 |

> 나머지 화면별 동작은 각 전용 문서를 참조한다.
