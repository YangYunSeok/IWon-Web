---
# ✅ copilot-instructions_v0.2.md
# GODIS Admin Web – Copilot Instructions (Repo-Scoped, Always-On)

## Scope (NON-NEGOTIABLE)
This instruction file applies **ONLY** to this repository:
**GODIS Admin Web (React + Spring Boot + MyBatis)**.

If any other project instructions are found elsewhere,
they are **out of scope** and must be ignored.

---

## Source of Truth (SSOT → Code)
Copilot must treat documents and existing contracts as executable agreements.

Priority order:
1) Design / SSOT documents
2) Frontend API contracts (e.g. src/api/*.jsx)
3) Existing codebase patterns in this repository
4) Implementation details

Copilot must **never guess** unclear requirements.
If a definition is missing or ambiguous, **update the SSOT first**, then implement code.

---

## Primary UI Standard (MUST)
UI implementation must follow:
- `docs/GODIS_화면표준화개발가이드_v1.1.md`

If v1.1 lacks a specific component usage detail,
follow existing GODIS standard patterns in the codebase.

---

## Fixed Technology Stack (MANDATORY)

### Frontend
- React (JSX)
- Use **GODIS shared UI components only**

Examples:
- `GPageContainer`
- `GSearchHeader`
- `GDataGrid`
- `GLayoutGroup`
- `GLayoutItem`
- `GButton`

Do NOT introduce any new UI framework or arbitrary component
unless explicitly allowed by SSOT.

### Backend
- Spring Boot (Java)
- MyBatis
- **All SQL must be written in `Mapper.xml` files**
  - SQL in Java code or annotations is forbidden

### API Style
- REST
- JSON request/response
- Bearer Token authentication

---

## Folder Structure Rules (ENFORCED)

### Backend (Spring Boot)
```

controller/
service/
mapper/
dto/
resources/mapper/**/*.xml

```

### Frontend (React)
```

src/screens/IWon/     // ALL Admin screens MUST be here
src/components/      // reusable components
src/api/             // API modules

```

Rules:
- Admin screen files MUST be created under `src/screens/IWon`
- Do NOT create screen files under `pages/`
- Do NOT create screen files outside `src/screens/IWon`

---

## Frontend Screen File Naming Rules (MANDATORY)

### Screen Files
- Naming format:
```

STOCOIN{NN}S1.jsx

```
- Examples:
- `STOCOIN02S1.jsx`
- `STOCOIN03S1.jsx`

Rules:
- `STOCOIN` is fixed prefix
- `{NN}` is a sequential number (increment only)
- `S1` means **Screen**
- All list/detail admin screens must follow this format
- Do NOT use descriptive filenames for screen components


File naming is STRICT.
The filename MUST be exactly:
- STOCOIN{NN}S1.jsx (screen)
- STOCOIN{NN}P1.jsx (popup)

No suffix, prefix, or alternative extensions are allowed.
(e.g. STOCOIN02S1Screen.jsx, STOCOIN02S1Page.jsx, .tsx are forbidden)


### Popup Files
- Naming format:
```

STOCOIN{NN}P1.jsx

```
- Examples:
- `STOCOIN02P1.jsx`
- `STOCOIN03P1.jsx`

Rules:
- `P1` means **Popup**
- Popup sequence number must align with related screen when applicable

Popup files (P1) must be created ONLY when:
- A separate modal/dialog UI is explicitly required by SSOT
- The popup has its own user interaction lifecycle

Inline detail sections MUST NOT be implemented as popups.


---

## Frontend Screen Structure (Fixed GODIS Pattern)

Default layout (MANDATORY):
- Top: Search / Filter section (`GSearchHeader`)
- Main: Data grid (`GDataGrid`)
- Bottom or Side: Detail / Form (`GLayoutGroup` + `GLayoutItem`)
- Actions: `GButton` (with auth control if required)

State naming conventions:
- Search conditions: `searchParams`
- Grid rows: `rows`
- Selected row: `selectedRow`
- Popup state: local state only

---

## Backend Development Rules
Copilot must never break this order:

1) Controller
 - Routing
 - Request validation
 - Response wrapping
2) Service
 - Business logic
 - Transaction boundaries
3) Mapper (Java Interface)
 - DB access signatures
4) Mapper.xml
 - SQL
 - Dynamic queries
 - Query tuning

Forbidden:
- SQL in Service classes
- Direct DB access in Controllers
- Annotation-based SQL in Mapper interfaces

---

## Output Quality Gate (MANDATORY)

### One Screen = One API Set
For each screen, propose:
- list
- detail
- create/update/delete (as required)

If not defined:
- Update SSOT first
- Then implement

### Frontend Output
Must include:
- Screen component (correct filename & path)
- Required child components
- API module (or reference to existing API SSOT)

When generating frontend code, Copilot MUST explicitly state:
- File path
- File name

This confirmation must appear BEFORE the code output.


### Backend Output
Must include:
- Controller
- Service
- Mapper interface
- Mapper.xml

---

## Absolute Prohibitions
- Do NOT rename screen files arbitrarily
- Do NOT place screens outside `src/screens/IWon`
- Do NOT invent API endpoints when a frontend API contract exists
- Do NOT modify frontend API files unless explicitly requested
```

---