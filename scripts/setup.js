#!/usr/bin/env node
// Setup dictionaries (SGJP & Polimorf) - JS version.
// Converted from TypeScript to avoid Node 24 type stripping issues under node_modules.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const DICTS = [
  {
    name: 'SGJP',
    url: 'http://download.sgjp.pl/morfeusz/20251116/morfeusz2-dictionary-sgjp-20251116.tgz',
    archive: 'morfeusz2-dictionary-sgjp-20251116.tgz',
    requiredFiles: ['sgjp-a.dict', 'sgjp-s.dict']
  },
  {
    name: 'Polimorf',
    url: 'http://download.sgjp.pl/morfeusz/20251116/morfeusz2-dictionary-polimorf-20251116.tgz',
    archive: 'morfeusz2-dictionary-polimorf-20251116.tgz',
    requiredFiles: ['polimorf-a.dict', 'polimorf-s.dict']
  }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dictDir = path.join(__dirname, '..', 'dictionaries');
if (!fs.existsSync(dictDir)) fs.mkdirSync(dictDir, { recursive: true });

function log(msg) { console.log(`[setup-dicts] ${msg}`); }

function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      if (stats.size > 0) {
        log(`${dest} already exists (${stats.size} bytes), skipping download.`);
        return resolve();
      } else {
        log(`${dest} exists but is empty; removing and redownloading.`);
        fs.unlinkSync(dest);
      }
    }
    log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https://') ? https : http;
    client.get(url, res => {
      const statusCode = res.statusCode || 0;
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        file.close();
          try { fs.unlinkSync(dest); } catch { /* ignore unlink error */ }
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (statusCode !== 200) {
        file.close();
          try { fs.unlinkSync(dest); } catch { /* ignore unlink error */ }
        return reject(new Error(`HTTP ${statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => {
        const stats = fs.statSync(dest);
        if (stats.size === 0) {
          try { fs.unlinkSync(dest); } catch {}
          return reject(new Error(`Downloaded file is empty: ${dest}`));
        }
        const envKey = dest.includes('sgjp') ? 'MORFEUSZ_SGJP_SHA256' : (dest.includes('polimorf') ? 'MORFEUSZ_POLIMORF_SHA256' : undefined);
        if (envKey && process.env[envKey]) {
          const expected = process.env[envKey].trim().toLowerCase();
          const actual = sha256(dest);
          if (expected !== actual) {
            try { fs.unlinkSync(dest); } catch {}
            return reject(new Error(`Checksum mismatch for ${dest}. Expected ${expected} got ${actual}`));
          }
          log(`Checksum verified (${envKey}).`);
        } else if (process.env.MORFEUSZ_VERIFY_CHECKSUMS === '1') {
          log(`Checksum env var not set for ${dest}; skipping verification.`);
        }
        resolve();
      }));
    }).on('error', err => {
      try { file.close(); } catch {}
        try { fs.unlinkSync(dest); } catch { /* ignore unlink error */ }
      reject(err);
    });
  });
}

function extract(archive, outDir) {
  if (/\.(tar\.gz|tgz)$/.test(archive)) {
    log(`Extracting ${archive} to ${outDir} ...`);
    const res = spawnSync('tar', ['-xzf', archive, '-C', outDir], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error(`Extraction failed for ${archive}`);
    return;
  }
  if (/\.zip$/.test(archive)) {
    log(`Extracting ${archive} to ${outDir}...`);
    const res = spawnSync('unzip', [archive, '-d', outDir], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error(`Extraction failed for ${archive}`);
    return;
  }
  throw new Error(`Unknown archive format: ${archive}`);
}

(async function main() {
  for (const dict of DICTS) {
    const archivePath = path.join(dictDir, dict.archive);
    try {
      await download(dict.url, archivePath);
      extract(archivePath, dictDir);
      const present = dict.requiredFiles.filter(f => fs.existsSync(path.join(dictDir, f)));
      if (present.length === 0) {
        log(`Missing files after extraction for ${dict.name}. Expected one of: ${dict.requiredFiles.join(', ')}`);
        log('Please extract manually if needed.');
        process.exit(1);
      }
      log(`${dict.name} dictionary ready (found: ${present.join(', ')}).`);
    } catch (e) {
      log(`Failed to set up ${dict.name}: ${e.message}`);
      log(`Manual download: ${dict.url} -> ${dictDir}`);
      process.exit(1);
    }
  }
  log('All dictionaries are present.');
})();
