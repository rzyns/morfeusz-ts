# Contributing to morfeusz-ts

Thank you for your interest in contributing to morfeusz-ts! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

1. Node.js 24+ and npm (matches `engines.node`)
2. C++ compiler (g++, clang, or MSVC)
3. Python 3.x (for node-gyp)
4. libmorfeusz2-dev (for production builds)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/rzyns/morfeusz-ts.git
cd morfeusz-ts

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

```
morfeusz-ts/
├── src/              # TypeScript source files
│   ├── index.ts      # Main module exports
│   └── types.ts      # Type definitions
├── native/           # C++ binding code
│   └── morfeusz_wrapper.cpp
├── include/          # C++ header files
│   └── morfeusz2.h   # Stub header (for dev/testing)
├── examples/         # Usage examples
├── test/             # Test files
├── dist/             # Compiled TypeScript (generated)
└── build/            # Compiled native module (generated)
```

## Development Workflow

### Building

```bash
# Build everything
npm run build

# Build native module only
npm run build:native

# Build TypeScript only
npm run build:ts

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run tests
npm test

# Test with actual libmorfeusz2 (requires library installed)
# Update binding.gyp first to link against -lmorfeusz2
npm run build:native
npm test
```

### Code Style

- TypeScript: Follow the existing style, strict mode enabled
- C++: Follow modern C++ practices (C++11+)
- Use meaningful variable names
- Add comments for complex logic
- Document public APIs

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Keep changes focused and atomic
- Write clear conventional commit messages (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Ensure everything builds
npm run build

# Run tests
npm test

# Test with examples
node examples/basic-usage.js
```

### 4. Update Documentation

- Update README.md if needed
- Update API.md for API changes
- Add JSDoc comments to new functions
- Update CHANGELOG.md (if exists)

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a Pull Request
- Describe your changes clearly
- Reference any related issues

## Type System Guidelines

morfeusz-ts emphasizes type safety. When adding new features:

### 1. Use Branded Types

For domain-specific IDs:

```typescript
type MyId = Brand<number, 'MyId'>;
```

### 2. Prefer Readonly

Make data structures immutable:

```typescript
interface MyInterface {
  readonly field: string;
}
```

### 3. Use Strict Typing

Avoid `any`:

```typescript
// Bad
function process(data: any): any { }

// Good
function process<T>(data: T): Result<T> { }
```

### 4. Document Complex Types

Add JSDoc comments:

```typescript
/**
 * Represents a morphological interpretation edge in the analysis DAG.
 * 
 * @see MorphInterpretation
 */
type InterpEdge = ...;
```

## Native Code Guidelines

### 1. Memory Management

- Clean up C++ objects properly
- Use RAII patterns
- Be careful with string conversions

```cpp
// Good: automatic cleanup
{
  Morfeusz* m = Morfeusz::createInstance();
  // use m
  delete m;
}

// Better: use wrapper
MorfeuszInstanceWrapper wrapper;
wrapper.SetInstance(Morfeusz::createInstance());
// wrapper destructor handles cleanup
```

### 2. Error Handling

Convert C++ exceptions to JavaScript errors:

```cpp
try {
  morfeusz->analyse(text, results);
} catch (const MorfeuszException& e) {
  Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
  return env.Null();
} catch (const std::exception& e) {
  Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
  return env.Null();
}
```

### 3. Type Conversions

Be explicit about type conversions:

```cpp
// Convert JS number to C++ int
int value = info[0].As<Napi::Number>().Int32Value();

// Convert C++ string to JS string
return Napi::String::New(env, cppString);
```

## Testing Guidelines

### 1. Write Comprehensive Tests

Test both success and failure cases:

```typescript
// Test success
it('should analyze text correctly', () => {
  const results = morfeusz.analyse('test');
  expect(results).toHaveLength(1);
});

// Test error handling
it('should throw on invalid input', () => {
  expect(() => {
    morfeusz.generate('invalid lemma');
  }).toThrow();
});
```

### 2. Test Edge Cases

- Empty strings
- Unicode characters
- Very long inputs
- Invalid parameters

### 3. Test Type Safety

Ensure TypeScript types work as expected:

```typescript
// Should compile
const tagId: TagId = resolver.getTagId('noun');

// Should not compile (commented out)
// const tagId: NameId = resolver.getTagId('noun');
```

## Documentation Guidelines

### 1. README.md

- Keep it concise and practical
- Include quick start examples
- Link to detailed documentation

### 2. API.md

- Document all public APIs
- Include usage examples
- Explain parameters and return types
- Document exceptions

### 3. Code Comments

```typescript
/**
 * Analyzes Polish text for morphological structure.
 * 
 * Returns a DAG where nodes represent positions in text and edges
 * represent possible morphological interpretations.
 * 
 * @param text - Polish text to analyze
 * @returns Array of morphological interpretations
 * @throws {MorfeuszException} If analysis fails
 * 
 * @example
 * ```typescript
 * const results = morfeusz.analyse('Ala ma kota');
 * results.forEach(r => console.log(r.orth, r.lemma));
 * ```
 */
analyse(text: string): ReadonlyArray<MorphInterpretation>;
```

## Performance Guidelines

### 1. Minimize Allocations

```cpp
// Good: reuse vector
std::vector<MorphInterpretation> results;
results.clear();
morfeusz->analyse(text, results);

// Avoid: new vector each time
// auto results = new std::vector<MorphInterpretation>();
```

### 2. Cache Expensive Operations

```typescript
// Cache resolver
const resolver = morfeusz.getIdResolver();
for (const id of ids) {
  const tag = resolver.getTag(id);
}
```

### 3. Profile Before Optimizing

Don't optimize prematurely. Measure first:

```typescript
console.time('analysis');
const results = morfeusz.analyse(text);
console.timeEnd('analysis');
```

## Conventional Commits

Commit messages are enforced via commitlint (both local Husky hook and CI). Format:

```
<type>(optional scope): <short description>
```

Common `type` values:
- `feat`: adds a new feature
- `fix`: bug fix
- `chore`: tooling / maintenance (no production code change)
- `docs`: documentation changes
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding or updating tests
- `ci`: continuous integration changes

Examples:
```
feat(parser): support SGJP tag normalization
fix(windows): correct path handling for dictionaries
chore(ci): add commitlint workflow
docs(contributing): document release process
```

Breaking changes: append `!` after type/scope or include `BREAKING CHANGE:` footer.

## Release & Publish Process

Releases and package publishing are automated via GitHub Actions (`publish.yml` and `release.yml`). Publishing targets GitHub Packages (GPR) under the scope `@rzyns`.

### 1. Choose Version
Follow semantic versioning (MAJOR.MINOR.PATCH). Bump using npm which creates the tag automatically:

```bash
npm version patch   # or minor / major
```

This updates `package.json`, creates a commit and a tag `vX.Y.Z`.

### 2. Push Commit and Tag

```bash
git push --follow-tags
```

The `v*` tag triggers:
- `publish.yml`: installs deps, sets up dictionaries, builds, runs tests, verifies tag matches `package.json` version, publishes to GitHub Packages.
- `release.yml`: builds & tests native addon across Ubuntu, macOS, Windows, uploads `morfeusz2.node` artifacts, creates a GitHub Release with autogenerated notes and attached binaries.

### 3. (Optional) Update CHANGELOG.md
`CHANGELOG.md` can be regenerated from conventional commits:

```bash
npm run changelog           # full history (in-place)
npm run changelog:preview   # latest snippet only
```
The release workflow also injects the latest snippet into the GitHub Release body.

### 4. Verify
- Check Actions logs for all OS build/test success.
- Visit GitHub Packages page to ensure `@rzyns/morfeusz-ts` version appeared.
- Open the GitHub Release to confirm artifacts (`morfeusz2.node`) are attached.

### 5. Consumption
Users install via:
```bash
npm install @rzyns/morfeusz-ts
```
Ensure their `.npmrc` contains the GitHub Packages auth lines documented in `README.md`.

### Notes
- No manual `npm publish` needed; workflows handle publishing.
- If a publish fails (e.g., tests fail), fix the issue, bump to the next patch version, and repeat.
- Avoid force-pushing rewritten tags; instead increment the patch number.
- To test locally before tagging: run `npm ci && npm run setup-dicts && npm test`.
- If using semantic-release (optional automation), do NOT run `npm version` or create tags manually; semantic-release derives version from commit messages.

### Dry Run (Optional)
### Dictionary Checksums (Optional)
For stricter integrity you can export `MORFEUSZ_VERIFY_CHECKSUMS=1` and provide expected SHA-256 values in `MORFEUSZ_SGJP_SHA256` / `MORFEUSZ_POLIMORF_SHA256` before running `npm run setup-dicts`.

### Semantic Release
Semantic-release workflow (`semantic-release.yml`) automates:
- Version determination from Conventional Commits
- Changelog update
- Git tag creation
- Publishing to GitHub Packages
- GitHub Release with notes/artifacts

To adopt fully, remove manual tag-triggered workflows or keep them as fallback but avoid manual tags. Conventional commit types (`feat`, `fix`, `perf`, `docs`, `chore`, etc.) drive version bump (major/minor/patch).
To preview version changes without triggering workflows, you can create a temporary branch and tag; just avoid pushing the tag until ready.

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow best practices

## License

By contributing, you agree that your contributions will be licensed under the BSD-2-Clause License.
