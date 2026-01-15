# codegen

This folder contains small utilities for validating and extracting `@codegen` blocks from SSOT docs.

## Commands

- Validate `@codegen` blocks:
  - `npm run docs:lint`
- Generate a JSON manifest:
  - `npm run docs:manifest`

## Outputs

- `codegen/out/api-manifest.json`

> Note: This repo currently uses these tools as a consistency gate (docs ↔ implementation), not as a full code generator.

## Naming convention (recommended)

When an API is screen-aligned, use the screen/program ID as the `resource`.

- Example:
  - `resource: IWONCOIN01S1`
  - `id: IWONCOIN01S1.getSupply`
  - `path: /iwon/iwoncoin01s1/supply` (frontend uses `/api` baseURL)

Backend implementation note (this repo convention):
- Frontend/SSOT keeps the programId (e.g. `IWONCOIN01S1`).
- Backend class/file names may omit the scenario suffix (e.g. `IWONCOIN01Controller`, `IWONCOIN01Service`, `IWONCOIN01Mapper`).
