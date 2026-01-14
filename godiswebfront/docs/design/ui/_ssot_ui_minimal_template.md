# UI SSOT Minimal Template (v1.0)

> This document defines the **UI SSOT (Single Source of Truth) minimal specification**.
> All Admin Web UI documents **MUST** include the following five sections.

추가 섹션(예: UX 규칙, TODO)을 새로 만들지 않고, 해당 내용은 아래 5개 섹션 중 적절한 위치에 `TBD`/Note 형태로 포함한다.

---

## 1. 목적

- Why this screen exists
- Its role in the overall business or operational flow
- The core problem this screen is responsible for solving

> Principles:
> - Focus on **intent and responsibility boundaries**
> - Avoid listing features mechanically

---

## 2. 레이아웃

- Structural composition of the screen
  - e.g. search/filter area, summary section, table, tabs, detail panel
- For tab-based screens:
  - Clearly describe the responsibility of each tab
- The description should allow a developer to **mentally visualize the screen structure immediately**

> Principles:
> - ❌ Wireframes or design specifications
> - ✅ Structural and information layout description

---

## 3. API 플로우

- API invocation flow based on screen lifecycle and user actions

### 3.1 최초 진입

- APIs called when the screen is first loaded

### 3.2 사용자 액션

- APIs triggered by user actions such as:
  - search
  - filter changes
  - tab switching

### 3.3 추가 플로우

- Optional asynchronous, batch, or post-processing API flows if applicable

> Principles:
> - Focus on **call timing and dependencies**, not endpoint exhaustiveness
> - Use `TBD` for undecided items

---

## 4. 상태 / 에러 / 빈 화면

- Loading states
- Empty states (e.g. zero results)
- Error handling behavior
  - Whether errors are exposed to users
  - Retry or recovery possibilities

> Principles:
> - Detailed UX copy is not required
> - Clearly define **state existence and responsibility**

---

## 5. 권한

- Accessible roles
- Read-only vs actionable permissions
- Separation between operators, approvers, or other roles

> Principles:
> - This section alone should make it clear **who can access this screen and how**

---

## Change Log

| Version | Date | Description |
|--------|------|-------------|
| v1.0 | YYYY-MM-DD | Initial version |
