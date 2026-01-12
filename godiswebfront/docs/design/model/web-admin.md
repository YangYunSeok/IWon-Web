# Web Admin 데이터 모델 (SSOT)

> 본 문서는 `docs/기본설계문서/api_및_데이터모델_명세서(관리자용).md` 의 `## 2. 데이터 모델` 절을
> MCP/Codegen 구조에 맞춰 `docs/design/model/*` 영역으로 이관한 결과입니다.
> 공통 타입/enum 은 `docs/design/model/web-common-types.md` 를 참조합니다.

## 1. 대시보드 / 통계

### SupplySummary

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| dbTotal | IWC | DB 기준 총 유통량 |
| chainTotal | IWC | 블록체인 기준 총량 |
| matched | boolean | 두 지표 일치 여부 |
| checkedAt | ISODateString | 검증 시각 |
| blockHeight | number | 기준 블록 높이 |

| coinTotals | { coinType: string, dbTotal: IWC, chainTotal: IWC, matched: boolean }[] | 코인별 합계 및 일치 여부 리스트 |
| note | string (optional) | 추가 검증 메모/경고 메시지 |

### DailyMetrics

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| newWallets | number | 신규 지갑 수 |
| minted | IWC | 당일 발행 총액 |
| burned | IWC | 당일 회수/사용 총액 |
| pendingApprovals | number | 승인 대기 건수 |

## 4. 월별 지급 대상자 (Monthly Payee)

### MonthlyPayee

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 레코드 ID |
| year | number | 지급 연도 |
| month | number | 지급 월(1-12) |
| employeeId | string | 사번 |
| name | string | 수혜자 이름 |
| coinType | string | 지급 코인 종류 |
| amount | IWC | 지급 금액 |
| reason | string (optional) | 지급 사유/메모 |
| status | string | 상태(예: scheduled/paid/cancelled) |
| scheduledAt | ISODateString (optional) | 예약 지급 시점 |
| paidAt | ISODateString (optional) | 지급 완료 시각 |
| createdBy | string | 등록자(admin user id) |
| createdAt | ISODateString | 등록 시각 |

### MonthlyPayeeList

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| items | MonthlyPayee[] | 목록 |
| total | number | 전체 건수 |

## 2. 임직원 / 지갑

### EmployeeWallet

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| employeeId | string | 사번 |
| name | string | 이름 |
| department | string | 부서 |
| position | string | 직급 |
| walletAddress | string (optional) | 지갑 주소 (Explorer 링크 제공용) |
| walletStatus | WalletStatus | 지갑 상태 |

### EmployeeWalletListResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| items | EmployeeWallet[] | 목록 |
| nextCursor | string (optional) | 페이지 커서(확장 시 사용) |

## 3. 트랜잭션 / 승인

### AdminTransaction

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| txId | string | 트랜잭션 ID |
| txHash | string (optional) | 온체인 해시 |
| type | TxType | 유형 (mint/burn/transfer) |
| coinType | CoinUsageCategory | 코인 용도 구분 |
| amount | IWC | 금액 |
| status | AdminTxStatus | 처리 상태 |
| createdAt | ISODateString | 요청 시각 |

### ApprovalRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| approvalId | string | 승인 요청 ID |
| title | string | 기안 제목 |
| type | TxType | 트랜잭션 유형 |
| totalAmount | IWC | 총 금액 |
| status | ApprovalStatus | 승인 상태 |
| requestedAt | ISODateString | 요청 시각 |

### ApprovalListResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| items | ApprovalRequest[] | 승인 대기 목록 |

## 4. 지갑 생성 / 일괄 작업

### CreateWalletRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| employeeIds | string[] | 지갑을 생성할 사번 목록 |

### CreateWalletResponse *(임시 정의)*

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| requestedCount | number | 요청한 사번 수 |
| createdCount | number | 생성 성공 수 |
| failedEmployeeIds | string[] (optional) | 실패한 사번 목록 |

> **NOTE:** UI 관점에서 성공/실패 피드백이 필요하므로 최소 위 필드를 권장합니다.
> 세부 스펙이 확정되면 본 문서를 선반영한 뒤 API 문서/코드젠 입력을 갱신하세요.
