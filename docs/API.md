# API Documentation

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Type System](#type-system)
- [Core Interfaces](#core-interfaces)
- [Enumerations](#enumerations)
- [Static Factory](#static-factory)
- [Working with Results](#working-with-results)
- [Configuration](#configuration)
- [Error Handling](#error-handling)

## Installation

```bash
pnpm install morfeusz-ts
```

### System Requirements

Before using morfeusz-ts, you need libmorfeusz2 installed:

#### Ubuntu/Debian
```bash
sudo apt-get install libmorfeusz2-dev
```

#### macOS
Download from [http://morfeusz.sgjp.pl/download/en](http://morfeusz.sgjp.pl/download/en)

#### Build from Source
When building with the actual libmorfeusz2 library, update `binding.gyp`:
```json
"libraries": ["-lmorfeusz2"]
```

## Quick Start

```typescript
import MorfeuszFactory from 'morfeusz-ts';

// Create instance
const morfeusz = MorfeuszFactory.createInstance();

// Analyze text
const results = morfeusz.analyse('Ala ma kota');

// Process results
results.forEach(interp => {
  console.log(`${interp.orth} -> ${interp.lemma} (${interp.tag})`);
});
```

## Type System

### Branded Types

morfeusz-ts uses TypeScript's branded types to ensure type safety at compile time:

```typescript
type Brand<K, T> = K & { __brand: T };

type NodeIndex = Brand<number, 'NodeIndex'>;
type TagId = Brand<number, 'TagId'>;
type NameId = Brand<number, 'NameId'>;
type LabelsId = Brand<number, 'LabelsId'>;
```

These types prevent accidental mixing of different ID types:

```typescript
const tagId: TagId = 5 as TagId;
const nameId: NameId = 5 as NameId;

// TypeScript error: Type 'TagId' is not assignable to type 'NameId'
// resolver.getName(tagId); // Error!
resolver.getName(nameId); // OK
```

### MorphInterpretation

Represents a single morphological interpretation:

```typescript
interface MorphInterpretation {
  readonly startNode: NodeIndex;    // Start position in graph
  readonly endNode: NodeIndex;      // End position in graph
  readonly orth: string;            // Orthographic form
  readonly lemma: string;           // Base form
  readonly tagId: TagId;            // Tag ID (use getTag())
  readonly nameId: NameId;          // Name ID (use getName())
  readonly labelsId: LabelsId;      // Labels ID (use getLabels())
  readonly tag: string;             // Resolved tag string
  readonly name: string;            // Resolved name string
  readonly labels: string;          // Resolved labels string
}
```

## Core Interfaces

### Morfeusz

Main interface for morphological analysis and generation.

#### Analysis Methods

```typescript
analyse(text: string): ReadonlyArray<MorphInterpretation>
```
Performs morphological analysis, returning a DAG of interpretations.

**Example:**
```typescript
const results = morfeusz.analyse('Polska jest piękna');
results.forEach(interp => {
  console.log(`${interp.startNode}-${interp.endNode}: ${interp.orth} (${interp.tag})`);
});
```

#### Generation Methods

```typescript
generate(lemma: string): ReadonlyArray<MorphInterpretation>
```
Generates all word forms for a given lemma.

**Example:**
```typescript
const forms = morfeusz.generate('dom');
forms.forEach(form => {
  console.log(`${form.orth} - ${form.tag}`);
});
```

```typescript
generateWithTag(lemma: string, tagId: TagId): ReadonlyArray<MorphInterpretation>
```
Generates forms limited to a specific morphological tag.

**Example:**
```typescript
const resolver = morfeusz.getIdResolver();
const tagId = resolver.getTagId('subst:sg:nom:m3');
const forms = morfeusz.generateWithTag('dom', tagId);
```

#### Configuration Methods

```typescript
// Character encoding
setCharset(charset: Charset): void
getCharset(): Charset

// Agglutination rules
setAggl(aggl: string): void
getAggl(): string

// Past tense segmentation
setPraet(praet: string): void
getPraet(): string

// Case handling
setCaseHandling(caseHandling: CaseHandling): void
getCaseHandling(): CaseHandling

// Token numbering
setTokenNumbering(numbering: TokenNumbering): void
getTokenNumbering(): TokenNumbering

// Whitespace handling
setWhitespaceHandling(handling: WhitespaceHandling): void
getWhitespaceHandling(): WhitespaceHandling
```

#### Information Methods

```typescript
getDictID(): string
getDictCopyright(): string
getIdResolver(): IdResolver
```

### IdResolver

Provides conversion between IDs and their string representations.

```typescript
interface IdResolver {
  // Tag operations
  getTag(tagId: TagId): string;
  getTagId(tag: string): TagId;
  getTagsCount(): number;
  
  // Name operations
  getName(nameId: NameId): string;
  getNameId(name: string): NameId;
  getNamesCount(): number;
  
  // Labels operations
  getLabelsAsString(labelsId: LabelsId): string;
  getLabels(labelsId: LabelsId): ReadonlySet<string>;
  getLabelsId(labelsStr: string): LabelsId;
  getLabelsCount(): number;
}
```

**Example:**
```typescript
const resolver = morfeusz.getIdResolver();

// Convert tag to ID
const tagId = resolver.getTagId('subst:sg:nom:m3');

// Convert ID back to tag
const tag = resolver.getTag(tagId);

// Get statistics
console.log('Total tags:', resolver.getTagsCount());
console.log('Total names:', resolver.getNamesCount());
```

## Enumerations

### Charset

Character encoding for input/output:

```typescript
enum Charset {
  UTF8 = 11,        // UTF-8 (recommended)
  ISO8859_2 = 12,   // Latin-2
  CP1250 = 13,      // Windows-1250
  CP852 = 14        // DOS CP852
}
```

**Example:**
```typescript
morfeusz.setCharset(Charset.UTF8);
```

### TokenNumbering

Token numbering policy:

```typescript
enum TokenNumbering {
  SEPARATE_NUMBERING = 201,    // Reset for each analyse() call (default)
  CONTINUOUS_NUMBERING = 202   // Reset only on setTokenNumbering()
}
```

### CaseHandling

Case sensitivity policy:

```typescript
enum CaseHandling {
  CONDITIONALLY_CASE_SENSITIVE = 100,  // Default: case-sensitive with fallback
  STRICTLY_CASE_SENSITIVE = 101,       // Reject case mismatches
  IGNORE_CASE = 102                    // Case-insensitive
}
```

### WhitespaceHandling

Whitespace handling policy:

```typescript
enum WhitespaceHandling {
  SKIP_WHITESPACES = 301,    // Ignore whitespaces (default)
  APPEND_WHITESPACES = 302,  // Append to previous interpretation
  KEEP_WHITESPACES = 303     // Separate interpretations
}
```

### MorfeuszUsage

Usage mode:

```typescript
enum MorfeuszUsage {
  ANALYSE_ONLY = 401,
  GENERATE_ONLY = 402,
  BOTH_ANALYSE_AND_GENERATE = 403  // Default
}
```

## Static Factory

### MorfeuszFactory

Provides static methods and instance creation:

```typescript
interface MorfeuszStatic {
  // Version information
  getVersion(): string;
  getDefaultDictName(): string;
  getCopyright(): string;
  
  // Instance creation
  createInstance(usage?: MorfeuszUsage): Morfeusz;
  createInstance(dictName: string, usage?: MorfeuszUsage): Morfeusz;
}
```

**Examples:**

```typescript
import MorfeuszFactory from 'morfeusz-ts';

// Get version info
console.log(MorfeuszFactory.getVersion());

// Create default instance
const morfeusz1 = MorfeuszFactory.createInstance();

// Create with specific usage
const morfeusz2 = MorfeuszFactory.createInstance(MorfeuszUsage.ANALYSE_ONLY);

// Create with specific dictionary
const morfeusz3 = MorfeuszFactory.createInstance('morfeusz-sgjp');
```

## Working with Results

### Understanding the DAG Structure

Morfeusz results form a Directed Acyclic Graph (DAG):
- **Nodes** represent positions between segments
- **Edges** (MorphInterpretation) represent possible interpretations

**Example:**
```
Text: "zostałem"

Node 0 ----("został", praet)----> Node 1 ----("em", aglt)----> Node 2
```

### Filtering Results

```typescript
import { MorphUtils } from 'morfeusz-ts';

const results = morfeusz.analyse('Ala ma kota');

// Filter out whitespace
const words = results.filter(r => !MorphUtils.isWhitespace(r));

// Find unknown words
const unknown = results.filter(r => MorphUtils.isIgn(r));
```

### Building Paths

```typescript
function findPaths(
  results: MorphInterpretation[],
  startNode: number = 0
): MorphInterpretation[][] {
  const paths: MorphInterpretation[][] = [];
  
  function buildPath(path: MorphInterpretation[], node: number) {
    const next = results.filter(r => r.startNode === node);
    
    if (next.length === 0) {
      paths.push(path);
      return;
    }
    
    next.forEach(interp => {
      buildPath([...path, interp], interp.endNode);
    });
  }
  
  buildPath([], startNode);
  return paths;
}

// Usage
const results = morfeusz.analyse('test text');
const allPaths = findPaths(results);
console.log(`Found ${allPaths.length} possible interpretations`);
```

## Configuration

### Complete Configuration Example

```typescript
import MorfeuszFactory, {
  Charset,
  CaseHandling,
  TokenNumbering,
  WhitespaceHandling,
  MorfeuszUsage
} from 'morfeusz-ts';

const morfeusz = MorfeuszFactory.createInstance(MorfeuszUsage.ANALYSE_ONLY);

// Configure all options
morfeusz.setCharset(Charset.UTF8);
morfeusz.setCaseHandling(CaseHandling.STRICTLY_CASE_SENSITIVE);
morfeusz.setTokenNumbering(TokenNumbering.CONTINUOUS_NUMBERING);
morfeusz.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
morfeusz.setPraet('composite');  // 'composite' or 'split'
morfeusz.setAggl('permissive');  // 'permissive' or 'strict'

// Read configuration
console.log('Current charset:', morfeusz.getCharset());
console.log('Case handling:', morfeusz.getCaseHandling());
console.log('Praet:', morfeusz.getPraet());
console.log('Aggl:', morfeusz.getAggl());
```

## Error Handling

### Exception Types

```typescript
class MorfeuszException extends Error {
  constructor(message: string);
}

class FileFormatException extends MorfeuszException {
  constructor(message: string);
}
```

### Handling Errors

```typescript
import { MorfeuszException } from 'morfeusz-ts';

try {
  const morfeusz = MorfeuszFactory.createInstance('invalid-dict');
} catch (error) {
  if (error instanceof MorfeuszException) {
    console.error('Morfeusz error:', error.message);
  }
}

// Invalid lemma (contains whitespace)
try {
  morfeusz.generate('invalid lemma');
} catch (error) {
  console.error('Invalid lemma:', error);
}

// Invalid tag ID
try {
  const resolver = morfeusz.getIdResolver();
  resolver.getTag(99999 as TagId);
} catch (error) {
  console.error('Invalid tag ID:', error);
}
```

## Best Practices

### 1. Thread Safety

Morfeusz instances are **NOT thread-safe**. Use separate instances for concurrent operations:

```typescript
// Good: separate instances
const worker1 = MorfeuszFactory.createInstance();
const worker2 = MorfeuszFactory.createInstance();

// Bad: shared instance across threads
// const shared = MorfeuszFactory.createInstance();
```

### 2. Reuse Instances

Creating instances is expensive. Reuse them when possible:

```typescript
// Good: reuse instance
const morfeusz = MorfeuszFactory.createInstance();
texts.forEach(text => {
  const results = morfeusz.analyse(text);
  // process results
});

// Avoid: creating new instance each time
// texts.forEach(text => {
//   const morfeusz = MorfeuszFactory.createInstance();
//   const results = morfeusz.analyse(text);
// });
```

### 3. Use Type Guards

Leverage the type system for safer code:

```typescript
import { MorphUtils } from 'morfeusz-ts';

function processWord(interp: MorphInterpretation) {
  if (MorphUtils.isWhitespace(interp)) {
    return; // skip whitespace
  }
  
  if (MorphUtils.isIgn(interp)) {
    console.log('Unknown word:', interp.orth);
    return;
  }
  
  // Process known word
  console.log(`${interp.orth} -> ${interp.lemma}`);
}
```

### 4. Cache IdResolver

The IdResolver can be cached for better performance:

```typescript
const morfeusz = MorfeuszFactory.createInstance();
const resolver = morfeusz.getIdResolver();

// Reuse resolver for multiple lookups
const tag1 = resolver.getTag(5 as TagId);
const tag2 = resolver.getTag(10 as TagId);
```

## Advanced Examples

### Batch Processing

```typescript
async function processBatch(texts: string[]): Promise<void> {
  const morfeusz = MorfeuszFactory.createInstance();
  
  for (const text of texts) {
    const results = morfeusz.analyse(text);
    
    // Process each interpretation
    for (const interp of results) {
      if (!MorphUtils.isWhitespace(interp)) {
        await saveToDatabase(interp);
      }
    }
  }
}
```

### Custom Filtering

```typescript
function filterByTag(
  results: MorphInterpretation[],
  tagPattern: RegExp
): MorphInterpretation[] {
  return results.filter(r => tagPattern.test(r.tag));
}

// Find all nouns
const nouns = filterByTag(results, /^subst:/);

// Find all verbs in past tense
const pastVerbs = filterByTag(results, /^praet:/);
```

### Statistical Analysis

```typescript
function analyzeFrequencies(text: string) {
  const morfeusz = MorfeuszFactory.createInstance();
  const results = morfeusz.analyse(text);
  
  const tagCounts = new Map<string, number>();
  
  results.forEach(interp => {
    if (!MorphUtils.isWhitespace(interp)) {
      const count = tagCounts.get(interp.tag) || 0;
      tagCounts.set(interp.tag, count + 1);
    }
  });
  
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

// Usage
const stats = analyzeFrequencies('Long Polish text...');
console.log('Most common tags:', stats.slice(0, 10));
```
