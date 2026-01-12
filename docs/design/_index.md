# Docs SSOT 허브 (_index)

본 프로젝트의 설계 문서는 **물리적으로 분리하되**, **논리적으로 하나의 SSOT(Single Source Of Truth)** 를 유지합니다.

문서 이동/분리는 의미 변경이 아니라 “책임 경계 정리”를 목적으로 합니다.

## SSOT 우선순위

1. API 계약: `docs/design/api/*`
2. 모델 의미/공통 규약: `docs/design/model/*`
3. UI 동작/UX: `docs/design/ui/*`
4. 충돌 시 우선순위는 위 순서를 따릅니다.

## Codegen 규칙

- Codegen 입력은 `docs/design/api/*` 만 사용합니다.
- `docs/design/model/*` 은 의미/규칙 참조용입니다.
- `docs/design/ui/*` 는 프론트 구현/QA 기준입니다.

## 문서 맵

### API
- docs/design/api/web-admin.md (관리자 웹 API: 신규 이관)

### Model
- docs/design/model/web-common-types.md
- docs/design/model/web-error-codes.md
- docs/design/model/web-admin.md

### UI
- docs/design/ui/admin/web-admin-console.md
- docs/design/ui/admin/web-dashboard.md
- docs/design/ui/admin/web-wallet-mgmt.md
- docs/design/ui/admin/web-coin-dist.md
- docs/design/ui/admin/web-tx-history.md
- docs/design/ui/admin/web-approval.md
- docs/design/ui/admin/web-monthly-plan.md
