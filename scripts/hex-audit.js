#!/usr/bin/env node
/**
 * Phase 13 Plan 03 — hex-audit ratchet.
 *
 * Walks app/, components/, features/ and counts hex color literals
 * (#abc / #abcdef / #abcdef12) INSIDE .tsx files. Writes or compares
 * against hex-baseline.json.
 *
 * Usage:
 *   node scripts/hex-audit.js snapshot   # write hex-baseline.json
 *   node scripts/hex-audit.js check      # exit 1 if current > baseline
 *   node scripts/hex-audit.js count      # print count only
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'features'];
const EXEMPT_FILES = new Set([
  path.join('constants', 'theme.ts'),
  path.join('constants', 'theme-presets.ts'),
  path.join('constants', 'theme-palette.ts'),
  path.join('constants', 'data-colors.ts'),
]);
const BASELINE_PATH = path.join(ROOT, 'hex-baseline.json');
const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      yield full;
    }
  }
}

function countHex() {
  let total = 0;
  const perFile = {};
  for (const scan of SCAN_DIRS) {
    const base = path.join(ROOT, scan);
    if (!fs.existsSync(base)) continue;
    for (const file of walk(base)) {
      const rel = path.relative(ROOT, file);
      if (EXEMPT_FILES.has(rel)) continue;
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(HEX_REGEX) || [];
      if (matches.length > 0) {
        perFile[rel] = matches.length;
        total += matches.length;
      }
    }
  }
  return { total, perFile };
}

function main() {
  const mode = process.argv[2] || 'count';
  const { total, perFile } = countHex();

  if (mode === 'count') {
    console.log(total);
    return 0;
  }

  if (mode === 'snapshot') {
    const snapshot = {
      baseline_count: total,
      snapshot_iso: new Date().toISOString(),
      top_offenders: Object.entries(perFile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([file, n]) => ({ file, count: n })),
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(`Wrote baseline: ${total} hex occurrences across ${Object.keys(perFile).length} files.`);
    return 0;
  }

  if (mode === 'check') {
    if (!fs.existsSync(BASELINE_PATH)) {
      console.error('ERROR: hex-baseline.json not found. Run `node scripts/hex-audit.js snapshot` first.');
      return 2;
    }
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    if (total > baseline.baseline_count) {
      console.error(`REGRESSION: ${total} hex occurrences (baseline: ${baseline.baseline_count}). New hex added somewhere.`);
      return 1;
    }
    console.log(`OK: ${total} / ${baseline.baseline_count} (baseline).`);
    return 0;
  }

  console.error(`Unknown mode: ${mode}. Use snapshot | check | count.`);
  return 2;
}

process.exit(main());
