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
| web-dashboard | 대시보드 | STOCOIN01S1.jsx | Dashboard | /admin/dashboard | ROLE_ADMIN_VIEWER | docs/design/ui/admin/web-dashboard.md | webDashboard | TBD |
| web-wallet-mgmt | 임직원 지갑 관리 | STOCOIN02S1.jsx | WalletMgmt | /admin/wallet-mgmt | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-wallet-mgmt.md | webWallet | TBD |
| web-coin-dist | 코인 지급 관리 | STOCOIN03S1.jsx | CoinDist | /admin/coin-dist | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-coin-dist.md | webMint, webBurn | TBD |
| web-tx-history | 거래 이력 조회 | STOCOIN04S1.jsx | TxHistory | /admin/tx-history | ROLE_ADMIN_VIEWER | docs/design/ui/admin/web-tx-history.md | webTxHistory | TBD |
| web-approval | 승인 관리 | STOCOIN05S1.jsx | Approval | /admin/approval | ROLE_ADMIN_APPROVER | docs/design/ui/admin/web-approval.md | webApproval | TBD |
| web-monthly-plan | 월별 지급 대상자 관리 | STOCOIN06S1.jsx | MonthlyPlan | /admin/monthly-plan | ROLE_ADMIN_OPERATOR | docs/design/ui/admin/web-monthly-plan.md | webMonthlyPayee | TBD |
| web-financial-closing | 재무회계결산 관리 | STOCOIN07S1.jsx | FinancialClosing | /admin/financial-closing | ROLE_ADMIN_APPROVER | docs/design/ui/admin/web-financial-closing.md | TBD | TBD |

## 갱신 체크리스트

- 새 화면이 추가되면:
  1) UI 문서(`docs/design/ui/admin/*.md`) 작성
  2) API 계약(`docs/design/api/web-admin.md`)에 `@codegen` 블록 추가/갱신
  3) 본 매핑 표에 `screenKey/routePath/srcPath/apiResources`를 연결

- API 리소스가 TBD인 화면은:
  - UI 문서에 API 참조가 명확한지 확인
  - `docs/design/api/web-admin.md`에 실제 엔드포인트(+ `@codegen`)가 존재하는지 확인
