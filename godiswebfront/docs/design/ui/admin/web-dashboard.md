# Web Admin Dashboard 화면

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 3장.
> API 참조: `IWONCOIN01S1.*` (`docs/design/api/web-admin.md`).

## 1. 목적

- 재무 건전성, 발행 통제 상태, 온체인 처리 현황을 실시간 모니터링.
- Alert 로 DB–온체인 불일치 및 승인 실패를 즉시 식별.

## 2. 레이아웃

1. **Header KPI**
   - 총 IWon 발행량 카드: `SupplySummary`
     - `matched=false` → Red Alert + "불일치 상세" 링크.
     - 보조 정보: 최종 검증 시각(`checkedAt`), 블록 높이(`blockHeight`).
2. **용도별 발행/유통 현황**
   - Pie Chart: 복지 vs 결제 (`CoinUsageCategory`).
   - Data table: DB/체인 기준 잔액, 전일 대비 증감.
3. **금일 주요 지표**
   - `DailyMetrics`: 신규 지갑, 금일 발행, 금일 회수, 승인 대기 건수.
4. **트랜잭션 모니터링**
   - Pending 온체인 리스트 (추후 `AdminTransaction` 확장 필요).
   - 실패 내역 + `[재처리]` 액션 (버튼 클릭 시 승인 화면 링크).
5. **Alert & System Status**
   - 시스템 Alert 로그: 불일치, 승인 실패.
   - 노드/API Health 표시 (OK/Degraded/Down).

## 3. API 플로우

### 3.1 최초 진입

- 로그인 직후 또는 Sidebar `Dashboard` 클릭 시: `GET /iwon/iwoncoin01s1/supply`, `GET /iwon/iwoncoin01s1/daily` 동시 호출

### 3.2 사용자 액션

- Focus/새로고침 시: `GET /iwon/iwoncoin01s1/supply`, `GET /iwon/iwoncoin01s1/daily` 동시 호출
- `체크 시각 새로고침` 버튼
  - 두 통계 API 재호출
- Alert 항목 클릭
  - 관련 화면 (Approval / WalletMgmt) 딥링크 이동 (추가 API 호출 여부: TBD)

### 3.3 추가 플로우

- TBD

## 4. 상태 / 에러 / 빈 화면

- 최초 로딩: Skeleton (카드, 차트 placeholder).
- 빈 화면: 데이터 없음 → "데이터 수집 중" 메시지.

| 서버 상태 | UI 반영 |
| --- | --- |
| `matched=false` | 상단 카드 배경 Red, Alert 리스트 최상단 푸시 |
| `DISCREPANCY_DETECTED` 에러 | Alert 섹션에 신규 항목 추가 |
| API 실패 (5xx) | 화면 상단 Global Error + 재시도 버튼 |

## 5. 권한

- TBD (접근 가능 Role 및 조회/액션 권한이 문서에 명시되어 있지 않음)
