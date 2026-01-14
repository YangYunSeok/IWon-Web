---
name: GODIS Admin Web Instructions
description: SSOT-first instructions for GODIS Admin Web (React + Spring Boot + MyBatis)
applyTo: "**/*"
---

# 🧠 Copilot Instructions – GODIS Admin Web (v1.1)

## 1. Scope (NON-NEGOTIABLE)

This instruction file applies **ONLY** to this repository:

**GODIS Admin Web (React + Spring Boot + MyBatis)**

* Frontend: React (JSX)
* Backend: Spring Boot (Java) + MyBatis
* ❌ Mobile App, React Native, App.tsx, or Navigation rules do NOT exist in this repository

Copilot must **ignore any mobile or app-related guidance** found elsewhere.

---

## 2. Source of Truth (SSOT → Code)

Copilot must treat documents and existing contracts as **executable agreements**.

### Priority Order (STRICT)

1. **SSOT hub + design documents**

   * `docs/design/_index.md` (SSOT rules & document map)
   * API contract: `docs/design/api/*`
   * Model meaning: `docs/design/model/*`
   * UI behavior: `docs/design/ui/*`
2. Existing codebase patterns in this repository
3. Implementation details

Legacy docs are reference-only unless explicitly requested:

* `docs/기본설계문서/*`

### Rules

* ❌ Do NOT generate features, fields, or APIs that are not defined in the design documents
* `src/api/*.jsx` is implementation code (derived). If it conflicts with `docs/design/api/*`, update to match SSOT or update SSOT first (never guess).
* If a requirement is unclear or missing:

  * ❌ Do NOT implement
  * ✅ Update the SSOT documents first

Copilot must **never guess**.

---

## 3. Design Document Locations

```
docs/
 ├ 기본설계문서/                ← Legacy (reference-only)
 └ design/                      ← Web SSOT (api/model/ui)
    ├ api/
    │   └ web-admin.md
    ├ model/
    │   ├ web-admin.md
    │   ├ web-common-types.md
    │   └ web-error-codes.md
   └ ui/
      ├ _screen-map.md
      └ admin/
         ├ web-approval.md
         ├ web-coin-dist.md
         ├ web-dashboard.md
         ├ web-financial-closing.md
         ├ web-monthly-plan.md
         ├ web-tx-history.md
         └ web-wallet-mgmt.md

See also:

* `docs/기본설계문서/3.설계문서_이관(리팩토링)_실무_가이드.md`
```

---

## 4. Primary UI Standard (MANDATORY)

UI implementation must follow:

* `docs/GODIS_화면표준화개발가이드_v1.1.md`

### Allowed UI Components (ONLY)

* `GPageContainer`
* `GSearchHeader`
* `GDataGrid`
* `GLayoutGroup`
* `GLayoutItem`
* `GButton`

❌ Do NOT introduce arbitrary UI frameworks
❌ Do NOT create components not defined in SSOT

---

## 5. Frontend Rules (React Admin Web)

### 5.1 Screen Location (FIXED)

```
src/screens/IWon/
```

Rules:

* All Admin screens **must** be created under this path
* ❌ Do NOT create screens under `pages/` or any other directory

---

### 5.2 Screen File Names (SSOT)

Screen file names are specified by SSOT. Do NOT invent naming rules or auto-increment numbers.

* Use the exact filename from `docs/design/ui/_screen-map.md`
* If a new screen is required, update SSOT first (screen-map + UI doc), then implement

---

### 5.3 Frontend Screen Structure (FIXED GODIS PATTERN)

Default layout (**MANDATORY**):

1. **Search / Filter**

   * `GSearchHeader`
2. **Main List**

   * `GDataGrid`
3. **Detail / Form**

   * `GLayoutGroup`
   * `GLayoutItem`
4. **Actions**

   * `GButton`

#### State Naming Conventions

* Search conditions: `searchParams`
* Grid rows: `rows`
* Selected row: `selectedRow`
* Popup open/close state: **local state only**

---

### 5.4 Design Doc File Naming (Docs)

When creating new docs under `docs/design/**`, prefix the filename with `web-`.

Allowed exceptions (fixed hub files):

* `docs/design/_index.md`
* `docs/design/ui/_screen-map.md`

---

## 6. Backend Rules (Spring Boot + MyBatis)

### 6.1 Package Structure (MANDATORY)

```
src/main/java/com/godisweb/
 ├ controller/
 ├ service/
 ├ mapper/
 └ dto/
```

### 6.2 Mapper XML Location

```
src/main/resources/mapper/**/*.xml
```

---

### 6.3 Development Order (NON-NEGOTIABLE)

1. Controller

   * Routing
   * Request validation
   * Response wrapping
2. Service

   * Business logic
   * Transaction boundaries
3. Mapper (Java Interface)

   * Database access signatures
4. Mapper.xml

   * SQL
   * Dynamic queries
   * Query optimization

#### Forbidden

* ❌ SQL inside Controller or Service
* ❌ Annotation-based SQL
* ❌ Direct DB access from Controller

---

## 7. Output Quality Gate (MANDATORY)

### 7.1 One Screen = One API Set

For each screen, Copilot must identify and propose:

* list
* detail
* create / update / delete (if required by SSOT)

If not defined:

* ❌ Do NOT implement
* ✅ Update SSOT first

---

### 7.2 Frontend Output Requirements

Frontend output **MUST include**:

* Screen component
* Required child components
* API module usage (or reference to an existing API contract)

Copilot MUST explicitly state **BEFORE generating code**:

* File path
* File name

---

### 7.3 Backend Output Requirements

Backend output **MUST include all of the following**:

* Controller
* Service
* Mapper interface
* Mapper.xml

Partial output is ❌ forbidden.

---

## 8. Absolute Prohibitions

* ❌ Generate Mobile / App-related code
* ❌ Change screen file paths
* ❌ Rename screen files arbitrarily
* ❌ Generate APIs, fields, or UI not defined in SSOT
* ❌ Modify existing `src/api` files without explicit instruction

---

## 9. Doc Role Boundaries (MUST FOLLOW)

Do not mix responsibilities between documents.

* API docs (`docs/design/api/*`): machine-friendly contract only (method/path/auth, request/response, status/error, pagination, `@codegen` blocks)
* Model docs (`docs/design/model/*`): meaning/rules (field meaning, enums, invariants, state semantics)
* UI docs (`docs/design/ui/*`): behavior/UX (when to call which API, loading/error/empty states, server value → UI label mapping)

If one section contains multiple responsibilities, split it.

---

## 10. Codegen / Docs Validation

After editing `docs/design/api/*`:

* Lint docs: `cd godiswebfront/codegen && npm run docs:lint`
* (Optional) Manifest: `cd godiswebfront/codegen && npm run docs:manifest`

Outputs:

* `godiswebfront/validate-docs-report.json`
* `godiswebfront/codegen/out/api-manifest.json`

---

## 11. Minimal Templates (Few-shot)

### 11.1 API endpoint (docs/design/api/*)

```@codegen
id: webResource.operation
resource: webResource
method: GET
path: /admin/example
auth: bearer
requestType: ExampleRequest
responseType: ExampleResponse
```

### 11.2 Model entity (docs/design/model/*)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| status | SomeStatus | 상태 의미를 사람이 이해할 수 있게 정의 |

### 11.3 UI screen (docs/design/ui/*)

* 화면 진입 시: `GET ...` 호출
* 로딩: Skeleton
* 빈 상태: “조회된 데이터가 없습니다”
* 실패: 에러 토스트 + 재시도
* ❌ Implement based on assumptions or guesses

---

## 9. Final Principle

> **Design is the executable contract.**
> Copilot is an implementation tool,
> **not a decision maker.**

---