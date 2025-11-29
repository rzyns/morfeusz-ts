# morfeusz-ts
\n+![CI](https://github.com/rzyns/morfeusz-ts/actions/workflows/ci.yml/badge.svg)
![Publish](https://github.com/rzyns/morfeusz-ts/actions/workflows/publish.yml/badge.svg)
\n+## Install (GitHub Packages)
This package is published to GitHub Packages under the scope `@rzyns`.
\n+1) Authenticate npm to GitHub Packages (one-time per environment):
\n+Create or update your `~/.npmrc` with:
\n+```
@rzyns:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
\n+For local installs, replace `${GITHUB_TOKEN}` with a Classic or Fine-grained token that has `read:packages` permission.
\n+2) Install:
\n+```bash
npm install @rzyns/morfeusz-ts
```
\n+## CI
The repository uses GitHub Actions to build and test on Ubuntu, macOS, and Windows with Node 24.x. CI runs on pushes and pull requests to `development`. Artifacts include the built native addon `build/Release/morfeusz2.node` for debugging.
\n+## Publishing
Publishing is automated on a version tag push matching `v*` (e.g., `v0.1.1`). The workflow verifies `package.json` version equals the tag and publishes to GitHub Packages.
\n+Release flow:
\n+```bash
# bump package.json version and create tag
npm version patch

# push code and tags
git push --follow-tags
```
\n+## Requirements
- Node.js >= 24 (per `engines`)
- Native addon builds with `node-gyp`. Real analysis requires `libmorfeusz2` at build/run time; see `docs/STUB_IMPLEMENTATION.md` and `docs/README.md` notes.
\n+## Dictionaries and Postinstall
This repo includes dictionaries under `dictionaries/`. The `postinstall` and `setup-dicts` scripts prepare local usage; CI runs `npm ci` and builds before tests.


TypeScript bindings for Morfeusz 2 - Polish morphological analyzer

## Overview

This package provides high-fidelity TypeScript bindings for [Morfeusz 2](http://morfeusz.sgjp.pl/), a morphological analyzer for Polish. The types are carefully crafted to match the actual behavior of the library, using type-level programming to ensure correctness beyond what the C++ types provide.

## Features

- **Type-safe API**: Rich TypeScript types with branded types for IDs
- **Complete API coverage**: All Morfeusz 2 features exposed
- **High fidelity**: Types accurately reflect library behavior
- **Native performance**: Direct bindings to libmorfeusz2

## Prerequisites

**Note:** This package currently includes a stub implementation for development purposes. For production use with actual morphological analysis, you'll need to install the real libmorfeusz2 library and update the build configuration. See [STUB_IMPLEMENTATION.md](STUB_IMPLEMENTATION.md) for details.

Before installing for production use, you need to have libmorfeusz2 installed on your system:

### Ubuntu/Debian
```bash
sudo apt-get install libmorfeusz2-dev
```

### macOS (using Homebrew)
```bash
# You may need to download and install from source
# See http://morfeusz.sgjp.pl/download/en
```

### From source
Download from [http://morfeusz.sgjp.pl/download/en](http://morfeusz.sgjp.pl/download/en)

## Installation

```bash
npm install morfeusz-ts
```

## Usage

### Basic Analysis

```typescript
import MorfeuszFactory, { 
  MorphInterpretation,
  WhitespaceHandling 
} from 'morfeusz-ts';

// Create a Morfeusz instance
const morfeusz = MorfeuszFactory.createInstance();

// Configure options
morfeusz.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);

// Analyze Polish text
const results = morfeusz.analyse('Ala ma kota');

// Process results
results.forEach((interp: MorphInterpretation) => {
  console.log({
    orth: interp.orth,      // Original form
    lemma: interp.lemma,    // Base form
    tag: interp.tag,        // Morphological tag
    startNode: interp.startNode,
    endNode: interp.endNode
  });
});
```

### Advanced Features

```typescript
import MorfeuszFactory, {
  Charset,
  CaseHandling,
  TokenNumbering,
  MorfeuszUsage
} from 'morfeusz-ts';

// Create instance with specific dictionary and usage mode
const morfeusz = MorfeuszFactory.createInstance(
  'morfeusz-sgjp',
  MorfeuszUsage.ANALYSE_ONLY
);

// Configure various options
morfeusz.setCharset(Charset.UTF8);
morfeusz.setCaseHandling(CaseHandling.STRICTLY_CASE_SENSITIVE);
morfeusz.setTokenNumbering(TokenNumbering.CONTINUOUS_NUMBERING);
morfeusz.setPraet('composite');
morfeusz.setAggl('permissive');

// Get dictionary information
console.log('Dictionary ID:', morfeusz.getDictID());
console.log('Dictionary Copyright:', morfeusz.getDictCopyright());

// Analyze text
const results = morfeusz.analyse('Poszedłem do sklepu');

// Access the IdResolver for tag manipulation
const resolver = morfeusz.getIdResolver();
console.log('Total tags:', resolver.getTagsCount());
console.log('Total named entities:', resolver.getNamesCount());
```

### Morphological Generation

```typescript
import MorfeuszFactory from 'morfeusz-ts';

const morfeusz = MorfeuszFactory.createInstance();

// Generate all forms of a lemma
const forms = morfeusz.generate('dom');
forms.forEach(form => {
  console.log(`${form.orth} (${form.tag})`);
});

// Generate forms with specific tag
const resolver = morfeusz.getIdResolver();
const nounTagId = resolver.getTagId('subst:sg:nom:m3');
const specificForms = morfeusz.generateWithTag('dom', nounTagId);
```

### Working with the DAG Structure

The analysis results form a Directed Acyclic Graph (DAG) where:
- **Nodes** represent positions in the text (points between segments)
- **Edges** represent morphological interpretations

```typescript
import MorfeuszFactory, { MorphUtils } from 'morfeusz-ts';

const morfeusz = MorfeuszFactory.createInstance();
const results = morfeusz.analyse('zostałem');

// Filter out whitespace interpretations
const nonWhitespace = results.filter(
  interp => !MorphUtils.isWhitespace(interp)
);

// Find unknown words
const unknownWords = results.filter(
  interp => MorphUtils.isIgn(interp)
);

// Build paths through the graph
const paths: MorphInterpretation[][] = [];
function buildPaths(
  currentPath: MorphInterpretation[], 
  currentNode: number
) {
  const continuations = results.filter(
    r => r.startNode === currentNode
  );
  
  if (continuations.length === 0) {
    paths.push(currentPath);
    return;
  }
  
  for (const cont of continuations) {
    buildPaths([...currentPath, cont], cont.endNode);
  }
}

buildPaths([], 0);
console.log(`Found ${paths.length} possible interpretations`);
```

### Version Information

```typescript
import MorfeuszFactory from 'morfeusz-ts';

console.log('Morfeusz version:', MorfeuszFactory.getVersion());
console.log('Copyright:', MorfeuszFactory.getCopyright());
console.log('Default dictionary:', MorfeuszFactory.getDefaultDictName());
```

## Dictionaries & Installation Strategy

Morfeusz requires dictionary data (e.g. SGJP) accessible to the native library. This package aims to be flexible and not silently download large external resources without user intent.

### Where Dictionaries Come From
1. **System packages (preferred)**: On Debian/Ubuntu, installing `libmorfeusz2-dev` (or related runtime package) typically places dictionaries where the library can find them.
2. **Manual download**: From the official site: http://morfeusz.sgjp.pl/download/en
3. **Automated (opt-in)**: A `postinstall` script checks for an empty dictionary directory and will attempt a download *only if* you provide an explicit URL via an environment variable.

### Postinstall Behavior
The script at `scripts/postinstall.js` runs after `npm install`:
- Detects presence of `libmorfeusz2` via `ldconfig` (Linux heuristic).
- Ensures a dictionary directory (default: `dictionaries/` inside the package) exists.
- Skips auto-download unless `MORFEUSZ_SGJP_URL` is set.
- If a download occurs, saves the archive and prints extraction instructions; it does **not** fail the install on network errors.

### Environment Variables
- `MORFEUSZ_SKIP_DICT_DOWNLOAD=1` — Disable any download logic.
- `MORFEUSZ_DICT_DIR=/custom/path` — Override target dictionary directory.
- `MORFEUSZ_SGJP_URL=https://example/sgjp-dict.tar.gz` — Enable and specify archive download URL.
- `MORFEUSZ_SGJP_ARCHIVE_NAME=my-sgjp.tar.gz` — Override saved filename.

### Recommended Production Setup
Install the official library and dictionaries via your OS package manager when available. Use the environment variables only for CI or controlled deployments where you manage artifact URLs and checksums.

### Verifying Availability
After install/build:
```bash
node -e "const f=require('morfeusz-ts');console.log(f.getDefaultDictName())"
```
If you are still seeing a stub default (e.g. `stub-dict`) you are linking against the stub implementation instead of the real library.

### Security & Reproducibility Notes
- No implicit network calls: you must opt in.
- Consider pinning a checksum (CI step) for downloaded archives.
- Avoid committing large dictionary data to VCS; keep in artifacts/cache.

See `STUB_IMPLEMENTATION.md` for details on substituting real library behavior.

## API Documentation

### Types

#### MorphInterpretation
Represents a single morphological interpretation (an edge in the analysis DAG):
- `startNode: NodeIndex` - Start position in text
- `endNode: NodeIndex` - End position in text
- `orth: string` - Orthographic form (as it appears)
- `lemma: string` - Base form
- `tagId: TagId` - Morphological tag ID
- `nameId: NameId` - Named entity type ID
- `labelsId: LabelsId` - Labels combination ID
- `tag: string` - Morphological tag (resolved)
- `name: string` - Named entity type (resolved)
- `labels: string` - Labels (resolved)

#### Enums
- `Charset`: UTF8, ISO8859_2, CP1250, CP852
- `TokenNumbering`: SEPARATE_NUMBERING, CONTINUOUS_NUMBERING
- `CaseHandling`: CONDITIONALLY_CASE_SENSITIVE, STRICTLY_CASE_SENSITIVE, IGNORE_CASE
- `WhitespaceHandling`: SKIP_WHITESPACES, APPEND_WHITESPACES, KEEP_WHITESPACES
- `MorfeuszUsage`: ANALYSE_ONLY, GENERATE_ONLY, BOTH_ANALYSE_AND_GENERATE

### Main Interface: Morfeusz

#### Analysis Methods
- `analyse(text: string): MorphInterpretation[]` - Analyze text
- `generate(lemma: string): MorphInterpretation[]` - Generate word forms
- `generateWithTag(lemma: string, tagId: TagId): MorphInterpretation[]` - Generate with specific tag

#### Configuration Methods
- `setCharset(charset: Charset): void`
- `getCharset(): Charset`
- `setAggl(aggl: string): void`
- `getAggl(): string`
- `setPraet(praet: string): void`
- `getPraet(): string`
- `setCaseHandling(handling: CaseHandling): void`
- `getCaseHandling(): CaseHandling`
- `setTokenNumbering(numbering: TokenNumbering): void`
- `getTokenNumbering(): TokenNumbering`
- `setWhitespaceHandling(handling: WhitespaceHandling): void`
- `getWhitespaceHandling(): WhitespaceHandling`

#### Information Methods
- `getDictID(): string`
- `getDictCopyright(): string`
- `getIdResolver(): IdResolver`

### IdResolver Interface
- `getTag(tagId: TagId): string`
- `getTagId(tag: string): TagId`
- `getName(nameId: NameId): string`
- `getNameId(name: string): NameId`
- `getLabelsAsString(labelsId: LabelsId): string`
- `getLabels(labelsId: LabelsId): Set<string>`
- `getLabelsId(labelsStr: string): LabelsId`
- `getTagsCount(): number`
- `getNamesCount(): number`
- `getLabelsCount(): number`

### Static Factory: MorfeuszFactory
- `getVersion(): string`
- `getDefaultDictName(): string`
- `getCopyright(): string`
- `createInstance(usage?: MorfeuszUsage): Morfeusz`
- `createInstance(dictName: string, usage?: MorfeuszUsage): Morfeusz`

## Thread Safety

**Important**: Morfeusz instances are **NOT thread-safe**. Use separate instances for concurrent operations.

## License

BSD-2-Clause (matching Morfeusz 2 license)

## Credits

- Morfeusz 2 by Institute of Computer Science, Polish Academy of Sciences
- This TypeScript binding by the morfeusz-ts contributors

## Links

- [Morfeusz 2 Official Site](http://morfeusz.sgjp.pl/)
- [Morfeusz 2 Documentation](http://download.sgjp.pl/morfeusz/Morfeusz2.pdf)
