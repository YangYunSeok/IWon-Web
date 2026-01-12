# API 및 데이터모델 명세서 (관리자용, I-WON Admin)

본 문서는 **웹UI및설계가이드(관리자용)2.md**에 정의된 관리자 UI/UX를 구현하기 위해 필요한
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
- Role
    - `operator`: 기안, 조회, 업로드
    - `approver`: 승인, 실행, 키 관리

### 1.2. 공통 타입

| 이름 | 타입 | 설명 |
|---|---|---|
| IWC | number | 코인금액 (IWon Coin의 약어) |
| ISODateString | string | ISO-8601 시간 |
| CoinType | 'welfare' \| 'payment' | 코인 유형 |
| WalletStatus | 'uncreated' \| 'active' \| 'frozen' | 지갑 상태 |
| TxType | 'mint' \| 'burn' \| 'transfer' | 관리자 트랜잭션 유형 |
| ApprovalStatus | 'pending' \| 'approved' \| 'rejected' | 승인 상태 |

### 1.3. 공통 에러 코드

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

#### DailyMetrics

| 필드 | 타입 | 설명 |
|---|---|---|
| newWallets | number | 신규 지갑 수 |
| minted | IWC | 금일 발행 |
| burned | IWC | 금일 소각/사용 |
| pendingApprovals | number | 승인 대기 건수 |

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
| title | string | 기안 제목 |
| type | TxType | 트랜잭션 유형 |
| totalAmount | IWC | 총 금액 |
| status | ApprovalStatus | 승인 상태 |
| requestedAt | ISODateString | 요청 시각 |

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
| employeeName | string (optional) | 이름 |

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

#### 3.3.1. 지급 기안 (Mint)

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

#### 3.3.2. 회수 기안 (Burn)

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

#### 3.4.1. 승인 대기 목록

```@codegen
id: approval.listPending
resource: approval
method: GET
path: /admin/approvals/pending
auth: bearer
requestType: ListPendingApprovalsRequest
responseType: ApprovalListResponse
```

---

#### 3.4.2. 승인 실행

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

## 4. 정리 메모

- 본 문서는 **임직원용 API 명세서와 1:1 구조 대응**을 목표로 설계되었습니다.
- Admin UI 화면 단위 = API Resource 단위로 매핑됩니다.
- 차후 확장 영역
    - 정산/회계 API
    - 외부 감사 로그 전용 API
    - 멀티 체인 대응 필드

