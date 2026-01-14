# Web Admin 임직원 지갑 관리 (WalletMgmt)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 4장.
> API 참조: `webWallet.*` (`docs/design/api/web-admin.md`).

## 1. 목적

- 임직원 지갑 생성 여부, 상태, Explorer 링크를 관리.
- Approver 는 개인키 백업/재설정 권한을 갖는다.

## 2. 레이아웃

1. **검색/필터 Bar**
   - 사번/이름 검색 입력(`name`/`keyword` Query), 부서, 재직 상태, `지갑 미생성자만 보기` 토글.
   - 지갑 상태 칩: `uncreated`, `active`, `frozen`.
2. **요약 KPI**
   - 전체 직원 수 / 지갑 생성 완료 수 / 미생성 수.
3. **임직원 리스트(Table)**
   - 컬럼: 사번, 성명, 부서, 직급, 지갑 주소(Explorer 링크), 지갑 상태.
   - 퇴사자: `Inactive` 라벨 + 동결 아이콘.
4. **Action Bar**
   - `[지갑 생성]`: 선택된 사번 배열 → `POST /admin/wallets/create`.
   - `[개인키 백업]`: Approver 권한 전용. 추후 별도 API 연동.

- UI 규칙
   - 테이블 선택은 체크박스 다중 선택, KPI 는 현재 필터 기준 수치.
   - Explorer 링크는 새 탭으로 열기.
   - Approver 전용 버튼은 Role 기반으로 렌더링 여부 제어.

## 3. API 플로우

### 3.1 최초 진입

1. Sidebar `WalletMgmt` 선택 → `GET /admin/employees` 호출.

### 3.2 사용자 액션

1. 필터 변경 시 동일 API 재호출 (`walletStatus`, `department`).
2. `[지갑 생성]` 실행 → `POST /admin/wallets/create`.
3. `[개인키 백업]` 실행 → TBD (추후 별도 API 연동)

### 3.3 추가 플로우

- TBD (추가 비동기/후처리 플로우가 문서에 명시되어 있지 않음)

## 4. 상태 / 에러 / 빈 화면

- 로딩: TBD
- 빈 화면: TBD

| 상황 | 처리 |
| --- | --- |
| `WALLET_NOT_FOUND` | 상단 경고 배너 + "지갑 미생성자 보기" 토글 자동 활성화 |
| 일괄 생성 성공 | 결과 모달: 생성/실패 수, 실패 사번 리스트 (`CreateWalletResponse`) |
| 권한 없음 | `FORBIDDEN` → Action 버튼 비활성 + Tooltip |

## 5. 권한

- Approver: 개인키 백업/재설정 권한
- `[개인키 백업]`: Approver 권한 전용
- 기타 Role/권한(예: 조회/지갑 생성 가능 Role 범위): TBD
