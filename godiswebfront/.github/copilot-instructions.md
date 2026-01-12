---

# 🧠 Copilot Instructions – GODIS Admin Web (v1.0)

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

1. **Design / SSOT documents**

   * `docs/기본설계문서`
   * `docs/design`
2. **Frontend API contracts**

   * `src/api/*.jsx`
3. Existing codebase patterns in this repository
4. Implementation details

### Rules

* ❌ Do NOT generate features, fields, or APIs that are not defined in the design documents
* If an existing API contract exists in `src/api`, **it is the absolute source of truth**
* If a requirement is unclear or missing:

  * ❌ Do NOT implement
  * ✅ Update the SSOT documents first

Copilot must **never guess**.

---

## 3. Design Document Locations

```
docs/
 ├ 기본설계문서/                ← Original SSOT
 └ design/                      ← Web-specific refined design
    ├ api/
    │   └ web-admin.md
    ├ model/
    │   ├ web-admin.md
    │   ├ web-common-types.md
    │   └ web-error-codes.md
    └ ui/admin/
        ├ web-admin-console.md
        ├ web-approval.md
        ├ web-coin-dist.md
        ├ web-dashboard.md
        ├ web-monthly-plan.md
        ├ web-tx-history.md
        └ web-wallet-mgmt.md
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

### 5.2 File Naming Rules (STRICT)

#### Screen

```
STOCOIN{NN}S1.jsx
```

#### Popup

```
STOCOIN{NN}P1.jsx
```

Rules:

* `STOCOIN`: fixed prefix
* `{NN}`: two-digit sequential number (increment only)
* `S1`: Screen
* `P1`: Popup
* One screen per file
* ❌ Descriptive filenames are forbidden
* ❌ `.tsx` is forbidden
* ❌ Arbitrary prefixes or suffixes are forbidden

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
* ❌ Implement based on assumptions or guesses

---

## 9. Final Principle

> **Design is the executable contract.**
> Copilot is an implementation tool,
> **not a decision maker.**

---