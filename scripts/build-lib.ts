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
import * as os from "node:os";
import { download, ensureDir, log, run, SRC_URL, tarPath, vendorDir, vendorRoot } from "./_lib.js";

ensureDir(vendorRoot);

// function download(url: string, dest: string) {
//   return new Promise<void>((resolve, reject) => {
//     if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
//       log(`Using existing tarball: ${dest}`);
//       return resolve();
//     }
//     log(`Downloading ${url} ...`);
//     const file = fs.createWriteStream(dest);
//     const client = url.startsWith("https:") ? https : http;
//     client.get(url, res => {
//       const status = res.statusCode ?? 0;
//       if (status >= 300 && status < 400 && res.headers.location) {
//         file.close(); fs.unlinkSync(dest);
//         return download(res.headers.location, dest).then(resolve, reject);
//       }
//       if (status !== 200) {
//         file.close(); try { fs.unlinkSync(dest); } catch {}
//         return reject(new Error(`HTTP ${status}`));
//       }
//       res.pipe(file);
//       file.on("finish", () => file.close(() => resolve()));
//     }).on("error", err => {
//       try { file.close(); } catch {}
//       try { fs.unlinkSync(dest); } catch {}
//       reject(err);
//     });
//   });
// }

(async function main() {
  try {
    await download("build-lib", SRC_URL, tarPath);
    log("build-lib", `Extracting ${tarPath} ...`);
    run("build-lib", "tar", ["-xzf", tarPath, "-C", vendorRoot], process.cwd());
    const extracted = fs.readdirSync(vendorRoot).find(d => /Morfeusz/.test(d) && fs.existsSync(path.join(vendorRoot, d, "CMakeLists.txt")));
    const buildSrc = extracted ? path.join(vendorRoot, extracted) : null;
    if (!buildSrc) throw new Error("CMakeLists.txt not found in source tree");
    ensureDir(vendorDir);
    const buildDir = path.join(buildSrc, "build");
    ensureDir(buildDir);
    // Configure with CMake and install into vendorDir
    run("build-lib", "cmake", [
      "-DCMAKE_BUILD_TYPE=Release",
      `-DCMAKE_INSTALL_PREFIX=${vendorDir}`,
      "-DSKIP_TESTING=1",
      "-DSKIP_JAVA=1",
      "-DSKIP_PYTHON=1",
      "-DSKIP_SWIG=1",
      ".."
    ], buildDir);
    let installSucceeded = true;
    try {
      run("build-lib", "cmake", ["--build", ".", "--config", "Release", "--target", "install", "--", `-j${Math.max(1, os.cpus()?.length || 1)}`], buildDir);
    } catch {
      installSucceeded = false;
      log("build-lib", "Install target failed; attempting salvage of core artifacts.");
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
    log("build-lib", `Core library ready in ${vendorDir}${installSucceeded ? '' : ' (partial install without wrappers)'}`);
    // Hint for node-gyp consumers
    process.env.MORFEUSZ_PREFIX = vendorDir;
  } catch (e) {
    log("build-lib", `Failed: ${(e as Error).message}`);
    process.exit(1);
  }
})();
