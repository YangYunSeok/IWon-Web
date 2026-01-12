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

### 권장 API 매핑 (현재 문서 기준)

- `GET /admin/monthly-payees?year=YYYY&month=MM&coinType={coin}&status={status}`
   - 월별 대상자 목록 조회. 응답: `MonthlyPayeeList` (items: `MonthlyPayee[]`).
- `POST /admin/monthly-payees`
   - 월별 대상자 일괄 등록/업데이트(업로드). 요청 바디: `{ year, month, items: [{ employeeId, coinType, amount, reason }] }`.
- `PUT /admin/monthly-payees/{id}`
   - 개별 대상자 수정.
- `DELETE /admin/monthly-payees/{id}`
   - 개별 대상자 삭제.
- `POST /admin/monthly-payees/bulk-delete`
   - 일괄 삭제(요청 바디: `ids: string[]`).
- `GET /admin/monthly-payees/export?year=YYYY&month=MM&coinType=...`
   - CSV/XLSX 내보내기 (UI 다운로드용).
- `POST /admin/monthly-payees/{year}-{month}/confirm`
   - 해당 월 계획 확정(옵션): 확정 시 `MonthlyPayee.status`를 `paid` 또는 `scheduled`로 변경하고, 필요 시 `approvals` 생성으로 실제 지급 워크플로우를 트리거합니다.
- `POST /admin/monthly-payees/{year}-{month}/import-prev`
   - 전월 데이터 가져오기: 기존 월(예: YYYY-MM)의 레코드를 복사하여 편집 가능한 신규 레코드로 생성합니다.

Note: 백엔드 구현은 `MonthlyPayee` 모델(예: `id, year, month, employeeId, name, coinType, amount, reason, status, scheduledAt, paidAt, createdBy, createdAt`)을 기준으로 하며, 실제 지급 실행은 `approvals`/`admin_transactions` 워크플로우로 연결하는 방식으로 권장합니다.

> 실제 API 확정 시 `docs/design/api/web-admin.md` 및 `docs/design/model/web-admin.md`와 본 문서를 동기화하세요.
