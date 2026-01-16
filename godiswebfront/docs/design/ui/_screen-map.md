# 화면 매핑표 (Web Admin)

> 목적: UI 설계 문서(기능명) ↔ 실제 구현 식별자(라우트/권한/소스경로) ↔ API 리소스를 **한 장**으로 매핑합니다.
> 
> SSOT 우선순위:
> - API 계약: `docs/design/api/*`
> - UI 동작/UX: `docs/design/ui/*`
> - 본 문서는 **연결(매핑)** 용도이며, 계약(스키마)은 API/Model 문서를 따릅니다.

## Web Admin 화면 매핑 (초안)

| 화면키 | 화면명 | 파일명 | 메뉴키 | 라우트 | 권한키 | UI 문서 | API 리소스 | 소스경로 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| web-dashboard | 대시보드 | IWONCOIN01S1.jsx | Dashboard | /admin/dashboard | ROLE_ADMIN_VIEWER | docs/design/ui/admin/web-dashboard.md | IWONCOIN01S1 | src/screens/IWon/IWONCOIN01S1.jsx |
| web-wallet-mgmt | 임직원 지갑 관리 | IWONCOIN02S1.jsx | WalletMgmt | /admin/wallet-mgmt | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-wallet-mgmt.md | webWallet | src/screens/IWon/IWONCOIN02S1.jsx |
| web-coin-dist | 코인 지급 관리 | IWONCOIN03S1.jsx | CoinDist | /admin/coin-dist | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-coin-dist.md | webMint, webBurn | src/screens/IWon/IWONCOIN03S1.jsx |
| web-tx-history | 거래 이력 조회 | IWONCOIN04S1.jsx | TxHistory | /admin/tx-history | ROLE_ADMIN_VIEWER | docs/design/ui/admin/web-tx-history.md | webTxHistory | TBD |
| web-approval | 승인 관리 | IWONCOIN05S1.jsx | Approval | /admin/approval | ROLE_ADMIN_APPROVER | docs/design/ui/admin/web-approval.md | webApproval | src/screens/IWon/IWONCOIN05S1.jsx |
| web-monthly-plan | 월별 지급 대상자 관리 | IWONCOIN06S1.jsx | MonthlyPlan | /admin/monthly-plan | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-monthly-plan.md | webMonthlyPayee | TBD |
| web-financial-closing | 재무회계결산 관리 | IWONCOIN07S1.jsx | FinancialClosing | /admin/financial-closing | ROLE_ADMIN_APPROVER | docs/design/ui/admin/web-financial-closing.md | TBD | TBD |

## 화면ID(파일명) 기준 개발 규칙 (권장)

> 목적: 새 화면을 만들 때 **프론트/백엔드 파일 구조를 화면ID(programId)로 고정**해서
> 찾기 쉽고, SSOT(@codegen)와 구현이 1:1로 따라가도록 합니다.

### 1) 이름/경로 규칙

- 화면ID(programId): 예) `IWONCOIN01S1`
- 백엔드 기본ID(baseId): 예) `IWONCOIN01` (권장: programId에서 `S1` 같은 suffix 제거)
- 프론트 화면 파일:
  - `godiswebfront/src/screens/<시스템>/IWONCOIN01S1.jsx`
- 프론트 API 모듈(권장):
  - `godiswebfront/src/api/IWONCOIN01S1Api.jsx`
- 백엔드(baseId 기준 4종 세트):
  - Controller: `godiswebserver/src/main/java/com/godisweb/controller/<시스템>/IWONCOIN01Controller.java`
  - Service: `godiswebserver/src/main/java/com/godisweb/service/<시스템>/IWONCOIN01Service.java`
  - Mapper: `godiswebserver/src/main/java/com/godisweb/mapper/<시스템>/IWONCOIN01Mapper.java`
  - Mapper XML: `godiswebserver/src/main/resources/mapper/<시스템>/IWONCOIN01Mapper.xml`

추가 규칙(SSOT):

- **Web Admin 화면이라도, IWon 도메인(IWONCOINxx 계열) 화면의 백엔드 소스는 `<시스템>=iwon` 패키지로 정렬**합니다.
  - 예: `com.godisweb.controller.iwon.IWONCOIN02S1Controller`
  - `com.godisweb.controller.admin/*`는 메뉴/권한/운영 관리 등 “관리자 공통” 성격의 API에 사용합니다.

### 2) API 라우팅 규칙

- Controller base path는 아래 형태를 권장합니다.
  - `/api/<시스템>/<screenIdLower>`
  - 예) `/api/iwon/iwoncoin01s1`

예외(SSOT):

- Admin Web의 일부 리소스는 `/api/admin/*` 형태로 제공될 수 있습니다. (예: 임직원 지갑 관리 `GET /api/admin/employees`)
- `docs/design/api/web-admin.md`의 `@codegen`에는 `/api`를 제외한 경로를 기록합니다.
  - 예) `path: /iwon/iwoncoin01s1/supply`

### 3) 응답 타입 규칙 (DTO 없이 Map 사용 가능)

- Java 구현이 `Map<String,Object>`를 반환해도 됩니다.
- 단, JSON 키는 SSOT의 `responseType`(모델 문서)에 정의된 **필드명(camelCase)** 을 반드시 맞춥니다.
  - (예: `checkedAt`, `newWalletCount`)
  - Mapper XML에서 `AS checkedAt`로 alias를 맞추거나, Service에서 키를 정규화합니다.

## 갱신 체크리스트

- 새 화면이 추가되면:
  1) 화면ID(programId) 확정 (예: `IWONCOIN08S1`)
  1-1) 백엔드 기본ID(baseId) 확정 (예: `IWONCOIN08`)
  2) UI 문서 작성: `docs/design/ui/admin/<화면설계문서>.md`
  3) 프론트 구현 생성
    - 화면: `src/screens/<시스템>/<programId>.jsx`
    - (권장) API 모듈: `src/api/<programId>Api.jsx`
  4) 백엔드 구현 생성(baseId 기준 4종 세트)
    - Controller: `godiswebserver/src/main/java/com/godisweb/controller/<시스템>/<baseId>Controller.java`
    - Service: `godiswebserver/src/main/java/com/godisweb/service/<시스템>/<baseId>Service.java`
    - Mapper: `godiswebserver/src/main/java/com/godisweb/mapper/<시스템>/<baseId>Mapper.java`
    - Mapper XML: `godiswebserver/src/main/resources/mapper/<시스템>/<baseId>Mapper.xml`
  5) API SSOT 반영: `docs/design/api/web-admin.md`
    - 각 엔드포인트마다 `@codegen` 블록 1개 추가
    - `resource`는 (screen-aligned인 경우) `programId`와 동일하게 권장
  6) 본 매핑 표 갱신
    - `파일명/라우트/API 리소스/소스경로`를 실제 구현과 일치시킴
  7) 문서 검증/출력 갱신
    - `npm run codegen:validate`
    - `npm run codegen:manifest`

- API 리소스가 TBD인 화면은:
  - UI 문서에 API 참조가 명확한지 확인
  - `docs/design/api/web-admin.md`에 실제 엔드포인트(+ `@codegen`)가 존재하는지 확인

### `@codegen` 블록 빠른 예시(복붙용)

```@codegen
id: IWONCOIN08S1.list
resource: IWONCOIN08S1
method: GET
path: /iwon/iwoncoin08s1/list
auth: bearer
requestType: ListSomethingRequest
responseType: ListSomethingResponse
```
