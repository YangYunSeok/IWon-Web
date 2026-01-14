# API 및 데이터모델 명세서 (관리자용, I-WON Admin)

본 문서는 **웹UI및설계가이드(관리자용).md**에 정의된 관리자 UI/UX를 구현하기 위해 필요한
백엔드 **API / 요청·응답 DTO / 데이터 모델**을 정리한 명세서입니다.

- 대상 클라이언트: Admin Web (Operator / Approver)
- 통신: HTTPS + JSON
- 인증: Bearer Token (Role 기반 권한 제어)
- 시간 포맷: ISO-8601 (`ISODateString`)
- 금액 단위: 정수 (`IWC`, IWon = 1 IWC 가정)

---

## 0. Codegen 입력 포맷 최소 규격 v1

본 문서는 **임직원용 API 명세서 포맷과 동일한 codegen 규칙**을 따릅니다.

### 0.1. 필수 규칙

- 리소스 단위 Section 유지 (예: `### 3.1. Dashboard`)
- 엔드포인트마다 `@codegen` 블록 1개
- `method / path / auth` 명시
- `requestType / responseType` 명시
- 요청/응답 필드 표(Table) 유지

```@codegen
id: <resource>.<operation>
resource: <resource>
method: <HTTP_METHOD>
path: </path>
auth: bearer
requestType: <TypeName>
responseType: <TypeName>
```

---

## 1. 공통 규약 (관리자)

### 1.1. 인증 / 권한

- Header: `Authorization: Bearer <adminAccessToken>`
- Role (UI 표기)
    - `operator`: 요청 생성/관리(지갑 생성, Mint/Burn 요청 등)
    - `approver`: 승인/확정/감사(승인 처리, 결산 등)
    - `viewer`: 조회 전용(대시보드/거래이력 등)
- 권한 코드 (RBAC)
    - 작성자: `ROLE_ADMIN_OPERATOR`
    - 승인자: `ROLE_ADMIN_APPROVER`
    - 조회 전용: `ROLE_ADMIN_VIEWER`

### 1.2. 공통 타입

| 이름 | 타입 | 설명 |
|---|---|---|
| IWC | number | 코인금액 (IWon Coin의 약어) |
| ISODateString | string | ISO-8601 시간 |
| CoinType | 'welfare' \| 'payment' | 코인 유형 |
| WalletStatus | 'uncreated' \| 'active' \| 'frozen' | 지갑 상태 |
| TxType | 'mint' \| 'burn' \| 'transfer' | 관리자 트랜잭션 유형 |
| ApprovalStatus | 'pending' \| 'approved' \| 'rejected' | 승인 상태 |
| ApprovalType | 'settlement' \| 'naverpayConversion' \| 'mint' \| 'burn' | 승인 요청 유형 |
| ApprovalRequesterType | 'merchant' \| 'system' \| 'admin' | 요청 주체 |
| MonthlyPlanStatus | 'draft' \| 'confirmed' | 월별 지급 계획 상태 |
| MonthlyPayeeStatus | 'scheduled' \| 'paid' \| 'cancelled' | 월별 지급 대상자 상태 |

### 1.3. 공통 조회/검색(Query) 규약 (Dashboard 제외)

다수의 리스트 화면은 아래 공통 검색 파라미터를 지원하는 것을 권장합니다. (화면별로 일부 생략 가능)

| 파라미터 | 타입 | 설명 |
|---|---|---|
| department | string (optional) | 부서(조직) 필터 |
| name | string (optional) | 이름 부분일치 |
| keyword | string (optional) | 통합 검색(사번/이메일/TxHash 등) |
| page | number (optional) | 페이지(1-base) |
| size | number (optional) | 페이지 크기 |

### 1.4. 공통 에러 코드

| 코드 | 설명 |
|---|---|
| UNAUTHORIZED | 인증 실패 |
| FORBIDDEN | 권한 없음 |
| DISCREPANCY_DETECTED | DB–온체인 불일치 |
| INSUFFICIENT_RESERVE | 준비금 부족 |
| WALLET_NOT_FOUND | 지갑 미생성 |
| VALIDATION_ERROR | 입력값 오류 |

---

## 2. 데이터 모델

### 2.1. 대시보드

#### SupplySummary

| 필드 | 타입 | 설명 |
|---|---|---|
| dbTotal | IWC | DB 기준 총 유통량 |
| chainTotal | IWC | 블록체인 기준 총량 |
| matched | boolean | 일치 여부 |
| checkedAt | ISODateString | 검증 시각 |
| blockHeight | number | 기준 블록 높이 |
| CoinType | 'welfare' \| 'payment' | 코인 유형 |

#### DailyMetrics

| 필드 | 타입 | 설명 |
|---|---|---|
| newWallets | number | 신규 지갑 수 |
| minted | IWC | 금일 발행 |
| burned | IWC | 금일 소각/사용 |
| pendingApprovals | number | 승인 대기 건수 |
| CoinType | 'welfare' \| 'payment' | 코인 유형 |

---

### 2.2. 임직원 / 지갑

#### EmployeeWallet

| 필드 | 타입 | 설명 |
|---|---|---|
| employeeId | string | 사번 |
| name | string | 이름 |
| department | string | 부서 |
| position | string | 직급 |
| walletAddress | string (optional) | 지갑 주소 |
| walletStatus | WalletStatus | 지갑 상태 |

---

### 2.3. 트랜잭션 / 승인

#### AdminTransaction

| 필드 | 타입 | 설명 |
|---|---|---|
| txId | string | 트랜잭션 ID |
| txHash | string (optional) | 온체인 해시 |
| type | TxType | 유형 |
| coinType | CoinType | 코인 유형 |
| amount | IWC | 금액 |
| status | 'pending' \| 'success' \| 'failed' | 처리 상태 |
| createdAt | ISODateString | 요청 시각 |

#### ApprovalRequest

| 필드 | 타입 | 설명 |
|---|---|---|
| approvalId | string | 승인 요청 ID |
| type | ApprovalType | 승인 요청 유형 |
| requesterType | ApprovalRequesterType | 요청 주체 |
| requesterName | string (optional) | 요청 주체 표시명(가맹점/시스템/관리자) |
| subjectName | string (optional) | 가맹점명 또는 대상자 표시명 |
| amount | IWC | 요청 금액 |
| status | ApprovalStatus | 승인 상태 |
| requestedAt | ISODateString | 요청 시각 |
| title | string (optional) | (레거시/옵션) UI 표기용 제목 |

#### ApprovalDetail

| 필드 | 타입 | 설명 |
|---|---|---|
| approval | ApprovalRequest | 헤더 정보 |
| attachments | { name: string, url: string }[] (optional) | 첨부/증빙 |
| timeline | { status: ApprovalStatus, at: ISODateString, by?: string, reason?: string }[] (optional) | 승인 이력 |
| summary | { txCount?: number, totalAmount?: IWC, fee?: IWC, settlementAmount?: IWC } (optional) | (정산요청) 거래 요약 |
| conversion | { employeeId?: string, name?: string, amount?: IWC, reason?: string } (optional) | (전환요청) 정보 |
| mintBurn | { beforeTotal?: IWC, afterTotal?: IWC, precheck?: string[] } (optional) | (Mint/Burn) 비교/사전검증 |

#### ApprovalListResponse

| 필드 | 타입 | 설명 |
|---|---|---|
| items | ApprovalRequest[] | 목록 |
| total | number | 전체 건수 |

#### TransactionListResponse

| 필드 | 타입 | 설명 |
|---|---|---|
| items | AdminTransaction[] | 목록 |
| total | number | 전체 건수 |

### 2.4. 월별 지급 대상자 관리
월별로 다수의 수혜자를 등록/관리하여, 월별 일괄 지급(스케줄링) 또는 검토용으로 사용하는 모델입니다.

#### MonthlyPayee
| 필드 | 타입 | 설명 |
|---|---|---|
| id | string | 레코드 ID |
| year | number | 지급 연도(예: 2026) |
| month | number | 지급 월(1-12) |
| employeeId | string | 사번 |
| name | string | 수혜자 이름 |
| coinType | CoinType | 지급 코인 종류 |
| amount | IWC | 지급 금액 |
| reason | string (optional) | 지급 사유/메모 |
| status | MonthlyPayeeStatus | 상태(스케줄/지급/취소) |
| scheduledAt | ISODateString (optional) | 예약 지급 시점 |
| paidAt | ISODateString (optional) | 지급 완료 시각 |
| createdBy | string | 등록자(admin user id) |
| createdAt | ISODateString | 등록 시각 |

#### MonthlyPayeeList
| 필드 | 타입 | 설명 |
|---|---|---|
| items | MonthlyPayee[] | 목록 |
| total | number | 전체 건수 |

---

## 3. API 명세

### 3.1. Dashboard

#### 3.1.1. 총 발행량 요약 조회

```@codegen
id: dashboard.getSupply
resource: dashboard
method: GET
path: /admin/stats/supply
auth: bearer
requestType: GetSupplyRequest
responseType: SupplySummary
```

Request: 없음

Response: `SupplySummary`

---

#### 3.1.2. 금일 주요 지표

```@codegen
id: dashboard.getDaily
resource: dashboard
method: GET
path: /admin/stats/daily
auth: bearer
requestType: GetDailyMetricsRequest
responseType: DailyMetrics
```

---

### 3.2. 임직원 지갑 관리

#### 3.2.1. 임직원 지갑 목록 조회

```@codegen
id: wallet.listEmployees
resource: wallet
method: GET
path: /admin/employees
auth: bearer
requestType: ListEmployeesRequest
responseType: EmployeeWalletListResponse
```

Query:

| 파라미터 | 타입 | 설명 |
|---|---|---|
| walletStatus | WalletStatus (optional) | 지갑 상태 필터 |
| department | string (optional) | 부서 |
| name | string (optional) | 이름 |
| keyword | string (optional) | 통합 검색(사번/이메일 등) |

Response:

| 필드 | 타입 | 설명 |
|---|---|---|
| items | EmployeeWallet[] | 목록 |

---

#### 3.2.2. 지갑 생성

```@codegen
id: wallet.create
resource: wallet
method: POST
path: /admin/wallets/create
auth: bearer
requestType: CreateWalletRequest
responseType: CreateWalletResponse
```

Request:

| 필드 | 타입 | 설명 |
|---|---|---|
| employeeIds | string[] | 대상 사번 목록 |

---

### 3.3. 코인 지급 / 회수

#### 3.3.1. 지급 요청 생성 (Mint)

```@codegen
id: mint.request
resource: mint
method: POST
path: /admin/mint/request
auth: bearer
requestType: MintRequest
responseType: ApprovalRequest
```

---

#### 3.3.2. 회수 요청 생성 (Burn)

```@codegen
id: burn.request
resource: burn
method: POST
path: /admin/burn/request
auth: bearer
requestType: BurnRequest
responseType: ApprovalRequest
```

---

### 3.4. 승인 관리

#### 3.4.1. 승인 목록 조회

```@codegen
id: approval.list
resource: approval
method: GET
path: /admin/approvals
auth: bearer
requestType: ListApprovalsRequest
responseType: ApprovalListResponse
```

Query (예):

| 파라미터 | 타입 | 설명 |
|---|---|---|
| status | ApprovalStatus (optional) | 상태 필터(기본: pending) |
| department | string (optional) | 부서(조직) |
| name | string (optional) | 이름 |
| keyword | string (optional) | 통합 검색(요청ID/가맹점명 등) |

---

#### 3.4.2. 승인 상세 조회

```@codegen
id: approval.get
resource: approval
method: GET
path: /admin/approvals/{approvalId}
auth: bearer
requestType: GetApprovalRequest
responseType: ApprovalDetail
```

---

#### 3.4.3. 승인 실행

```@codegen
id: approval.confirm
resource: approval
method: POST
path: /admin/approvals/{approvalId}/confirm
auth: bearer
requestType: ConfirmApprovalRequest
responseType: AdminTransaction
```

---

#### 3.4.4. 승인 반려

```@codegen
id: approval.reject
resource: approval
method: POST
path: /admin/approvals/{approvalId}/reject
auth: bearer
requestType: RejectApprovalRequest
responseType: ApprovalDetail
```

Request:

| 필드 | 타입 | 설명 |
|---|---|---|
| reason | string | 반려 사유(필수) |

### 3.5. 월별 지급 대상자 관리

#### 3.5.1. 월별 지급 대상자 목록 조회
- **Method/Path**: `GET /admin/monthly-payees`
- **Auth**: bearer

```@codegen
id: monthlyPayee.list
resource: monthlyPayee
method: GET
path: /admin/monthly-payees
auth: bearer
requestType: ListMonthlyPayeesRequest
responseType: MonthlyPayeeList
```
Query:
| 파라미터 | 타입 | 설명 |
|---|---|---|
| year | number (optional) | 연도 필터 |
| month | number (optional) | 월 필터 |
| coinType | CoinType (optional) | 코인 필터 |
| status | MonthlyPayeeStatus (optional) | 상태 필터 |
| department | string (optional) | 부서(조직) |
| name | string (optional) | 이름 |
| keyword | string (optional) | 통합 검색(사번/이메일 등) |

Response: `MonthlyPayeeList`

---

#### 3.5.2. 월별 지급 대상자 등록/수정

```@codegen
id: monthlyPayee.upsert
resource: monthlyPayee
method: POST
path: /admin/monthly-payees/{id}
auth: bearer
requestType: UpsertMonthlyPayeeRequest
responseType: MonthlyPayee
```

Request:

| 필드 | 타입 | 설명 |
|---|---|---|
| year | number | 연도 |
| month | number | 월 |
| employeeId | string | 사번 |
| coinType | CoinType | 코인 |
| amount | IWC | 금액 |
| reason | string (optional) | 메모 |

---

#### 3.5.3. 월별 지급 대상자 수정 / 삭제
- 단건 삭제: `DELETE /admin/monthly-payees/{id}`
- 일괄 삭제: `PUT /admin/monthly-payees/bulk-delete` (id 리스트)

---

#### 3.5.4. 월별 지급 계획 확정

```@codegen
id: monthlyPayee.confirm
resource: monthlyPayee
method: DELETE
path: /admin/monthly-payees/{year}-{month}/confirm
auth: bearer
requestType: ConfirmMonthlyPayeesRequest
responseType: ConfirmMonthlyPayeesResponse
```

---

#### 3.5.5. 월별 지급 파일 내보내기
- **Method/Path**: `GET /admin/monthly-payees/export?year=YYYY&month=MM&coinType=...`
- CSV/XLSX로 내보내기 (UI에서 다운로드)

---

### 3.6. 거래 이력 조회

#### 3.6.1. 거래 이력 목록 조회

```@codegen
id: transaction.list
resource: transaction
method: GET
path: /admin/transactions
auth: bearer
requestType: ListTransactionsRequest
responseType: TransactionListResponse
```

Query (예):

| 파라미터 | 타입 | 설명 |
|---|---|---|
| from | ISODateString (optional) | 시작 시각 |
| to | ISODateString (optional) | 종료 시각 |
| type | TxType (optional) | 유형 |
| coinType | CoinType (optional) | 코인 |
| keyword | string (optional) | 통합 검색(TxHash/사번/이름 등) |

---

### 3.7. 재무회계결산 관리

본 화면은 UI 가이드에 포함되어 있으나, API 스펙은 백엔드 확정이 필요합니다.

- 탭 1: 재무회계결산 내역(분개 리스트)
- 탭 2: 결산보고서(요약)
- 탭 3: 준비금 계정 잔액 및 발행부채 현황

---

## 4. 정리 메모

- 본 문서는 **임직원용 API 명세서와 1:1 구조 대응**을 목표로 설계되었습니다.
- Admin UI 화면 단위 = API Resource 단위로 매핑됩니다.
- 차후 확장 영역
    - 정산/회계 API
    - 외부 감사 로그 전용 API
    - 멀티 체인 대응 필드

