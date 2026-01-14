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

Note: `SupplySummary`는 코인 구분을 포함하도록 확장될 수 있습니다. UI에서 코인별 합계를 표시하려면 모델의 `coinTotals`(각 코인별 dbTotal/chainTotal/matched)를 함께 반환하세요.

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
| name | string (optional) | 이름 검색어(부분일치) |
| keyword | string (optional) | 통합 검색(사번/이메일 등) |
| page | number (optional) | 페이지(1-base) |
| size | number (optional) | 페이지 크기 |

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

### 3.3. 코인 지급 / 회수 요청 생성

#### 3.3.1. 지급 요청 생성 (Mint)

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

#### 3.3.2. 회수 요청 생성 (Burn)

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

#### 3.4.1. 승인 목록 조회

- **Method/Path**: `GET /admin/approvals`
- **Auth**: bearer

```@codegen
id: webApproval.list
resource: webApproval
method: GET
path: /admin/approvals
auth: bearer
requestType: ListApprovalsRequest
responseType: ApprovalListResponse
```

Query:

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| status | ApprovalStatus (optional) | 상태 필터(기본: pending) |
| department | string (optional) | 부서(조직) |
| name | string (optional) | 이름 검색(부분일치) |
| keyword | string (optional) | 통합 검색(요청 ID/가맹점명 등) |
| page | number (optional) | 페이지(1-base) |
| size | number (optional) | 페이지 크기 |

- Response: `ApprovalListResponse`

#### 3.4.2. 승인 상세 조회

- **Method/Path**: `GET /admin/approvals/{approvalId}`
- **Auth**: bearer

```@codegen
id: webApproval.get
resource: webApproval
method: GET
path: /admin/approvals/{approvalId}
auth: bearer
requestType: GetApprovalRequest
responseType: ApprovalDetail
```

---

#### 3.4.3. 승인 실행

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

---

#### 3.4.4. 승인 반려

- **Method/Path**: `POST /admin/approvals/{approvalId}/reject`
- **Auth**: bearer

```@codegen
id: webApproval.reject
resource: webApproval
method: POST
path: /admin/approvals/{approvalId}/reject
auth: bearer
requestType: RejectApprovalRequest
responseType: ApprovalDetail
```

### 3.5. 월별 지급 대상자 관리

#### 3.5.1. 월별 지급 대상자 목록 조회

- **Method/Path**: `GET /admin/monthly-payees`
- **Auth**: bearer

```@codegen
id: webMonthlyPayee.list
resource: webMonthlyPayee
method: GET
path: /admin/monthly-payees
auth: bearer
requestType: ListMonthlyPayeesRequest
responseType: MonthlyPayeeList
```

Query:
| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| year | number (optional) | 연도 필터 |
| month | number (optional) | 월 필터 |
| coinType | CoinType (optional) | 코인 필터 |
| status | MonthlyPayeeStatus (optional) | 상태 필터 |
| department | string (optional) | 부서(조직) |
| name | string (optional) | 이름 검색(부분일치) |
| keyword | string (optional) | 통합 검색(사번/이메일 등) |
| page | number (optional) | 페이지(1-base) |
| size | number (optional) | 페이지 크기 |

- Response: `MonthlyPayeeList`

#### 3.5.2. 월별 지급 대상자 등록/수정

- **Method/Path**: `POST /admin/monthly-payees/{id}`
- **Auth**: bearer

```@codegen
id: webMonthlyPayee.upsert
resource: webMonthlyPayee
method: POST
path: /admin/monthly-payees/{id}
auth: bearer
requestType: UpsertMonthlyPayeeRequest
responseType: MonthlyPayee
```

- Path Param: `id`
- Response: `MonthlyPayee`

#### 3.5.3. 월별 지급 대상자 단건 삭제

- **Method/Path**: `DELETE /admin/monthly-payees/{id}`
- **Auth**: bearer

```@codegen
id: webMonthlyPayee.delete
resource: webMonthlyPayee
method: DELETE
path: /admin/monthly-payees/{id}
auth: bearer
requestType: DeleteMonthlyPayeeRequest
responseType: DeleteMonthlyPayeeResponse
```

- Path Param: `id`
- Response: `DeleteMonthlyPayeeResponse`

#### 3.5.4. 월별 지급 대상자 일괄 삭제

- **Method/Path**: `PUT /admin/monthly-payees/bulk-delete`
- **Auth**: bearer

```@codegen
id: webMonthlyPayee.bulkDelete
resource: webMonthlyPayee
method: PUT
path: /admin/monthly-payees/bulk-delete
auth: bearer
requestType: BulkDeleteMonthlyPayeesRequest
responseType: BulkDeleteMonthlyPayeesResponse
```

#### 3.5.5. 월별 지급 계획 확정

- **Method/Path**: `DELETE /admin/monthly-payees/{year}-{month}/confirm`
- **Auth**: bearer

```@codegen
id: webMonthlyPayee.confirm
resource: webMonthlyPayee
method: DELETE
path: /admin/monthly-payees/{year}-{month}/confirm
auth: bearer
requestType: ConfirmMonthlyPayeesRequest
responseType: ConfirmMonthlyPayeesResponse
```

---

#### 3.5.6. 월별 지급 파일 내보내기

- **Method/Path**: `GET /admin/monthly-payees/export?year=YYYY&month=MM&coinType=...`
- CSV/XLSX로 내보내기 (UI에서 다운로드)

```@codegen
id: webMonthlyPayee.export
resource: webMonthlyPayee
method: GET
path: /admin/monthly-payees/export
auth: bearer
requestType: ExportMonthlyPayeesRequest
responseType: ExportMonthlyPayeesResponse
```

Note: 다운로드 응답 형식(스트림 vs URL vs base64)은 구현 단계에서 확정하며, 확정 시 `ExportMonthlyPayeesResponse`를 이에 맞게 갱신합니다.

### 3.6. 거래 이력 조회

> UI 요구사항: `docs/design/ui/admin/web-tx-history.md`

- **Method/Path**: `GET /admin/transactions`

```@codegen
id: webTxHistory.list
resource: webTxHistory
method: GET
path: /admin/transactions
auth: bearer
requestType: ListTransactionsRequest
responseType: TransactionListResponse
```

---

### 3.7. 재무회계결산 관리

UI 문서에는 화면/탭 구성이 정의되어 있으나, API 계약은 백엔드 확정이 필요합니다.

- 탭 A: 재무회계분개(결산대상: 발행/소각 승인내역)
- 탭 B: 결산보고서(요약 + 준비금/발행부채 포함)

## 4. 문서 유지보수 메모

1. UI/QA에서 화면 플로우를 변경하면 **UI 문서 → 모델 문서 → API 문서** 순으로 갱신한다.
2. Codegen 테스트 시 `codegen/` 에서 `npm run docs:lint` 로 본 문서의 `@codegen` 블록을 검증한다.
3. 새로운 관리자 리소스가 추가되면 파일명을 `web-*.md` 규칙에 맞춰 확장한다.
