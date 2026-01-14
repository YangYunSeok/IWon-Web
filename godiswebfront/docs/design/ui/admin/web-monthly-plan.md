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
   - 검색/필터: 부서(조직), 이름/키워드.
2. **바디 (테이블)**
   - 컬럼: 사번, 성명, 지급 금액, 비고.
   - 행 추가/삭제, 일괄 편집.
3. **하단 액션**
   - `[전월 데이터 가져오기]`
   - `[대상자 추가]` / `[일괄 등록]`
   - `[수정]` / `[삭제]` (일괄 삭제 포함)
   - `[계획 확정]` (Approval 연계 권장)

## 3. API 플로우

### 3.1 최초 진입

- 화면 진입 시 목록 조회
  - `GET /admin/monthly-payees` 호출

### 3.2 사용자 액션

- 월 변경/필터 변경
  - `GET /admin/monthly-payees` 재호출
- 대상자 추가/수정 저장
  - `POST /admin/monthly-payees/{id}` 호출
- 단건 삭제
  - `DELETE /admin/monthly-payees/{id}` 호출
- 일괄 삭제
  - `PUT /admin/monthly-payees/bulk-delete` 호출
- 계획 확정
  - `DELETE /admin/monthly-payees/{year}-{month}/confirm` 호출
- 내보내기
  - `GET /admin/monthly-payees/export` 다운로드

### 3.3 추가 플로우

- `[계획 확정]`의 Approval 연계: TBD (연계 방식/권한/프로세스가 문서에 명시되어 있지 않음)
- Note: API 계약은 SSOT인 docs/design/api/web-admin.md를 따른다.

## 4. 상태 / 에러 / 빈 화면

- 로딩: TBD

| 상황 | 처리 |
| --- | --- |
| 확정 상태에서 편집 시도 | 확인 모달 + 편집 금지 |
| 전월 데이터 없음 | 토스트 + 빈 상태 안내 |
| 확정 API 실패 | 에러 토스트 + 버튼 재활성 |

## 5. 권한

- TBD (접근 가능 Role 및 읽기/편집/확정 권한 분리가 문서에 명시되어 있지 않음)
