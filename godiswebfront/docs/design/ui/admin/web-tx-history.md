# Web Admin 거래 이력 조회 (TxHistory)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 6장.
> API 참조: `webTxHistory.list`.

## 1. 목적

- 온체인/오프체인 모든 거래를 감사 관점에서 추적.
- 검색/필터/상세 미리보기를 제공.

## 2. 레이아웃

### 2.1 상단 필터

| 필드 | 설명 |
| --- | --- |
| 기간(Date Range) | 기본 최근 30일, 커스텀 지원 |
| 유형 | Mint / Burn / Transfer |
| 코인 타입 | 복지 / 결제 |
| 통합 검색 | 사번, 이름, TxHash |

### 2.2 바디 (테이블)

- 컬럼: Tx Hash(Explorer 링크), 일시, 유형, Sender, Receiver, 상태.
- 상태 칩: `success`(Green), `failed`(Red), `pending`(Amber).
- 행 클릭 시 우측/하단 상세 미리보기 패널 펼침.

### 2.3 하단 영역

- 페이지네이션 (cursor 기반 권장).
- 상세 패널: 메모, 체인 높이, 실행자, 승인 이력.

## 3. API 플로우

### 3.1 최초 진입

- 화면 진입 시 목록 조회: `GET /admin/transactions`
	- 기본 기간: 최근 30일

### 3.2 사용자 액션

- 필터 변경 시 목록 API 재호출: `GET /admin/transactions`
- 페이지네이션 동작 시 추가 조회: TBD (cursor 기반 권장)
- 행 클릭 후 상세 미리보기 패널 데이터 로드: TBD (추가 API 호출 여부가 문서에 명시되어 있지 않음)

### 3.3 추가 플로우

- TBD
- Note: 모델/요청 타입은 SSOT인 `docs/design/model/web-admin.md`를 따른다.
- Note: `[재처리]` 버튼이 필요하면 Approval 화면 딥링크를 추가한다 (구체 동작/권한/노출 위치: TBD).

## 4. 상태 / 에러 / 빈 화면

| 상황 | 처리 |
| --- | --- |
| 검색 결과 없음 | "조건에 맞는 거래가 없습니다" with reset link |
| API 실패 | 테이블 전체 Skeleton + 재시도 버튼 |

## 5. 권한

- TBD (접근 가능 Role 및 조회/액션 권한이 문서에 명시되어 있지 않음)
