# SSOT (Single Source of Truth) for Admin Web

## Purpose
This document is the navigation + priority rule for all design/docs used to build the Admin Web.

## Document Priority (when conflict happens)
1) API contract (endpoints, request/response, error codes)
2) Data model / DTO contract (fields, types, constraints)
3) UI/UX standards (layout, components, behavior)
4) Implementation details (code examples, past screens)

## Primary References
- UI Standard: `docs/GODIS_화면표준화개발가이드_v1.0.md`
- Web UI Guide: `docs/웹UI및설계가이드(관리자용).md`
- Admin API + Data Model: `docs/api_및_데이터모델_명세서_관리자용.md`
- Admin Screen List: `docs/관리자화면 목록 정리.md`

## Output Rules
- All admin screens must be created under `screens/`
- Use standard components/patterns defined by the UI Standard document
- Do not invent fields/endpoints: if missing, mark as TODO and request spec update

## Change Log
- yyyy-mm-dd: created
