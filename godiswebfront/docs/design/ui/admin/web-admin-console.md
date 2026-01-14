# Web Admin 콘솔 개요 / 로그인

> 본 문서는 [docs/기본설계문서/웹UI및설계가이드(관리자용).md](../../%EA%B8%B0%EB%B3%B8%EC%84%A4%EA%B3%84%EB%AC%B8%EC%84%9C/%EC%9B%B9UI%EB%B0%8F%EC%84%A4%EA%B3%84%EA%B0%80%EC%9D%B4%EB%93%9C(%EA%B4%80%EB%A6%AC%EC%9E%90%EC%9A%A9).md) 의 `0~2` 장(네비게이션/로그인)을
> MCP UI 가이드 포맷으로 이관한 것입니다. Admin 전용 API 참조는 [docs/design/api/web-admin.md](../api/web-admin.md) 를 따른다.

## 1. 목적

- Admin Web 콘솔의 진입(로그인)과 네비게이션(LNB) 구조를 정의한다.
- 로그인/세션/공통 UI 규칙을 단일 기준으로 제공한다.

## 2. 레이아웃

### 2.1 내비게이션 구조

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

### 2.2 로그인 화면 (웹)
※ Godis-Web 플랫폼의 기능을 사용. 별도 구현 필요 없음. ※
- 구성: 시스템 타이틀 `I-Won Admin System`, 중앙 로고, ID/비밀번호 입력, `로그인` 버튼.
- 에러 처리: 공통 에러 코드(`UNAUTHORIZED`) → 필드 밑 오류 메시지.
- 2차 인증(OTP): 현재 보류. 추후 `POST /auth/verify-otp` 연동 시 모달/재전송 UX 재활성화.

## 3. API 플로우

### 3.1 최초 진입

- TBD (Login 화면 최초 진입 시 별도 API 호출 여부가 문서에 명시되어 있지 않음)

### 3.2 사용자 액션

- 로그인
  - `POST /auth/login` 성공 → accessToken + role(userRole) 수신.
- (추후) OTP
  - 현재 보류. 추후 `POST /auth/verify-otp` 연동 시 모달/재전송 UX 재활성화.

### 3.3 추가 플로우

- 로그인 성공 후 첫 진입(대시보드 초기화): `GET /admin/stats/supply`, `GET /admin/stats/daily`
- 권한 확인: 로그인 응답의 `userRole` 로 분기
- 세션 만료: 전역 알림 후 Login 리디렉션 (호출 API는 TBD)

## 4. 상태 / 에러 / 빈 화면

- Sidebar 상태는 Router state 로 관리, 새로고침 후에도 현재 메뉴 표시.
- Alert / Badge 색상 규칙은
  - 정상: Green
  - 경고: Amber
  - 치명적: Red
- UI에서 상태값 표시는 서버 canonical 을 그대로 매핑 (예: `walletStatus: 'uncreated' → "미생성"`).

- 로그인 에러
  - `UNAUTHORIZED` → 필드 밑 오류 메시지.
- 빈 화면: TBD (본 문서는 로그인/네비게이션 개요 문서로, 목록성 화면의 0건 상태 정의는 각 화면 문서에서 다룸)

## 5. 권한

- AdminConsole 접근 가능 Role: TBD (로그인 성공 후 `userRole` 수신 기반)
- 권한 분기 기준
  - 로그인 응답의 `userRole` 로 화면/액션을 Role 기반으로 제어
  - 세부 화면별 권한/액션은 각 전용 문서를 참조
