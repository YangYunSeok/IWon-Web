# Web Admin 월별 지급 대상자 관리 (MonthlyPlan)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 8장.
> API: 추후 정기 지급 계획 전용 리소스 (현재 UI 기준만 이관).

## 1. 목적

- 월별 복지코인 지급 계획을 사전 수립/확정.
- 전월 데이터 재사용, 대상자 편집, 확정 프로세스를 제공.

## 2. 레이아웃

1. **상단 영역**
   - 기준 월 선택 (`YYYY-MM`).
   - 확정 상태 배지: Draft / Confirmed.
2. **바디 (테이블)**
   - 컬럼: 사번, 성명, 지급 금액, 비고.
   - 행 추가/삭제, 일괄 편집.
3. **하단 액션**
   - `[전월 데이터 가져오기]`
   - `[대상자 추가]`
   - `[계획 확정]` (Approver 권한 필요 시 설정)

## 3. 상태/에러 처리

| 상황 | 처리 |
| --- | --- |
| 확정 상태에서 편집 시도 | 확인 모달 + 편집 금지 |
| 전월 데이터 없음 | 토스트 + 빈 상태 안내 |
| 확정 API 실패 | 에러 토스트 + 버튼 재활성 |

## 4. 향후 API 맵 (제안)

- `GET /admin/monthly-plans?month=YYYY-MM`
- `POST /admin/monthly-plans/{month}/confirm`
- `POST /admin/monthly-plans/{month}/import-prev`

> 실제 API 확정 시 `docs/design/api/web-admin.md` 와 본 문서를 동시 업데이트한다.
