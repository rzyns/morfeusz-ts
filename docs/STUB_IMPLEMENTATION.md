# Stub Implementation Note

## Overview

This repository includes a **stub implementation** of the Morfeusz2 library for development and testing purposes. The stub is located in `include/morfeusz2.h`.

## Why a Stub?

The stub implementation allows:

1. **Development without libmorfeusz2**: Contributors can build and test the bindings without installing the full Morfeusz2 library
2. **CI/CD compatibility**: Automated builds work in environments where libmorfeusz2 is not available
3. **API validation**: Ensures the binding interface matches the actual Morfeusz2 API

## Using the Real Library

To use the actual Morfeusz2 library:

### 1. Install libmorfeusz2

#### Ubuntu/Debian
```bash
sudo apt-get install libmorfeusz2-dev
```

#### macOS
Download from [http://morfeusz.sgjp.pl/download/en](http://morfeusz.sgjp.pl/download/en)

#### From Source
Follow instructions at [http://morfeusz.sgjp.pl/](http://morfeusz.sgjp.pl/)

### 2. Update binding.gyp

Replace the current `binding.gyp` with the production version:

```bash
cp binding.gyp.production binding.gyp
```

Or manually update the `libraries` array:

```json
"libraries": ["-lmorfeusz2"]
```

### 3. Remove or Update Stub Header

You can either:

**Option A: Remove the stub header**
```bash
rm include/morfeusz2.h
```

**Option B: Keep both**
Update `binding.gyp` include order to prioritize system includes:
```json
"include_dirs": [
  "<!@(node -p \"require('node-addon-api').include\")",
  "/usr/local/include",
  "/usr/include",
  "include"  // Move to end
],
```

### 4. Rebuild

```bash
pnpm run clean
pnpm run build
```

## Stub Limitations

The stub implementation:

- ✅ Provides correct API signatures
- ✅ Allows compilation and basic testing
- ✅ Returns valid but simplistic results
- ❌ Does NOT perform actual morphological analysis
- ❌ Does NOT have real Polish dictionary data
- ❌ Does NOT produce meaningful linguistic results

## For Production Use

**Always use the real libmorfeusz2 library for production applications.**

The stub is only for:
- Development
- Testing the binding layer
- CI/CD pipelines
- API validation

## Verifying Real Library Usage

When using the real library, version information will differ:

**Stub:**
```typescript
MorfeuszFactory.getVersion(); // "stub-0.1.0"
```

**Real library:**
```typescript
MorfeuszFactory.getVersion(); // "2.x.x" (actual Morfeusz version)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on developing with both stub and real implementations.
