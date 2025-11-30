# morfeusz-ts: AI Coding Agent Guide

This repo provides TypeScript bindings for the Morfeusz 2 Polish morphological analyzer via a Node-API (C++) native addon. The JS/TS surface mirrors the Morfeusz C++ API but with stronger TypeScript types and branded IDs.

## Architecture & Key Components
- **Native addon**: `native/morfeusz_wrapper.cpp` exposes Morfeusz via Node-API; built with `node-gyp`. Exports factory methods and an object instance with analysis/generation and configuration calls.
- **TS wrapper**: `src/index.ts` loads the native module using `bindings('morfeusz2')`, wraps native types to branded TS IDs, and exposes:
  - `MorfeuszFactory` static: `getVersion()`, `getDefaultDictName()`, `getCopyright()`, `createInstance(...)`.
  - `Morfeusz` instance: `analyse`, `generate`, `generateWithTag`, getters/setters for `Charset`, `CaseHandling`, `TokenNumbering`, `WhitespaceHandling`, plus `getIdResolver()`.
  - `MorphUtils`: `isIgn()` (unknown), `isWhitespace()` predicates tied to `tagId` 0 and 1.
- **Types**: `src/types.ts` defines branded IDs (`TagId`, `NameId`, `LabelsId`, `NodeIndex`) and enums. Branded types are numbers at runtime; treat as opaque IDs in TS.
- **Headers**: `include/morfeusz2.h` reflects the native API surface expected by the addon.

## Build, Test, and Debug
- **Node version**: `engines.node >= 18`. Use a modern Node.
- **Dependencies**: Requires `libmorfeusz2` available at build/run time for real analysis. The repo may include a stub; see `STUB_IMPLEMENTATION.md` and `README.md` for production notes.
- **Build commands** (run from repo root):
  - `pnpm run build:native` → builds the C++ addon via `node-gyp rebuild`.
  - `pnpm run build:ts` → compiles TS to `dist/` using `tsc`.
  - `pnpm run build` → runs both native and TS builds.
  - `pnpm run clean` → removes `build/` and `dist/`.
- **Run tests**: `pnpm test` executes `test/test.js` using Node against the built addon. Keep tests minimal and focus on API behavior (DAG results, resolver correctness).
- **Debugging tips**:
  - Native addon outputs are JavaScript objects created in `MorphInterpToJS` with resolved `tag`, `name`, `labels` via `IdResolver` — check this when validating results.
  - Most native methods wrap exceptions with `Napi::Error`. Inspect thrown messages when calls fail (e.g., invalid tag/labels).

## Conventions & Patterns
- **Branded IDs**: `TagId`, `NameId`, `LabelsId`, `NodeIndex` are branded numbers. Do not construct by casting arbitrary numbers; obtain via `IdResolver` (`getTagId`, `getNameId`, `getLabelsId`).
- **Predicates**: Use `MorphUtils.isIgn` and `MorphUtils.isWhitespace` for fast checks tied to well-known IDs (0 = `ign`, 1 = `sp`).
- **Result structure**: `analyse()` returns a flat list of `MorphInterpretation` edges forming a DAG over implicit nodes (`startNode`, `endNode`). Clients build paths themselves.
- **Thread safety**: Morfeusz instances are not thread-safe; use separate instances per concurrent task.
- **Factory over direct constructors**: Always create analyzers via `MorfeuszFactory.createInstance(dictName?, usage?)`. The native module has global constructor refs — avoid manual instantiation.

## Integration Points
- **Native binding identifier**: The addon is loaded via `bindings('morfeusz2')`. Ensure the compiled binary name matches `morfeusz2.node` under `build/Release/`.
- **IdResolver**: Access via `morfeusz.getIdResolver()` to translate IDs ↔ strings and to query counts (`getTagsCount`, `getNamesCount`, `getLabelsCount`).
- **Enums mapping**: TS enums map to native integer codes; pass them directly to setters (e.g., `setCharset(Charset.UTF8)`).

## Common Workflows Examples
- **Basic analysis**:
  ```ts
  import MorfeuszFactory, { WhitespaceHandling, MorphUtils } from 'morfeusz-ts';
  const m = MorfeuszFactory.createInstance();
  m.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
  const results = m.analyse('Ala ma kota');
  const tokens = results.filter(r => !MorphUtils.isWhitespace(r));
  ```
- **Tag-driven generation**:
  ```ts
  const m = MorfeuszFactory.createInstance();
  const res = m.getIdResolver();
  const nounTag = res.getTagId('subst:sg:nom:m3');
  const forms = m.generateWithTag('dom', nounTag);
  ```
- **Dictionary selection & usage mode**:
  ```ts
  import { MorfeuszUsage } from 'morfeusz-ts';
  const m = MorfeuszFactory.createInstance('morfeusz-sgjp', MorfeuszUsage.ANALYSE_ONLY);
  ```

## Gotchas & Edge Cases
- `generate()` and `generateWithTag()` expect lemmas without whitespace; invalid inputs throw.
- Label operations: `getLabels()` returns a set in TS; in native, it’s converted from `std::set<string>`.
- Build failures often indicate missing `libmorfeusz2` headers/libs. On Ubuntu: `sudo apt-get install libmorfeusz2-dev`.

## Files to Reference
- `src/index.ts` and `src/types.ts` for the TS API surface and enums.
- `native/morfeusz_wrapper.cpp` for the Node-API shape and error behavior.
- `README.md` for end-user examples and constraints.
- `test/test.js` for runnable usage during development.

---
Questions or gaps? Tell us which parts feel unclear (e.g., real vs. stub behavior, dictionary setup, or DAG traversal patterns), and we’ll refine these instructions. 
