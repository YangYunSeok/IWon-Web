# Web Admin 온체인 승인 관리 (Approval)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 7장.
> API 참조: `webApproval.*`.

## 1. 목적

- Mint/Burn 기안의 사전 통제 및 최종 실행.
- Approver 전용 화면, Operator 는 조회만 가능.

## 2. 레이아웃

1. **KPI 배너**
   - 승인 대기 건수
   - 경고 발생 건수 (검증 실패 등)
   - 승인 후 예상 준비금 비율 (계산식 서버 제공)
2. **승인 대기 목록(Table)**
   - 컬럼: 유형, 기안 제목, 총 금액, 시스템 사전 검증 결과, 요청 일시, `[상세보기]`.
3. **승인 상세 팝업**
   - Before/After 유통량 비교
   - 오류 대상 리스트 (지갑 미생성, 한도 초과)
   - 정산용 Excel 다운로드
4. **Action 영역**
   - `[승인 실행]`, `[반려]` (사유 입력)
   - 실행 결과 로그: Tx Hash, 블록 번호

## 3. 데이터 플로우

| 단계 | API |
| --- | --- |
| 목록 조회 | `GET /admin/approvals/pending` |
| 상세 보기 | 동일 응답의 `ApprovalRequest` + 별도 상세 API(추후) |
| 승인 실행 | `POST /admin/approvals/{approvalId}/confirm` |

## 4. 상태/에러 처리

| 상태 | UX |
| --- | --- |
| `ApprovalStatus=pending` | 기본 상태, 실행 버튼 활성 |
| `ApprovalStatus=approved/ rejected` | 목록에서 Disabled, 배지 업데이트 |
| `INSUFFICIENT_RESERVE` | 팝업 상단 Red Banner + 버튼 비활성 |
| `APPROVAL_ALREADY_PROCESSED` | 토스트 → 목록 재조회 |

## 5. 권한

- Operator: 목록/상세 조회만 가능, 모든 Action 버튼 비활성 + Tooltip.
- Approver: 실행 가능. 실행 시 지문/2FA 추가 검토 필요 시 모달 삽입 가능.
