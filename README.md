# morfeusz-ts
![CI](https://github.com/rzyns/morfeusz-ts/actions/workflows/ci.yml/badge.svg)
![Publish](https://github.com/rzyns/morfeusz-ts/actions/workflows/publish.yml/badge.svg)
![Release](https://github.com/rzyns/morfeusz-ts/actions/workflows/release.yml/badge.svg)

## Install (GitHub Packages)
This package is published to GitHub Packages under the scope `@rzyns`.

1) Authenticate npm to GitHub Packages (one-time per environment):

Create or update your `~/.npmrc` with:

```
@rzyns:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

For local installs, replace `${GITHUB_TOKEN}` with a Classic or Fine-grained token that has `read:packages` permission.

2) Install:

```bash
pnpm add @rzyns/morfeusz-ts
```

## Package Management & Corepack

This repository standardizes on **pnpm** with a pinned version via the `packageManager` field (`pnpm@10.24.0`). GitHub Actions now runs `corepack enable` to ensure the declared version is used rather than a pre-installed global.

Summary:
- Pinned version: managed by `packageManager` field (Corepack resolves & installs automatically).
- Install in CI/local: simply `pnpm install` or `pnpm ci`; no need to manually install pnpm.
- Scripts: all `npm run` usages replaced with `pnpm run` for consistency.
- Caching: workflows switched from `cache: 'npm'` to `cache: 'pnpm'` in `actions/setup-node`.

If you upgrade pnpm, change `packageManager` and commit; CI will pick it up automatically.

## Publishing & Tokens

Semantic Release publishes to **GitHub Packages** using `@semantic-release/npm`. Authentication uses `GITHUB_TOKEN` passed both as `GITHUB_TOKEN` (GitHub release, git push) and `NPM_TOKEN` (package publish). This works only for private/scoped publishing to GitHub Packages.

To publish to the public npm registry instead:
1. Remove or modify `publishConfig.registry` (delete it or set to `https://registry.npmjs.org/`).
2. Add a secret (e.g. `NPM_TOKEN`) containing an npm Automation token.
3. Update the semantic-release workflow env: `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}`.

Local developers wanting to install from GitHub Packages must have an access token with `read:packages` permission in their `~/.npmrc` (see above). Do **not** commit real tokens; in CI we rely on ephemeral `GITHUB_TOKEN`.

## CI
GitHub Actions builds and tests on Ubuntu, macOS, and Windows (Node 24.x) for pushes and PRs to `development`. It uploads the built native addon `build/Release/morfeusz2.node` as a debug artifact.

## Legacy Tag-Based Workflows (Disabled)
The earlier `publish.yml` and `release.yml` tag-triggered workflows are retained in a disabled state for reference. They have been converted to pnpm for future reuse, but semantic-release is the authoritative mechanism; do **not** manually tag or run these unless intentionally migrating away from semantic-release.

## Requirements
- Node.js >= 24 (per `engines`)
- Native addon builds with `node-gyp`. Real analysis requires `libmorfeusz2` at build/run time; see `docs/STUB_IMPLEMENTATION.md` and `docs/README.md` notes.
- Internet access during CI dictionary setup (archives cached between runs)

## Dictionaries and Postinstall
The `postinstall` and `setup-dicts` scripts prepare local usage; CI runs `setup-dicts` explicitly and caches the `dictionaries/` directory.

## Changelog
Releases append entries to `CHANGELOG.md`. The release workflow generates a latest-release snippet and embeds it in the Release body while attaching the raw snippet file. Full history lives in `CHANGELOG.md`.

Local generation commands:
```bash
# Update full changelog in-place (semantic commit history required)
pnpm run changelog

# Preview only the upcoming (latest) unreleased section
pnpm run changelog:preview
```

Commit conventions enforced via commitlint (Conventional Commits). Examples:
### Dictionary Checksum Verification
You can enforce archive integrity by providing expected SHA-256 checksums:
```bash
export MORFEUSZ_VERIFY_CHECKSUMS=1
export MORFEUSZ_SGJP_SHA256=<expected hash>
export MORFEUSZ_POLIMORF_SHA256=<expected hash>
pnpm run setup-dicts
```
If `MORFEUSZ_VERIFY_CHECKSUMS=1` is set but a specific checksum variable is missing, verification for that archive is skipped with a warning.

### Semantic Release (Primary Automation)
This repository uses semantic-release as the sole release/publish mechanism. Workflow `semantic-release.yml` now runs only after the `CI` workflow finishes successfully on the `development` branch (via a `workflow_run` trigger) and can also be invoked manually (`workflow_dispatch`). It will:
- Analyze commits (Conventional Commits) to determine next version
- Update `CHANGELOG.md`, bump version, create tag
- Publish to GitHub Packages
- Create GitHub Release with notes and artifacts

Avoid manual `pnpm version`; let semantic-release manage tags and versions. Tag-triggered legacy workflows are disabled to prevent overlap.

Branch protection recommendation: require all CI matrix jobs (e.g. "Build and Test (ubuntu-latest / Node 24.x)", "Build and Test (macos-latest / Node 24.x)", "Build and Test (windows-latest / Node 24.x)") to pass before merging to `development`. With the new gating, semantic-release only runs after CI succeeds, reducing risk of publishing broken artifacts.

## Real Morfeusz2 Library and Dictionary Handling

**This package now always builds and links against the real Morfeusz2 C++ library.** The stub header and fallback logic have been removed. If the library is missing or not built from source, installation will fail.

### Dictionary Search Path Registration
- On module load, the package automatically registers the `dictionaries/` folder as a search path for Morfeusz2 dictionaries.
- You can add additional search paths at runtime using:

```typescript
import MorfeuszFactory from 'morfeusz-ts';
MorfeuszFactory.addDictionarySearchPath('/custom/path/to/dicts');
```

### Default Dictionary Fallback
- If the native library does not report an embedded default dictionary, the package will infer a default from the bundled `.dict` files in `dictionaries/`.
- This ensures that `createInstance()` works out-of-the-box if at least one dictionary is present.

### Hard Failure Policy
- If the real Morfeusz2 library or required dictionaries are missing, the package will throw an error at install or instance creation time. There is no stub fallback.

## Requirements
- Node.js >= 24 (per `engines`)
- Native addon builds with `node-gyp`. Real analysis requires `libmorfeusz2` at build/run time; see `docs/STUB_IMPLEMENTATION.md` and `docs/README.md` notes.
- Internet access during CI dictionary setup (archives cached between runs)

## Dictionaries and Postinstall
The `postinstall` and `setup-dicts` scripts prepare local usage; CI runs `setup-dicts` explicitly and caches the `dictionaries/` directory.

## Changelog
Releases append entries to `CHANGELOG.md`. The release workflow generates a latest-release snippet and embeds it in the Release body while attaching the raw snippet file. Full history lives in `CHANGELOG.md`.

Local generation commands:
```bash
# Update full changelog in-place (semantic commit history required)
pnpm run changelog

# Preview only the upcoming (latest) unreleased section
pnpm run changelog:preview
```

Commit conventions enforced via commitlint (Conventional Commits). Examples:
### Dictionary Checksum Verification
You can enforce archive integrity by providing expected SHA-256 checksums:
```bash
export MORFEUSZ_VERIFY_CHECKSUMS=1
export MORFEUSZ_SGJP_SHA256=<expected hash>
export MORFEUSZ_POLIMORF_SHA256=<expected hash>
pnpm run setup-dicts
```
If `MORFEUSZ_VERIFY_CHECKSUMS=1` is set but a specific checksum variable is missing, verification for that archive is skipped with a warning.

### Semantic Release (Primary Automation)
This repository uses semantic-release as the sole release/publish mechanism. Workflow `semantic-release.yml` now runs only after the `CI` workflow finishes successfully on the `development` branch (via a `workflow_run` trigger) and can also be invoked manually (`workflow_dispatch`). It will:
- Analyze commits (Conventional Commits) to determine next version
- Update `CHANGELOG.md`, bump version, create tag
- Publish to GitHub Packages
- Create GitHub Release with notes and artifacts

Avoid manual `pnpm version`; let semantic-release manage tags and versions. Tag-triggered legacy workflows are disabled to prevent overlap.

Branch protection recommendation: require all CI matrix jobs (e.g. "Build and Test (ubuntu-latest / Node 24.x)", "Build and Test (macos-latest / Node 24.x)", "Build and Test (windows-latest / Node 24.x)") to pass before merging to `development`. With the new gating, semantic-release only runs after CI succeeds, reducing risk of publishing broken artifacts.

## Real Morfeusz2 Library and Dictionary Handling

**This package now always builds and links against the real Morfeusz2 C++ library.** The stub header and fallback logic have been removed. If the library is missing or not built from source, installation will fail.

### Dictionary Search Path Registration
- On module load, the package automatically registers the `dictionaries/` folder as a search path for Morfeusz2 dictionaries.
- You can add additional search paths at runtime using:

```typescript
import MorfeuszFactory from 'morfeusz-ts';
MorfeuszFactory.addDictionarySearchPath('/custom/path/to/dicts');
```

### Default Dictionary Fallback
- If the native library does not report an embedded default dictionary, the package will infer a default from the bundled `.dict` files in `dictionaries/`.
- This ensures that `createInstance()` works out-of-the-box if at least one dictionary is present.

### Hard Failure Policy
- If the real Morfeusz2 library or required dictionaries are missing, the package will throw an error at install or instance creation time. There is no stub fallback.

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
The script at `scripts/postinstall.js` runs after `pnpm install`:
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

### Dictionary Search Path API

You can add custom dictionary search paths at runtime:

```typescript
import MorfeuszFactory from 'morfeusz-ts';
MorfeuszFactory.addDictionarySearchPath('/my/extra/dicts');
```

This is useful if you want to use dictionaries outside the default `dictionaries/` folder or system locations.

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
