# Docs SSOT Hub (_index)

This project keeps design documents **physically separated**, while maintaining **one logical SSOT (Single Source Of Truth)**.

Moving/splitting documents is not a semantic change—it's for clarifying ownership boundaries.

UI implementation must follow this standard first:

- UI Standard: `docs/GODIS_화면표준화개발가이드_v1.1.md`

## SSOT Priority

1. API contract: `docs/design/api/*`
2. Model meaning / shared conventions: `docs/design/model/*`
3. UI behavior / UX: `docs/design/ui/*`
4. If documents conflict, follow the order above.

> Legacy references (use only when explicitly requested):
> - `docs/기본설계문서/웹UI및설계가이드(관리자용).md`
> - `docs/기본설계문서/api_및_데이터모델_명세서(관리자용).md`
> - `docs/기본설계문서/관리자화면 목록 정리.md`

## Codegen Rules

- Codegen inputs must come **only** from `docs/design/api/*` via `@codegen` blocks.
- `docs/design/model/*` is for meaning/rules (types/enums/errors/DTOs).
- `docs/design/ui/*` is for frontend implementation + QA acceptance criteria (behavior/UX/interactions/error mapping).

### Codegen / Docs Validation

- Lint `@codegen` blocks:
	- `cd godiswebfront/codegen && npm run docs:lint`
- (Optional) Generate a JSON manifest:
	- `cd godiswebfront/codegen && npm run docs:manifest`

Outputs:
- `godiswebfront/validate-docs-report.json`
- `godiswebfront/codegen/out/api-manifest.json`

## Document Map

### API

- `docs/design/api/web-admin.md` (Admin Web API contract + codegen inputs)

### Model

- `docs/design/model/web-admin.md`
- `docs/design/model/web-common-types.md`
- `docs/design/model/web-error-codes.md`

### UI

- `docs/design/ui/admin/web-admin-console.md`
- `docs/design/ui/admin/web-dashboard.md`
- `docs/design/ui/admin/web-wallet-mgmt.md`
- `docs/design/ui/admin/web-coin-dist.md`
- `docs/design/ui/admin/web-tx-history.md`
- `docs/design/ui/admin/web-approval.md`
- `docs/design/ui/admin/web-monthly-plan.md`

## Change Log

- yyyy-mm-dd: created
