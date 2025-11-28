#!/usr/bin/env node
/**
 * Setup script for morfeusz-ts: downloads SGJP and Polimorf dictionaries from official sources.
 *
 * - Downloads archives to ./dictionaries/
 * - Extracts them if possible (tar/gz/zip supported)
 * - Verifies presence of key files after extraction
 * - Prints instructions if manual steps are needed
 *
 * This script does NOT host or redistribute dictionary files.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import * as http from "node:http";
import { spawnSync } from "node:child_process";

const DICTS = [
  {
    name: 'SGJP',
    url: 'http://download.sgjp.pl/morfeusz/20251116/morfeusz2-dictionary-sgjp-20251116.tgz',
    archive: 'morfeusz2-dictionary-sgjp-20251116.tgz',
    // Accept either variant file after extraction
    requiredFiles: ['sgjp-a.dict', 'sgjp-s.dict'],
  },
  {
    name: 'Polimorf',
    url: 'http://download.sgjp.pl/morfeusz/20251116/morfeusz2-dictionary-polimorf-20251116.tgz',
    archive: 'morfeusz2-dictionary-polimorf-20251116.tgz',
    requiredFiles: ['polimorf-a.dict', 'polimorf-s.dict'],
  }
];

const dictDir = path.join(__dirname, '..', 'dictionaries');
if (!fs.existsSync(dictDir)) fs.mkdirSync(dictDir, { recursive: true });

function log(msg) { console.log(`[setup-dicts] ${msg}`); }

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      if (stats.size > 0) {
        log(`${dest} already exists (${stats.size} bytes), skipping download.`);
        return resolve();
      } else {
        log(`${dest} exists but is empty, removing and retrying download.`);
        fs.unlinkSync(dest);
      }
    }
    log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https://') ? https : http;
    client.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Redirect
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          // Check file size after download
          const stats = fs.statSync(dest);
          if (stats.size === 0) {
            fs.unlinkSync(dest);
            return reject(new Error(`Downloaded file is empty: ${dest}`));
          }
          resolve();
        });
      });
    }).on('error', err => {
      try { file.close(); } catch (_) {}
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

function extract(archive, outDir) {
  // Support .tgz, .tar.gz, .zip
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
      // Check required files
      const present = dict.requiredFiles.filter(f => fs.existsSync(path.join(dictDir, f)));
      if (present.length === 0) {
        log(`Missing files after extraction for ${dict.name}. Expected one of: ${dict.requiredFiles.join(', ')}`);
        log(`Please check the archive and extract manually if needed.`);
        process.exit(1);
      }
      log(`${dict.name} dictionary ready (found: ${present.join(', ')}).`);
    } catch (e) {
      log(`Failed to set up ${dict.name}: ${e.message}`);
      log(`You may need to download and extract ${dict.url} manually into ${dictDir}`);
      process.exit(1);
    }
  }
  log('All dictionaries are present.');
})();
