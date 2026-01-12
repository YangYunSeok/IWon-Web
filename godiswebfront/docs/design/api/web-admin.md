# API 및 데이터모델 명세서 (Web Admin)

> 본 문서는 `docs/design/_index.md` 기준의 **관리자 웹 SSOT(API 계약)** 입니다.
> 기존 문서 `docs/기본설계문서/api_및_데이터모델_명세서(관리자용).md` 의 내용을 역할별 문서로 재구성했습니다.

- 대상 클라이언트: Admin Web Console (Operator / Approver)
- 통신: HTTPS + JSON
- 인증: Bearer Token (Role 기반)
- 시간 포맷: ISODateString
- 금액 단위: IWC (원화 정수)

## 0. Codegen 입력 포맷 최소 규격 v1

### 0.1. 체크리스트

- 리소스 단위 Section 유지 (예: `### 3.1. Dashboard`)
- 엔드포인트마다 `@codegen` 블록 1개
- `method / path / auth` 명시
- `requestType / responseType` 명시
- 요청/응답 필드 표 또는 참조 모델 명시

### 0.2. `@codegen` 블록 포맷

```@codegen
id: <resource>.<operation>
resource: <resource>
method: <HTTP_METHOD>
path: </path>
auth: none | bearer
requestType: <TypeName>
responseType: <TypeName>
```

## 1. 공통 규약 (관리자)

### 1.1. 인증 / 권한

- Header: `Authorization: Bearer <adminAccessToken>`
- Role
  - `operator`: 기안, 조회, 업로드
  - `approver`: 승인, 실행, 키 관리

### 1.2. 공통 타입 / Enum

- 관리자 웹 공통 타입/Enum (SSOT): `docs/design/model/web-common-types.md`

### 1.3. 공통 에러 코드

- 관리자 웹 에러 코드/UX 매핑 (SSOT): `docs/design/model/web-error-codes.md`
- 관리자 전용 확장: `docs/design/model/web-error-codes.md`

## 2. 데이터 모델(참조)

- 관리자 데이터 모델 SSOT: `docs/design/model/web-admin.md`

## 3. API 명세

### 3.1. Dashboard

#### 3.1.1. 총 발행량 요약 조회

- **Method/Path**: `GET /admin/stats/supply`
- **Auth**: bearer

```@codegen
id: webDashboard.getSupply
resource: webDashboard
method: GET
path: /admin/stats/supply
auth: bearer
requestType: GetSupplySummaryRequest
responseType: SupplySummary
```

- Request: 바디 없음
- Response: `SupplySummary`

#### 3.1.2. 금일 주요 지표

- **Method/Path**: `GET /admin/stats/daily`
- **Auth**: bearer

```@codegen
id: webDashboard.getDaily
resource: webDashboard
method: GET
path: /admin/stats/daily
auth: bearer
requestType: GetDailyMetricsRequest
responseType: DailyMetrics
```

- Request: 바디 없음
- Response: `DailyMetrics`

### 3.2. 임직원 지갑 관리

#### 3.2.1. 임직원 지갑 목록 조회

- **Method/Path**: `GET /admin/employees`
- **Auth**: bearer

```@codegen
id: webWallet.listEmployees
resource: webWallet
method: GET
path: /admin/employees
auth: bearer
requestType: ListEmployeesRequest
responseType: EmployeeWalletListResponse
```

**Query**

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| walletStatus | WalletStatus (optional) | 지갑 상태 필터 |
| department | string (optional) | 부서 |
| employeeName | string (optional) | 이름 검색어 |

- Response: `EmployeeWalletListResponse`

#### 3.2.2. 지갑 생성

- **Method/Path**: `POST /admin/wallets/create`
- **Auth**: bearer

```@codegen
id: webWallet.create
resource: webWallet
method: POST
path: /admin/wallets/create
auth: bearer
requestType: CreateWalletRequest
responseType: CreateWalletResponse
```

**Request Body (CreateWalletRequest)**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| employeeIds | string[] | 대상 사번 목록 |

- Response: `CreateWalletResponse`

### 3.3. 코인 지급 / 회수 기안

#### 3.3.1. 지급 기안 (Mint)

- **Method/Path**: `POST /admin/mint/request`
- **Auth**: bearer

```@codegen
id: webMint.request
resource: webMint
method: POST
path: /admin/mint/request
auth: bearer
requestType: MintRequest
responseType: ApprovalRequest
```

- Request Body: `MintRequest` (필드 정의 TBD → UI 기준으로 amount/coinType/대상/사유를 포함해야 함)
- Response: `ApprovalRequest`

#### 3.3.2. 회수 기안 (Burn)

- **Method/Path**: `POST /admin/burn/request`
- **Auth**: bearer

```@codegen
id: webBurn.request
resource: webBurn
method: POST
path: /admin/burn/request
auth: bearer
requestType: BurnRequest
responseType: ApprovalRequest
```

- Request Body: `BurnRequest`
- Response: `ApprovalRequest`

### 3.4. 승인 관리

#### 3.4.1. 승인 대기 목록

- **Method/Path**: `GET /admin/approvals/pending`
- **Auth**: bearer

```@codegen
id: webApproval.listPending
resource: webApproval
method: GET
path: /admin/approvals/pending
auth: bearer
requestType: ListPendingApprovalsRequest
responseType: ApprovalListResponse
```

- Response: `ApprovalListResponse`

#### 3.4.2. 승인 실행

- **Method/Path**: `POST /admin/approvals/{approvalId}/confirm`
- **Auth**: bearer

```@codegen
id: webApproval.confirm
resource: webApproval
method: POST
path: /admin/approvals/{approvalId}/confirm
auth: bearer
requestType: ConfirmApprovalRequest
responseType: AdminTransaction
```

- Path Param: `approvalId`
- Response: `AdminTransaction`

## 4. 문서 유지보수 메모

1. UI/QA에서 화면 플로우를 변경하면 **UI 문서 → 모델 문서 → API 문서** 순으로 갱신한다.
2. Codegen 테스트 시 `codegen/` 에서 `npm run docs:lint` 로 본 문서의 `@codegen` 블록을 검증한다.
3. 새로운 관리자 리소스가 추가되면 파일명을 `web-*.md` 규칙에 맞춰 확장한다.
