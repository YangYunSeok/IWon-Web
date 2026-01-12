# Web Admin 거래 이력 조회 (TxHistory)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 6장.
> API: 추후 `AdminTransaction` 목록 전용 엔드포인트 예정(현재 문서에서는 UI 스펙만 유지).

## 1. 목적

- 온체인/오프체인 모든 거래를 감사 관점에서 추적.
- 검색/필터/상세 미리보기를 제공.

## 2. 상단 필터

| 필드 | 설명 |
| --- | --- |
| 기간(Date Range) | 기본 최근 30일, 커스텀 지원 |
| 유형 | Mint / Burn / Transfer |
| 코인 타입 | 복지 / 결제 |
| 통합 검색 | 사번, 이름, TxHash |

필터 변경 시 목록 API 재호출 (추후 `GET /admin/transactions`).

## 3. 바디 (테이블)

- 컬럼: Tx Hash(Explorer 링크), 일시, 유형, Sender, Receiver, 상태.
- 상태 칩: `success`(Green), `failed`(Red), `pending`(Amber).
- 행 클릭 시 우측/하단 상세 미리보기 패널 펼침.

## 4. 하단 영역

- 페이지네이션 (cursor 기반 권장).
- 상세 패널: 메모, 체인 높이, 실행자, 승인 이력.

## 5. 에러/빈 상태

| 상황 | 처리 |
| --- | --- |
| 검색 결과 없음 | "조건에 맞는 거래가 없습니다" with reset link |
| API 실패 | 테이블 전체 Skeleton + 재시도 버튼 |

## 6. TODO

- API 확정 시 `webDashboard` 와 동일한 `AdminTransaction` 모델 재사용.
- `[재처리]` 버튼 필요 시 Approval 화면 딥링크 추가.
