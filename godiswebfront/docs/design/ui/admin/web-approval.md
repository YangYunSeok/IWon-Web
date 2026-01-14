# Web Admin 승인 관리 (Approval)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 7장.
> API 참조: `webApproval.*`.

## 1. 목적

- 외부(앱/시스템)에서 생성된 요청을 단일 화면에서 승인/반려.
- Approver 는 승인 처리, Operator 는 조회만 가능.

## 2. 레이아웃

1. **KPI 배너**
   - 승인 대기 건수
   - 경고 발생 건수 (검증 실패 등)
   - 승인 후 예상 준비금 비율 (계산식 서버 제공)
2. **승인 대기 목록(Table)**
   - 컬럼: 요청 유형, 요청 주체, 가맹점명/대상자, 요청 금액, 요청 일시, 상태, `[상세보기]`.
3. **승인 상세 팝업**
   - 공통: 첨부/증빙, 승인/반려(반려 사유 필수), 승인 이력 타임라인
   - 유형별:
     - (정산요청) 정산 기간, 거래 요약(건수/총액/수수료/정산금액), (선택) 정산 내역 다운로드
     - (전환요청) 대상자, 전환 금액/사유
     - (Mint/Burn) Before/After 유통량 비교, 시스템 사전 검증 결과
4. **Action 영역**
   - `[승인 실행]`, `[반려]` (사유 입력)
   - 실행 결과 로그: Tx Hash, 블록 번호

## 3. API 플로우

### 3.1 최초 진입

| 단계 | API |
| --- | --- |
| 목록 조회 | `GET /admin/approvals` (기본 status=pending) |

### 3.2 사용자 액션

| 단계 | API |
| --- | --- |
| 상세 보기 | `GET /admin/approvals/{approvalId}` |
| 승인 실행 | `POST /admin/approvals/{approvalId}/confirm` |
| 승인 반려 | `POST /admin/approvals/{approvalId}/reject` |

### 3.3 추가 플로우

- 실행 시 추가 보안(2FA 등) 필요 시 모달 삽입 가능: TBD

## 4. 상태 / 에러 / 빈 화면

- 로딩: TBD
- 빈 화면: TBD

| 상태 | UX |
| --- | --- |
| `ApprovalStatus=pending` | 기본 상태, 실행 버튼 활성 |
| `ApprovalStatus=approved/ rejected` | 목록에서 Disabled, 배지 업데이트 |
| `INSUFFICIENT_RESERVE` | 팝업 상단 Red Banner + 버튼 비활성 |
| `APPROVAL_ALREADY_PROCESSED` | 토스트 → 목록 재조회 |

## 5. 권한

- Operator: 목록/상세 조회만 가능, 모든 Action 버튼 비활성 + Tooltip.
- Approver: 실행/반려 가능. 실행 시 추가 보안(2FA 등) 필요 시 모달 삽입 가능.
