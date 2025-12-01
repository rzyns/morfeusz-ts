import * as https from "node:https";
import * as http from "node:http";
import * as fs from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dictDir: string = path.join(__dirname, '..', 'dictionaries');

export const DICTS = [
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
] as const;

export const SRC_URL: string = process.env.MORFEUSZ_SRC_URL || "http://download.sgjp.pl/morfeusz/20251116/morfeusz-src-20251116.tar.gz";
export const vendorRoot: string = path.join(__dirname, "..", "vendor");
export const vendorDir: string = path.join(vendorRoot, "morfeusz2");
export const tarPath: string = path.join(vendorRoot, path.basename(SRC_URL));

export function log(prefix: string, msg: string): void {
    console.log(`[${prefix}] ${msg}`);
}

export function sha256(filePath: string): string {
  const hash = createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

export function download(prefix: string, url: string, dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      if (stats.size > 0) {
        log(prefix, `${dest} already exists (${stats.size} bytes), skipping download.`);
        return resolve();
      } else {
        log(prefix, `${dest} exists but is empty, removing and retrying download.`);
        fs.unlinkSync(dest);
      }
    }
    log(prefix, `Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https://') ? https : http;
    client.get(url, res => {
      const statusCode = res.statusCode ?? 0;
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        // Redirect
        file.close();
        fs.unlinkSync(dest);
        return download(prefix, res.headers.location, dest).then(resolve, reject);
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
          // Optional checksum verification: if env var MORFEUSZ_<NAME>_SHA256 is set
          const envKey = (() => {
            if (dest.includes('sgjp')) return 'MORFEUSZ_SGJP_SHA256';
            if (dest.includes('polimorf')) return 'MORFEUSZ_POLIMORF_SHA256';
            return undefined;
          })();
          if (envKey && process.env[envKey]) {
            const expected = process.env[envKey]!.trim().toLowerCase();
            const actual = sha256(dest);
            if (expected !== actual) {
              fs.unlinkSync(dest);
              return reject(new Error(`Checksum mismatch for ${dest}. Expected ${expected} got ${actual}`));
            }
            log(prefix, `Checksum verified (${envKey}).`);
          } else if (process.env['MORFEUSZ_VERIFY_CHECKSUMS'] === '1') {
            log(prefix, `Checksum env var not set for ${dest}; skipping verification.`);
          }
          resolve();
        });
      });
    }).on('error', err => {
      try { file.close(); } catch { /* */ }
      try { fs.unlinkSync(dest); } catch { /* */ }
      reject(err);
    });
  });
}

export function extract(prefix: string, archive: string, outDir: string): void {
  // Support .tgz, .tar.gz, .zip
  if (/\.(tar\.gz|tgz)$/.test(archive)) {
    log(prefix, `Extracting ${archive} to ${outDir} ...`);
    const res = spawnSync('tar', ['-xzf', archive, '-C', outDir], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error(`Extraction failed for ${archive}`);
    return;
  }
  if (/\.zip$/.test(archive)) {
    log(prefix, `Extracting ${archive} to ${outDir}...`);
    const res = spawnSync('unzip', [archive, '-d', outDir], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error(`Extraction failed for ${archive}`);
    return;
  }
  throw new Error(`Unknown archive format: ${archive}`);
}

export function run(prefix: string, cmd: string, args: string[], cwd: string): void {
  log(prefix, `$ ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}

export function ensureDir(p: string): void {
    fs.mkdirSync(p, { recursive: true });
}

// Detect presence of real libmorfeusz2 (optional informational).
export function hasRealLib(): boolean {
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
