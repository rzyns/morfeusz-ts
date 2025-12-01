#!/usr/bin/env node
/**
 * Preinstall: compile-time bootstrap to ensure vendor/morfeusz2 artifacts
 * (headers + library) exist before node-gyp runs during install.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vendorInclude = path.join(__dirname, '..', 'vendor', 'morfeusz2', 'include', 'morfeusz2.h');
const vendorLibSo = path.join(__dirname, '..', 'vendor', 'morfeusz2', 'lib', 'libmorfeusz2.so');
const vendorLibA = path.join(__dirname, '..', 'vendor', 'morfeusz2', 'lib', 'libmorfeusz2.a');

function log(msg: string) { console.log(`[preinstall] ${msg}`); }

const hasHeader = fs.existsSync(vendorInclude);
const hasLib = fs.existsSync(vendorLibSo) || fs.existsSync(vendorLibA);

if (hasHeader && hasLib) {
  log('Vendor artifacts already present; skipping build.');
  process.exit(0);
}

log('Vendor artifacts missing; building libmorfeusz2 from source.');
const res = spawnSync(process.execPath, [path.join(__dirname, 'build-lib.js')], { stdio: 'inherit' });
if (res.status !== 0) {
  log('Build failed; cannot proceed with native addon compile.');
  process.exit(1);
}
log('Vendor build complete.');
