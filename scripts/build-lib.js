#!/usr/bin/env node
// JS version of build-lib to avoid TypeScript execution requirements.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const SRC_URL = process.env.MORFEUSZ_SRC_URL || 'http://download.sgjp.pl/morfeusz/20251116/morfeusz-src-20251116.tar.gz';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vendorDir = path.join(__dirname, '..', 'vendor', 'morfeusz2');
const vendorRoot = path.join(__dirname, '..', 'vendor');
const tarPath = path.join(vendorRoot, path.basename(SRC_URL));

function log(msg) { console.log(`[build-lib] ${msg}`); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

ensureDir(vendorRoot);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      log(`Using existing tarball: ${dest}`);
      return resolve();
    }
    log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https:') ? https : http;
    client.get(url, res => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        file.close(); try { fs.unlinkSync(dest); } catch { /* ignore */ }
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (status !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch { /* ignore */ }
        return reject(new Error(`HTTP ${status}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', err => {
      try { file.close(); } catch { /* ignore */ }
      try { fs.unlinkSync(dest); } catch { /* ignore */ }
      reject(err);
    });
  });
}

function run(cmd, args, cwd) {
  log(`$ ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}

(async function main() {
  try {
    await download(SRC_URL, tarPath);
    log(`Extracting ${tarPath} ...`);
    run('tar', ['-xzf', tarPath, '-C', vendorRoot], process.cwd());
    const extracted = fs.readdirSync(vendorRoot).find(d => /Morfeusz/.test(d) && fs.existsSync(path.join(vendorRoot, d, 'CMakeLists.txt')));
    const buildSrc = extracted ? path.join(vendorRoot, extracted) : null;
    if (!buildSrc) throw new Error('CMakeLists.txt not found in source tree');
    ensureDir(vendorDir);
    const buildDir = path.join(buildSrc, 'build');
    ensureDir(buildDir);
    run('cmake', [
      '-DCMAKE_BUILD_TYPE=Release',
      `-DCMAKE_INSTALL_PREFIX=${vendorDir}`,
      '-DSKIP_TESTING=1',
      '-DSKIP_JAVA=1',
      '-DSKIP_PYTHON=1',
      '..'
    ], buildDir);
    let installSucceeded = true;
    try {
      run('cmake', ['--build', '.', '--config', 'Release', '--target', 'install', '--', `-j${Math.max(1, os.cpus()?.length || 1)}`], buildDir);
    } catch {
      installSucceeded = false;
      log('Install target failed; attempting salvage of core artifacts.');
    }
    // Salvage library from build tree if install failed (wrappers may break due to SWIG)
    const builtSo = path.join(buildDir, 'morfeusz', 'libmorfeusz2.so');
    const builtA  = path.join(buildDir, 'morfeusz', 'libmorfeusz2.a');
    ensureDir(path.join(vendorDir, 'lib'));
    ensureDir(path.join(vendorDir, 'include'));
    if (fs.existsSync(builtSo)) fs.copyFileSync(builtSo, path.join(vendorDir, 'lib', 'libmorfeusz2.so'));
    if (fs.existsSync(builtA)) fs.copyFileSync(builtA, path.join(vendorDir, 'lib', 'libmorfeusz2.a'));
    const headerSrc = path.join(buildSrc, 'morfeusz', 'morfeusz2.h');
    if (fs.existsSync(headerSrc)) fs.copyFileSync(headerSrc, path.join(vendorDir, 'include', 'morfeusz2.h'));
    const hdrOk = fs.existsSync(path.join(vendorDir, 'include', 'morfeusz2.h'));
    const libOk = fs.existsSync(path.join(vendorDir, 'lib', 'libmorfeusz2.so')) || fs.existsSync(path.join(vendorDir, 'lib', 'libmorfeusz2.a'));
    if (!hdrOk || !libOk) throw new Error('Morfeusz2 build produced no header or library');
    log(`Core library ready in ${vendorDir}${installSucceeded ? '' : ' (partial install without wrappers)'}`);
    process.exit(0);
  } catch (e) {
    log(`Failed: ${e.message}`);
    process.exit(1);
  }
})();
