#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dirPath, ent.name);
    if (ent.isDirectory()) {
      files.push(...listMarkdownFiles(full));
      continue;
    }
    if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function findCodegenBlocks(markdownText) {
  // Matches blocks like:
  // ```@codegen
  // key: value
  // ```
  const blocks = [];
  const re = /```@codegen\s*\n([\s\S]*?)\n```/g;
  let match;
  while ((match = re.exec(markdownText)) !== null) {
    blocks.push({
      raw: match[0],
      body: match[1],
      index: match.index,
    });
  }
  return blocks;
}

function parseKeyValueBody(body) {
  const map = {};
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    if (!key) continue;
    map[key] = value;
  }
  return map;
}

function formatLoc(repoRoot, filePath, index, markdownText) {
  // Best-effort line number from character offset.
  const prefix = markdownText.slice(0, index);
  const line = prefix.split(/\r?\n/).length;
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  return `${rel}:${line}`;
}

function validateCodegenBlock(block, ctx) {
  const requiredKeys = ['id', 'resource', 'method', 'path', 'auth', 'requestType', 'responseType'];
  const kv = parseKeyValueBody(block.body);
  const errors = [];
  const warnings = [];

  // 문서에 포함된 "@codegen 포맷 예시"(placeholder) 블록은 검증 대상에서 제외한다.
  const isExample =
    String(kv.id || '').includes('<resource>') ||
    String(kv.resource || '').includes('<resource>') ||
    String(kv.method || '').includes('<HTTP_METHOD>') ||
    String(kv.path || '').includes('</path>') ||
    String(kv.requestType || '').includes('<TypeName>') ||
    String(kv.responseType || '').includes('<TypeName>');

  if (isExample) {
    return {
      kv,
      key: null,
      errors: [],
      warnings: [],
      ignored: true,
      loc: formatLoc(ctx.repoRoot, ctx.filePath, block.index, ctx.text),
    };
  }

  for (const key of requiredKeys) {
    if (!kv[key] || String(kv[key]).trim() === '') {
      errors.push(`missing '${key}'`);
    }
  }

  if (kv.method) {
    const m = String(kv.method).trim().toUpperCase();
    if (!VALID_HTTP_METHODS.has(m)) {
      warnings.push(`unusual method '${kv.method}'`);
    }
    kv.method = m;
  }

  if (kv.path) {
    const p = String(kv.path).trim();
    if (!p.startsWith('/')) {
      errors.push(`path must start with '/' (got '${kv.path}')`);
    }
    kv.path = p;
  }

  if (kv.auth) {
    const a = String(kv.auth).trim();
    if (a !== 'none' && a !== 'bearer') {
      warnings.push(`auth should be 'none' or 'bearer' (got '${kv.auth}')`);
    }
  }

  const key = kv.method && kv.path ? `${kv.method} ${kv.path}` : null;

  return {
    kv,
    key,
    errors,
    warnings,
    ignored: false,
    loc: formatLoc(ctx.repoRoot, ctx.filePath, block.index, ctx.text),
  };
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const docsApiDir = path.join(repoRoot, 'docs', 'design', 'api');
  const files = listMarkdownFiles(docsApiDir);

  const allErrors = [];
  const allWarnings = [];
  const methodPathIndex = new Map(); // key -> [{filePath, loc, id}]
  const issues = [];

  if (files.length === 0) {
    console.log(`[validate-docs] No markdown files found in ${docsApiDir}`);
    fs.writeFileSync(
      path.join(repoRoot, 'validate-docs-report.json'),
      JSON.stringify(
        {
          status: 'pass',
          summary: { filesChecked: 0, endpointsChecked: 0, errors: 0 },
          issues: [],
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  for (const filePath of files) {
    const text = readText(filePath);
    const blocks = findCodegenBlocks(text);

    if (blocks.length === 0) {
      // API 문서에는 @codegen이 있어야 하는데, 공용 안내 문서는 없을 수도 있으니 경고로만 처리
      allWarnings.push(`[${path.relative(repoRoot, filePath).replace(/\\/g, '/')}] no @codegen blocks found`);
      continue;
    }

    for (const block of blocks) {
      const result = validateCodegenBlock(block, { repoRoot, filePath, text });
      const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/');

      for (const e of result.errors) {
        allErrors.push(`[${result.loc}] ${e}`);
        issues.push({
          file: rel,
          endpoint: result.key || '(unknown)',
          message: e,
          loc: result.loc,
        });
      }
      for (const w of result.warnings) {
        allWarnings.push(`[${result.loc}] ${w}`);
      }

      if (result.key) {
        const entry = { filePath: rel, loc: result.loc, id: result.kv.id || '(missing id)' };
        const prev = methodPathIndex.get(result.key) || [];
        prev.push(entry);
        methodPathIndex.set(result.key, prev);
      }
    }
  }

  // Detect duplicates by METHOD+PATH
  for (const [key, entries] of methodPathIndex.entries()) {
    if (entries.length <= 1) continue;
    const lines = entries.map((e) => `${e.loc} (id=${e.id})`).join(' | ');
    allErrors.push(`[duplicate METHOD+PATH] ${key} => ${lines}`);
    issues.push({
      file: '(duplicate)',
      endpoint: key,
      message: `duplicate METHOD+PATH => ${lines}`,
      loc: '(multiple)',
    });
  }

  const totalEndpoints = Array.from(methodPathIndex.values()).reduce((sum, xs) => sum + xs.length, 0);
  const report = {
    status: allErrors.length > 0 ? 'fail' : 'pass',
    summary: {
      filesChecked: files.length,
      endpointsChecked: totalEndpoints,
      errors: allErrors.length,
    },
    issues,
  };
  fs.writeFileSync(path.join(repoRoot, 'validate-docs-report.json'), JSON.stringify(report, null, 2));

  if (allWarnings.length > 0) {
    console.log('[validate-docs] Warnings:');
    for (const w of allWarnings) console.log(`- ${w}`);
  }

  if (allErrors.length > 0) {
    console.error('[validate-docs] Errors:');
    for (const e of allErrors) console.error(`- ${e}`);
    console.error(`[validate-docs] FAILED (files=${files.length}, endpoints~=${totalEndpoints})`);
    process.exit(1);
  }

  console.log(`[validate-docs] OK (files=${files.length}, endpoints~=${totalEndpoints})`);
  process.exit(0);
}

main();
