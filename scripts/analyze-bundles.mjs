#!/usr/bin/env node
/**
 * Lightweight post-build bundle report for Next 16 / Turbopack.
 * Run after `pnpm build`. Does not fail CI — prints baselines for P2 budgets.
 *
 *   node scripts/analyze-bundles.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const chunksDir = path.join(root, '.next', 'static', 'chunks');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function kb(n) {
  return Math.round((n / 1024) * 10) / 10;
}

const files = walk(chunksDir);
if (!files.length) {
  console.error('No .next/static/chunks JS found. Run `pnpm build` first.');
  process.exit(1);
}

const rows = files
  .map((f) => ({ file: path.relative(path.join(root, '.next'), f), bytes: fs.statSync(f).size }))
  .sort((a, b) => b.bytes - a.bytes);

const total = rows.reduce((s, r) => s + r.bytes, 0);
const top = rows.slice(0, 15);
const mid = rows.filter((r) => r.bytes >= 20 * 1024 && r.bytes <= 400 * 1024).slice(0, 20);

const report = {
  generatedAt: new Date().toISOString(),
  jsChunkCount: rows.length,
  totalStaticJsKb: kb(total),
  largestChunks: top.map((r) => ({ kb: kb(r.bytes), file: r.file })),
  midSizeChunks: mid.map((r) => ({ kb: kb(r.bytes), file: r.file })),
  budgetsNote:
    'Budgets are observational. Fail CI only after a measured baseline is agreed. Watch totalStaticJsKb and top chunk growth; avoid re-importing profile modals into critical path.',
  advisoryBudgetsKb: {
    totalStaticJsWarn: 20000,
    largestJsChunkWarn: 9000,
  },
};

const outPath = path.join(root, 'BUNDLE_BASELINE.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('[bundle-analyze]');
console.log(`jsChunkCount=${report.jsChunkCount} totalStaticJsKb=${report.totalStaticJsKb}`);
console.log('top:');
for (const r of report.largestChunks.slice(0, 8)) {
  console.log(`  ${r.kb}KB  ${r.file}`);
}
console.log(`wrote ${outPath}`);
