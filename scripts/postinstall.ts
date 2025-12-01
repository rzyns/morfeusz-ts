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
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { download, ensureDir, hasRealLib, log, dictDir as defaultDictDir } from "./_lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always build lib from source; hard-fail if missing
try {
  log("postinstall", 'Building libmorfeusz2 from source...');
  const res = spawnSync(process.execPath, [path.join(__dirname, 'build-lib.js')], { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error('libmorfeusz2 build failed');
  }
} catch (e) {
  log("postinstall", `ERROR: ${(e as Error).message}`);
  log("postinstall", 'Installation aborted: libmorfeusz2 must be available.');
  process.exit(1);
}

// if (process.env.MORFEUSZ_SKIP_DICT_DOWNLOAD) {
//   log('Skipping dictionary download (MORFEUSZ_SKIP_DICT_DOWNLOAD set).');
//   process.exit(0);
// }

// Determine dictionary target directory
const dictDir = process.env.MORFEUSZ_DICT_DIR || defaultDictDir;

ensureDir(dictDir);

// Basic heuristic: if directory already contains files, assume dictionaries present.
try {
  const existing = fs.readdirSync(dictDir).filter(f => !f.startsWith('.'));
  if (existing.length > 0) {
    log("postinstall", `Dictionary directory not empty (${existing.length} items); leaving as-is.`);
    process.exit(0);
  }
} catch {
  // Will try to proceed; directory creation attempted above.
}


if (hasRealLib()) {
  log("postinstall", 'Detected libmorfeusz2; expecting system dictionaries accessible via library defaults.');
} else {
  log("postinstall", 'Did NOT detect libmorfeusz2 via ldconfig; library may be in local vendor path.');
}

// Download logic only proceeds if a URL is explicitly provided.
const url = process.env.MORFEUSZ_SGJP_URL;
if (!url) {
  log("postinstall", 'No MORFEUSZ_SGJP_URL provided; skipping automatic dictionary download.');
  log("postinstall", 'Set MORFEUSZ_SGJP_URL to enable downloading during install.');
  log("postinstall", `Target dictionary directory: ${dictDir}`);
  process.exit(0);
}

const archiveName = process.env.MORFEUSZ_SGJP_ARCHIVE_NAME || 'sgjp-dict.tar.gz';
const archivePath = path.join(dictDir, archiveName);

// Perform download
await download("postinstall", url, archivePath).then(
  () => {
    log("postinstall", `Downloaded archive to ${archivePath}`);
    log("postinstall", 'Extract the archive contents into the same directory if needed.');
    log("postinstall", 'Example (tar.gz):');
    log("postinstall", `  tar -xzf ${archivePath} -C ${dictDir}`);
  },
  (err) => {
    if (err) {
      log("postinstall", `Download failed: ${(err as Error).message}`);
    }
    log("postinstall", 'Installation will continue; please supply dictionaries manually.');
  },
);
