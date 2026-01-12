#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function findCodegenBlocks(markdownText) {
  const blocks = [];
  const regex = /```@codegen\s*([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdownText)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function parseBlock(blockText) {
  const result = {};
  const lines = blockText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result[key] = value;
  }

  return result;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const apiDocsDir = path.join(repoRoot, 'docs', 'design', 'api');
  const outDir = path.join(repoRoot, 'codegen', 'out');
  const outFile = path.join(outDir, 'api-manifest.json');

  const mdFiles = fs
    .readdirSync(apiDocsDir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => path.join(apiDocsDir, f));

  const entries = [];

  for (const filePath of mdFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = findCodegenBlocks(content);

    blocks.forEach((blockText) => {
      const entry = parseBlock(blockText);
      entries.push({
        ...entry,
        sourceFile: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
      });
    });
  }

  ensureDir(outDir);
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2));

  console.log(`Wrote ${entries.length} entries -> ${path.relative(repoRoot, outFile)}`);
}

main();
