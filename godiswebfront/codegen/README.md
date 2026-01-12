# codegen

This folder contains small utilities for validating and extracting `@codegen` blocks from SSOT docs.

## Commands

- Validate `@codegen` blocks:
  - `npm run codegen:validate`
- Generate a JSON manifest:
  - `npm run codegen:manifest`

## Outputs

- `codegen/out/api-manifest.json`

> Note: This repo currently uses these tools as a consistency gate (docs ↔ implementation), not as a full code generator.
