#!/usr/bin/env node
/**
 * Build libmorfeusz2 from source into a local vendor prefix.
 * - Downloads source tarball from official URL
 * - Extracts into vendor/morfeusz2-src
 * - Runs configure with prefix vendor/morfeusz2
 * - Builds and installs into vendor/morfeusz2
 * - Exposes MORFEUSZ_PREFIX env var for binding.gyp to consume
 *
 * Hard-fails on errors to avoid stub fallback.
 */
import "jiti/register";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as https from "node:https";
import * as http from "node:http";
import { spawnSync } from "node:child_process";

const SRC_URL = process.env.MORFEUSZ_SRC_URL || "http://download.sgjp.pl/morfeusz/20251116/morfeusz-src-20251116.tar.gz";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.join(__dirname, "..", "vendor", "morfeusz2");
const srcDir = path.join(__dirname, "..", "vendor", "morfeusz2-src");
const tarPath = path.join(__dirname, "..", "vendor", path.basename(SRC_URL));

function log(msg: string) { console.log(`[build-lib] ${msg}`); }
function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

ensureDir(path.join(__dirname, "..", "vendor"));

function download(url: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      log(`Using existing tarball: ${dest}`);
      return resolve();
    }
    log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https:") ? https : http;
    client.get(url, res => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (status !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        return reject(new Error(`HTTP ${status}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    }).on("error", err => {
      try { file.close(); } catch {}
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

function run(cmd: string, args: string[], cwd: string) {
  log(`$ ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}

(async function main() {
  try {
    await download(SRC_URL, tarPath);
    // Extract tarball
    ensureDir(srcDir);
    log(`Extracting ${tarPath} ...`);
    run("tar", ["-xzf", tarPath, "-C", path.join(__dirname, "..", "vendor")], process.cwd());
    // Find extracted top-level directory (morfeusz-*/)
    const vendorRoot = path.join(__dirname, "..", "vendor");
    const extracted = fs.readdirSync(vendorRoot).find(d => /morfeusz[-_]?src|morfeusz[-_]?\d+/.test(d) && fs.existsSync(path.join(vendorRoot, d, "configure")));
    const buildSrc = extracted ? path.join(vendorRoot, extracted) : srcDir;
    if (!fs.existsSync(path.join(buildSrc, "configure"))) throw new Error("configure script not found in source tree");
    ensureDir(vendorDir);
    // Configure, make, make install
    run("bash", ["-c", `./configure --prefix='${vendorDir}'`], buildSrc);
    run("make", ["-j", String(Math.max(1, require("os").cpus()?.length || 1))], buildSrc);
    run("make", ["install"], buildSrc);
    // Verify outputs
    const hdrOk = fs.existsSync(path.join(vendorDir, "include", "morfeusz2.h"));
    const libCandidates = [
      path.join(vendorDir, "lib", "libmorfeusz2.so"),
      path.join(vendorDir, "lib", "libmorfeusz2.a"),
    ];
    const libOk = libCandidates.some(p => fs.existsSync(p));
    if (!hdrOk || !libOk) throw new Error("Morfeusz2 build produced no header or library");
    log(`Built libmorfeusz2 into ${vendorDir}`);
    // Emit hint for node-gyp
    process.env.MORFEUSZ_PREFIX = vendorDir;
  } catch (e) {
    log(`Failed: ${(e as Error).message}`);
    process.exit(1);
  }
})();
