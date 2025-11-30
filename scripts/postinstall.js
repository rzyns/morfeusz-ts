#!/usr/bin/env node
// Postinstall dictionary availability helper for morfeusz-ts (JS version).
// Converts previous TypeScript implementation to plain JS to avoid Node 24
// ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING when executed under node_modules.
// Behavior: detect existing dictionaries, optionally download if URL provided.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function log(msg) {
  console.log(`[morfeusz-ts dict setup] ${msg}`);
}

if (process.env.MORFEUSZ_SKIP_DICT_DOWNLOAD) {
  log('Skipping dictionary download (MORFEUSZ_SKIP_DICT_DOWNLOAD set).');
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dictDir = process.env.MORFEUSZ_DICT_DIR || path.join(__dirname, '..', 'dictionaries');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch { /* ignore */ }
}
ensureDir(dictDir);

try {
  const existing = fs.readdirSync(dictDir).filter(f => !f.startsWith('.'));
  if (existing.length > 0) {
    log(`Dictionary directory not empty (${existing.length} items); leaving as-is.`);
    process.exit(0);
  }
} catch { /* continue */ }

function hasRealLib() {
  const ld = spawnSync('ldconfig', ['-p'], { encoding: 'utf8' });
  if (ld.status === 0 && /libmorfeusz2\.so/.test(ld.stdout)) return true;
  const candidates = [
    '/usr/lib/libmorfeusz2.so',
    '/usr/local/lib/libmorfeusz2.so'
  ];
  return candidates.some(p => fs.existsSync(p));
}

if (hasRealLib()) {
  log('Detected libmorfeusz2; expecting system dictionaries accessible via library defaults.');
} else {
  log('Did NOT detect libmorfeusz2; may be using stub build or non-standard install path.');
}

const url = process.env.MORFEUSZ_SGJP_URL;
if (!url) {
  log('No MORFEUSZ_SGJP_URL provided; skipping automatic dictionary download.');
  log('Set MORFEUSZ_SGJP_URL to enable downloading during install.');
  log(`Target dictionary directory: ${dictDir}`);
  process.exit(0);
}

const archiveName = process.env.MORFEUSZ_SGJP_ARCHIVE_NAME || 'sgjp-dict.tar.gz';
const archivePath = path.join(dictDir, archiveName);

function download(url, dest, cb) {
  log(`Starting download: ${url}`);
  const file = fs.createWriteStream(dest);
  https.get(url, res => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      file.close();
      try { fs.unlinkSync(dest); } catch { /* */ }
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      file.close();
      try { fs.unlinkSync(dest); } catch { /* */ }
      return cb(new Error(`Unexpected status code ${res.statusCode}`));
    }
    res.pipe(file);
    file.on('finish', () => file.close(() => cb(null)));
  }).on('error', err => {
    try { file.close(); } catch { /* */ }
    try { fs.unlinkSync(dest); } catch { /* */ }
    cb(err);
  });
}

download(url, archivePath, err => {
  if (err) {
    log(`Download failed: ${err.message}`);
    log('Installation continues; please supply dictionaries manually.');
    return;
  }
  log(`Downloaded archive to ${archivePath}`);
  log('Extract the archive contents into the same directory if needed.');
  log('Example (tar.gz):');
  log(`  tar -xzf ${archivePath} -C ${dictDir}`);
});
