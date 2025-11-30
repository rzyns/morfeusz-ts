/**
 * morfeusz-ts: TypeScript bindings for Morfeusz 2
 * 
 * This module provides high-fidelity TypeScript bindings for the Morfeusz 2
 * Polish morphological analyzer. The types are carefully crafted to match
 * the actual behavior of the library, using type-level programming to ensure
 * correctness beyond what the C++ types provide.
 * 
 * @module morfeusz-ts
 */

import bindings from 'bindings';
import * as path from 'path';
import * as fs from 'fs';
import { allPresent as dictsPresent, dictDir, required as requiredDicts } from './check-dicts.js';
import type {
  MorphInterpretation,
  MorphInterpretationChecks,
  IdResolver,
  Morfeusz,
  MorfeuszStatic,
  TagId,
  NameId,
  LabelsId,
} from './types.js';

export * from './types.js';

import {
  Charset,
  TokenNumbering,
  CaseHandling,
  WhitespaceHandling,
  MorfeuszUsage,
} from './types.js';

/**
 * Native module bindings
 */
interface NativeMorfeusz {
  getVersion(): string;
  getDefaultDictName(): string;
  getCopyright(): string;
  createInstance(usage?: number): NativeMorfeuszInstance;
  createInstanceWithDict(dictName: string, usage?: number): NativeMorfeuszInstance;
  addDictionarySearchPath(path: string): void;
}

interface NativeMorfeuszInstance {
  getDictID(): string;
  getDictCopyright(): string;
  analyse(text: string): MorphInterpretation[];
  generate(lemma: string): MorphInterpretation[];
  generateWithTag(lemma: string, tagId: number): MorphInterpretation[];
  setCharset(charset: number): void;
  getCharset(): number;
  setAggl(aggl: string): void;
  getAggl(): string;
  setPraet(praet: string): void;
  getPraet(): string;
  setCaseHandling(caseHandling: number): void;
  getCaseHandling(): number;
  setTokenNumbering(numbering: number): void;
  getTokenNumbering(): number;
  setWhitespaceHandling(whitespaceHandling: number): void;
  getWhitespaceHandling(): number;
  getIdResolver(): NativeIdResolver;
}

interface NativeIdResolver {
  getTag(tagId: number): string;
  getTagId(tag: string): number;
  getName(nameId: number): string;
  getNameId(name: string): number;
  getLabelsAsString(labelsId: number): string;
  getLabels(labelsId: number): string[];
  getLabelsId(labelsStr: string): number;
  getTagsCount(): number;
  getNamesCount(): number;
  getLabelsCount(): number;
}

// Load the native module
const native: NativeMorfeusz = bindings('morfeusz2');

// Register dictionaries directory as a search path (once).
try {
  if (fs.existsSync(dictDir)) {
    native.addDictionarySearchPath(dictDir);
  }
} catch (e) {
  // Non-fatal: path registration failure will surface later when creating instances.
}

/**
 * Wrap native IdResolver with type-safe interface
 */
class IdResolverWrapper implements IdResolver {
  constructor(private readonly nativeResolver: NativeIdResolver) {}
  
  getTag(tagId: TagId): string {
    return this.nativeResolver.getTag(tagId as number);
  }
  
  getTagId(tag: string): TagId {
    return this.nativeResolver.getTagId(tag) as TagId;
  }
  
  getName(nameId: NameId): string {
    return this.nativeResolver.getName(nameId as number);
  }
  
  getNameId(name: string): NameId {
    return this.nativeResolver.getNameId(name) as NameId;
  }
  
  getLabelsAsString(labelsId: LabelsId): string {
    return this.nativeResolver.getLabelsAsString(labelsId as number);
  }
  
  getLabels(labelsId: LabelsId): ReadonlySet<string> {
    const labels = this.nativeResolver.getLabels(labelsId as number);
    return new Set(labels);
  }
  
  getLabelsId(labelsStr: string): LabelsId {
    return this.nativeResolver.getLabelsId(labelsStr) as LabelsId;
  }
  
  getTagsCount(): number {
    return this.nativeResolver.getTagsCount();
  }
  
  getNamesCount(): number {
    return this.nativeResolver.getNamesCount();
  }
  
  getLabelsCount(): number {
    return this.nativeResolver.getLabelsCount();
  }
}

/**
 * Wrap native Morfeusz instance with type-safe interface
 */
class MorfeuszWrapper implements Morfeusz {
  private readonly resolver: IdResolver;
  
  constructor(private readonly nativeInstance: NativeMorfeuszInstance) {
    this.resolver = new IdResolverWrapper(nativeInstance.getIdResolver());
  }
  
  getDictID(): string {
    return this.nativeInstance.getDictID();
  }
  
  getDictCopyright(): string {
    return this.nativeInstance.getDictCopyright();
  }
  
  analyse(text: string): ReadonlyArray<MorphInterpretation> {
    return this.nativeInstance.analyse(text);
  }
  
  generate(lemma: string): ReadonlyArray<MorphInterpretation> {
    return this.nativeInstance.generate(lemma);
  }
  
  generateWithTag(lemma: string, tagId: TagId): ReadonlyArray<MorphInterpretation> {
    return this.nativeInstance.generateWithTag(lemma, tagId as number);
  }
  
  setCharset(charset: Charset): void {
    this.nativeInstance.setCharset(charset);
  }
  
  getCharset(): Charset {
    return this.nativeInstance.getCharset();
  }
  
  setAggl(aggl: string): void {
    this.nativeInstance.setAggl(aggl);
  }
  
  getAggl(): string {
    return this.nativeInstance.getAggl();
  }
  
  setPraet(praet: string): void {
    this.nativeInstance.setPraet(praet);
  }
  
  getPraet(): string {
    return this.nativeInstance.getPraet();
  }
  
  setCaseHandling(caseHandling: CaseHandling): void {
    this.nativeInstance.setCaseHandling(caseHandling);
  }
  
  getCaseHandling(): CaseHandling {
    return this.nativeInstance.getCaseHandling();
  }
  
  setTokenNumbering(numbering: TokenNumbering): void {
    this.nativeInstance.setTokenNumbering(numbering);
  }
  
  getTokenNumbering(): TokenNumbering {
    return this.nativeInstance.getTokenNumbering();
  }
  
  setWhitespaceHandling(whitespaceHandling: WhitespaceHandling): void {
    this.nativeInstance.setWhitespaceHandling(whitespaceHandling);
  }
  
  getWhitespaceHandling(): WhitespaceHandling {
    return this.nativeInstance.getWhitespaceHandling();
  }
  
  getIdResolver(): IdResolver {
    return this.resolver;
  }
}

/**
 * Static factory methods and utilities
 */
function ensureDictionariesOrThrow() {
  if (!dictsPresent()) {
    const missing = requiredDicts.filter((f: string) => !fs.existsSync(path.join(dictDir, f)));
    if (missing.length > 0) {
      throw new Error(
        `Morfeusz dictionaries not found.\n` +
        `Missing: ${missing.join(', ')}\n` +
        `Please run: pnpm run setup-dicts\n` +
        `See README for details.`
      );
    }
  }
}
  export const MorfeuszFactory: MorfeuszStatic = {
    getVersion(): string {
      return native.getVersion();
    },

    getDefaultDictName(): string {
      const name = native.getDefaultDictName();
      if (name && name.length > 0) return name;
      // Fallback: infer from available local dictionaries
      try {
        if (fs.existsSync(dictDir)) {
          const entries = fs.readdirSync(dictDir);
          const candidates = entries
            .filter(f => f.endsWith('.dict'))
            .map(f => f.replace(/\.(dict)$/,'').replace(/-[as]$/,''))
            .filter((v, i, a) => a.indexOf(v) === i);
          if (candidates.length > 0) return candidates[0];
        }
      } catch {}
      return name;
    },

    getCopyright(): string {
      return native.getCopyright();
    },

    createInstance(
      usageOrDictName?: MorfeuszUsage | string,
      usage: MorfeuszUsage = MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE
    ): Morfeusz {
      ensureDictionariesOrThrow();
      let nativeInstance: NativeMorfeuszInstance;
      if (typeof usageOrDictName === 'string') {
        nativeInstance = native.createInstanceWithDict(usageOrDictName, usage);
      } else {
        const actualUsage = usageOrDictName ?? MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE;
        // Prefer an explicit dictionary if the library has no embedded default
        const inferred = MorfeuszFactory.getDefaultDictName();
        if (inferred && inferred.length > 0) {
          nativeInstance = native.createInstanceWithDict(inferred, actualUsage);
        } else {
          nativeInstance = native.createInstance(actualUsage);
        }
      }
      return new MorfeuszWrapper(nativeInstance);
    }
  };

/**
 * Helper utilities for working with MorphInterpretation
 */
export const MorphUtils: MorphInterpretationChecks = {
  /**
   * Check if interpretation represents an unknown word (tag "ign")
   */
  isIgn(interp: MorphInterpretation): boolean {
    return (interp.tagId as number) === 0;
  },
  
  /**
   * Check if interpretation represents whitespace (tag "sp")
   */
  isWhitespace(interp: MorphInterpretation): boolean {
    return (interp.tagId as number) === 1;
  }
};

/**
 * Default export for convenience
 */
export default MorfeuszFactory;
