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
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as https from "node:https";
import * as http from "node:http";
import { spawnSync } from "node:child_process";
import * as os from "node:os";

const SRC_URL = process.env.MORFEUSZ_SRC_URL || "http://download.sgjp.pl/morfeusz/20251116/morfeusz-src-20251116.tar.gz";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorRoot = path.join(__dirname, "..", "vendor");
const vendorDir = path.join(vendorRoot, "morfeusz2");
const tarPath = path.join(vendorRoot, path.basename(SRC_URL));

function log(msg: string) { console.log(`[build-lib] ${msg}`); }
function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

ensureDir(vendorRoot);

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
    log(`Extracting ${tarPath} ...`);
    run("tar", ["-xzf", tarPath, "-C", vendorRoot], process.cwd());
    const extracted = fs.readdirSync(vendorRoot).find(d => /Morfeusz/.test(d) && fs.existsSync(path.join(vendorRoot, d, "CMakeLists.txt")));
    const buildSrc = extracted ? path.join(vendorRoot, extracted) : null;
    if (!buildSrc) throw new Error("CMakeLists.txt not found in source tree");
    ensureDir(vendorDir);
    const buildDir = path.join(buildSrc, "build");
    ensureDir(buildDir);
    // Configure with CMake and install into vendorDir
    run("cmake", [
      "-DCMAKE_BUILD_TYPE=Release",
      `-DCMAKE_INSTALL_PREFIX=${vendorDir}`,
      "-DSKIP_TESTING=1",
      "-DSKIP_JAVA=1",
      "-DSKIP_PYTHON=1",
      ".."
    ], buildDir);
    let installSucceeded = true;
    try {
      run("cmake", ["--build", ".", "--config", "Release", "--target", "install", "--", `-j${Math.max(1, os.cpus()?.length || 1)}`], buildDir);
    } catch {
      installSucceeded = false;
      log("Install target failed; attempting salvage of core artifacts.");
    }
    // Salvage library and header from build tree if install failed
    const builtSo = path.join(buildDir, "morfeusz", "libmorfeusz2.so");
    const builtA  = path.join(buildDir, "morfeusz", "libmorfeusz2.a");
    ensureDir(path.join(vendorDir, "lib"));
    ensureDir(path.join(vendorDir, "include"));
    if (fs.existsSync(builtSo)) fs.copyFileSync(builtSo, path.join(vendorDir, "lib", "libmorfeusz2.so"));
    if (fs.existsSync(builtA)) fs.copyFileSync(builtA, path.join(vendorDir, "lib", "libmorfeusz2.a"));
    const headerSrc = path.join(buildSrc, "morfeusz", "morfeusz2.h");
    if (fs.existsSync(headerSrc)) fs.copyFileSync(headerSrc, path.join(vendorDir, "include", "morfeusz2.h"));
    const hdrOk = fs.existsSync(path.join(vendorDir, "include", "morfeusz2.h"));
    const libOk = fs.existsSync(path.join(vendorDir, "lib", "libmorfeusz2.so")) || fs.existsSync(path.join(vendorDir, "lib", "libmorfeusz2.a"));
    if (!hdrOk || !libOk) throw new Error("Morfeusz2 build produced no header or library");
    log(`Core library ready in ${vendorDir}${installSucceeded ? '' : ' (partial install without wrappers)'}`);
    // Hint for node-gyp consumers
    process.env.MORFEUSZ_PREFIX = vendorDir;
  } catch (e) {
    log(`Failed: ${(e as Error).message}`);
    process.exit(1);
  }
})();
