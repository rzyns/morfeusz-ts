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
import "jiti/register";
import * as fs from "node:fs";
import * as path from "node:path";
import { dictDir, DICTS, download, ensureDir, extract } from "./_lib.js";
import { log } from "node:console";

(async function main() {
  ensureDir(dictDir);

  for (const dict of DICTS) {
    const archivePath = path.join(dictDir, dict.archive);
    try {
      await download("morfeusz-ts setup", dict.url, archivePath);
      extract("morfeusz-ts setup", archivePath, dictDir);
      // Check required files
      const present = dict.requiredFiles.filter(f => fs.existsSync(path.join(dictDir, f)));
      if (present.length === 0) {
        log(`Missing files after extraction for ${dict.name}. Expected one of: ${dict.requiredFiles.join(', ')}`);
        log(`Please check the archive and extract manually if needed.`);
        process.exit(1);
      }
      log(`${dict.name} dictionary ready (found: ${present.join(', ')}).`);
    } catch (e) {
      log(`Failed to set up ${dict.name}: ${(e as Error).message}`);
      log(`You may need to download and extract ${dict.url} manually into ${dictDir}`);
      process.exit(1);
    }
  }
  log('All dictionaries are present.');
})();
