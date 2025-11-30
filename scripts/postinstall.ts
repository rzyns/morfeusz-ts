#!/usr/bin/env node
/**
 * Postinstall dictionary availability helper for morfeusz-ts.
 *
 * Goals:
 * 1. Detect whether a real libmorfeusz2 is present (vs stub build).
 * 2. Ensure a dictionary directory exists (user/system provided or downloaded).
 * 3. Offer opt-out and environment variable overrides without failing install.
 *
 * Environment variables:
 * - MORFEUSZ_SKIP_DICT_DOWNLOAD=1  -> Skip all download attempts.
 * - MORFEUSZ_DICT_DIR=<path>       -> Where dictionaries should reside / be created.
 * - MORFEUSZ_SGJP_URL=<url>        -> Override download URL for SGJP dictionary bundle.
 * - MORFEUSZ_SGJP_ARCHIVE_NAME=<filename> -> Name for saved archive (default sgjp-dict.tar.gz).
 *
 * NOTE: The official SGJP dictionary distribution may change URLs or formats.
 *       By default we DO NOT auto-download without an explicit URL because of
 *       licensing / reproducibility concerns. Provide MORFEUSZ_SGJP_URL to enable.
 */
import "jiti/register";
import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import { spawnSync } from "node:child_process";

function log(msg: string) {
  console.log(`[morfeusz-ts dict setup] ${msg}`);
}

if (process.env.MORFEUSZ_SKIP_DICT_DOWNLOAD) {
  log('Skipping dictionary download (MORFEUSZ_SKIP_DICT_DOWNLOAD set).');
  process.exit(0);
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Determine dictionary target directory
const dictDir = process.env.MORFEUSZ_DICT_DIR || path.join(__dirname, '..', 'dictionaries');

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }); } catch { /**/ }
}

ensureDir(dictDir);

// Basic heuristic: if directory already contains files, assume dictionaries present.
try {
  const existing = fs.readdirSync(dictDir).filter(f => !f.startsWith('.'));
  if (existing.length > 0) {
    log(`Dictionary directory not empty (${existing.length} items); leaving as-is.`);
    process.exit(0);
  }
} catch {
  // Will try to proceed; directory creation attempted above.
}

// Detect presence of real libmorfeusz2 (optional informational).
function hasRealLib() {
  // Try ldconfig (Linux). Non-fatal if unavailable.
  const ld = spawnSync('ldconfig', ['-p'], { encoding: 'utf8' });
  if (ld.status === 0 && /libmorfeusz2\.so/.test(ld.stdout)) return true;
  // Fallback heuristic: common library paths.
  const candidates = [
    '/usr/lib/libmorfeusz2.so',
    '/usr/local/lib/libmorfeusz2.so'
  ];
  return candidates.some(p => fs.existsSync(p));
}

if (hasRealLib()) {
  log('Detected libmorfeusz2; expecting system dictionaries to be accessible via library defaults.');
} else {
  log('Did NOT detect libmorfeusz2 via ldconfig; may be using stub build or library installed in a non-standard path.');
}

// Download logic only proceeds if a URL is explicitly provided.
const url = process.env.MORFEUSZ_SGJP_URL;
if (!url) {
  log('No MORFEUSZ_SGJP_URL provided; skipping automatic dictionary download.');
  log('To enable: set MORFEUSZ_SGJP_URL to the SGJP dictionary archive URL and reinstall.');
  log(`Target directory (can override via MORFEUSZ_DICT_DIR): ${dictDir}`);
  process.exit(0);
}

const archiveName = process.env.MORFEUSZ_SGJP_ARCHIVE_NAME || 'sgjp-dict.tar.gz';
const archivePath = path.join(dictDir, archiveName);

function download(url: string, dest: string, cb: (err?: unknown | null) => void) {
  log(`Starting download: ${url}`);
  const file = fs.createWriteStream(dest);
  https.get(url, res => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // Handle redirects
      file.close();
      fs.unlinkSync(dest);
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      file.close();
      fs.unlinkSync(dest);
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

// Perform download
download(url, archivePath, err => {
  if (err) {
    log(`Download failed: ${(err as Error).message}`);
    log('Installation will continue; please supply dictionaries manually.');
    return;
  }
  log(`Downloaded archive to ${archivePath}`);
  // Extraction left to user because archive format may vary (zip/tar). Provide hint.
  log('Please extract the archive contents into the same directory if not already in raw form.');
  log('Example (if tar.gz):');
  log(`  tar -xzf ${archivePath} -C ${dictDir}`);
});
