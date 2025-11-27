/**
 * Type-level utilities for ensuring type safety and correctness
 */

/**
 * Branded type to distinguish different kinds of IDs at the type level
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * Node index in the morphological analysis graph.
 * Represents positions between segments in the analyzed text.
 */
export type NodeIndex = Brand<number, 'NodeIndex'>;

/**
 * Tag ID referencing a morphological tag in the tagset.
 * Use IdResolver to convert between tag strings and IDs.
 */
export type TagId = Brand<number, 'TagId'>;

/**
 * Named entity type ID.
 * Use IdResolver to convert between name strings and IDs.
 */
export type NameId = Brand<number, 'NameId'>;

/**
 * Labels combination ID.
 * Use IdResolver to convert between label strings and IDs.
 */
export type LabelsId = Brand<number, 'LabelsId'>;

/**
 * Character encoding for input/output text
 */
export enum Charset {
  /** UTF-8 encoding */
  UTF8 = 11,
  /** ISO 8859-2 (Latin-2) encoding */
  ISO8859_2 = 12,
  /** Windows-1250 encoding */
  CP1250 = 13,
  /** DOS CP852 encoding */
  CP852 = 14
}

/**
 * Token numbering policy for the analysis results
 */
export enum TokenNumbering {
  /**
   * Start from 0. Reset counter for every invocation of Morfeusz.analyze.
   * This is the default behavior.
   */
  SEPARATE_NUMBERING = 201,
  /**
   * Also start from 0. Reset counter for every invocation of 
   * Morfeusz.setTokenNumbering only.
   */
  CONTINUOUS_NUMBERING = 202
}

/**
 * Case sensitivity policy for morphological analysis
 */
export enum CaseHandling {
  /**
   * Case-sensitive but allows interpretations that do not match case 
   * when there are no alternatives. This is the default.
   */
  CONDITIONALLY_CASE_SENSITIVE = 100,
  /**
   * Strictly case-sensitive, reject all interpretations that do not match case.
   */
  STRICTLY_CASE_SENSITIVE = 101,
  /**
   * Case-insensitive - ignores case differences.
   */
  IGNORE_CASE = 102
}

/**
 * Whitespace handling policy
 */
export enum WhitespaceHandling {
  /**
   * Ignore whitespaces. This is the default.
   */
  SKIP_WHITESPACES = 301,
  /**
   * Append whitespaces to the previous MorphInterpretation.
   */
  APPEND_WHITESPACES = 302,
  /**
   * Whitespaces are separate MorphInterpretation objects.
   */
  KEEP_WHITESPACES = 303
}

/**
 * Morfeusz usage mode
 */
export enum MorfeuszUsage {
  /** Only morphological analysis */
  ANALYSE_ONLY = 401,
  /** Only morphological generation */
  GENERATE_ONLY = 402,
  /** Both analysis and generation */
  BOTH_ANALYSE_AND_GENERATE = 403
}

/**
 * A single morphological interpretation representing an edge in the 
 * analysis DAG (Directed Acyclic Graph).
 * 
 * The result of analysis is a directed acyclic graph with numbered nodes
 * representing positions in text (points between segments) and edges
 * representing interpretations of segments that span from one node to another.
 * 
 * @example
 * For the word "zostałem" broken into segments:
 * ```
 * {1,2,"został","zostać","praet:sg:m1.m2.m3:perf"}
 * {2,3,"em","być","aglt:sg:pri:imperf:wok"}
 * ```
 */
export interface MorphInterpretation {
  /** Start node index in the analysis graph */
  readonly startNode: NodeIndex;
  /** End node index in the analysis graph */
  readonly endNode: NodeIndex;
  /** Orthographic form (word as it appears in text) */
  readonly orth: string;
  /** Base form (lemma) */
  readonly lemma: string;
  /** Morphological tag ID - use getTag() for string representation */
  readonly tagId: TagId;
  /** Named entity type ID - use getName() for string representation */
  readonly nameId: NameId;
  /** Labels combination ID - use getLabelsAsString() for string representation */
  readonly labelsId: LabelsId;
  /** Morphological tag as string */
  readonly tag: string;
  /** Named entity type as string */
  readonly name: string;
  /** Labels as string */
  readonly labels: string;
}

/**
 * Special morphological interpretation predicates
 */
export interface MorphInterpretationChecks {
  /**
   * Check if this interpretation represents an unknown word.
   * Unknown words have tagId === 0 and tag "ign".
   */
  isIgn(interp: MorphInterpretation): boolean;
  
  /**
   * Check if this interpretation represents whitespace.
   * Whitespace interpretations have tagId === 1 and tag "sp".
   */
  isWhitespace(interp: MorphInterpretation): boolean;
}

/**
 * Interface for resolving IDs to their string representations.
 * This provides access to the tagset, named entities, and label combinations.
 */
export interface IdResolver {
  /**
   * Get tag string for the given tag ID.
   * @throws Error when invalid tagId is provided
   */
  getTag(tagId: TagId): string;
  
  /**
   * Get tag ID for the given tag string.
   * @throws Error when tag not found
   */
  getTagId(tag: string): TagId;
  
  /**
   * Get named entity type for the given name ID.
   * @throws Error when invalid nameId is provided
   */
  getName(nameId: NameId): string;
  
  /**
   * Get name ID for the given named entity type.
   * @throws Error when name not found
   */
  getNameId(name: string): NameId;
  
  /**
   * Get labels as string for the given labels ID.
   * @throws Error when invalid labelsId is provided
   */
  getLabelsAsString(labelsId: LabelsId): string;
  
  /**
   * Get labels as set of strings for the given labels ID.
   * @throws Error when invalid labelsId is provided
   */
  getLabels(labelsId: LabelsId): ReadonlySet<string>;
  
  /**
   * Get labels ID for the given labels string.
   * @throws Error when invalid labels string is provided
   */
  getLabelsId(labelsStr: string): LabelsId;
  
  /** Get total number of tags in the tagset */
  getTagsCount(): number;
  
  /** Get total number of named entity types */
  getNamesCount(): number;
  
  /** Get total number of different label combinations */
  getLabelsCount(): number;
}

/**
 * Main Morfeusz interface for morphological analysis and generation.
 * 
 * **NOT THREAD-SAFE**: Use separate instances for concurrent threads.
 */
export interface Morfeusz {
  /**
   * Get current dictionary ID.
   */
  getDictID(): string;
  
  /**
   * Get current dictionary copyright information.
   */
  getDictCopyright(): string;
  
  /**
   * Perform morphological analysis on the given text.
   * Returns array of all interpretations.
   * 
   * @param text - Text to analyze
   * @returns Array of morphological interpretations forming a DAG
   */
  analyse(text: string): ReadonlyArray<MorphInterpretation>;
  
  /**
   * Perform morphological synthesis (generation) on the given lemma.
   * 
   * @param lemma - Lemma to generate forms for (must not contain whitespaces)
   * @returns Array of generated word forms
   * @throws Error when lemma contains whitespaces
   */
  generate(lemma: string): ReadonlyArray<MorphInterpretation>;
  
  /**
   * Perform morphological synthesis limited to a specific tag.
   * 
   * @param lemma - Lemma to generate forms for (must not contain whitespaces)
   * @param tagId - Limit results to this tag
   * @returns Array of generated word forms
   * @throws Error when lemma contains whitespaces or tagId is invalid
   */
  generateWithTag(lemma: string, tagId: TagId): ReadonlyArray<MorphInterpretation>;
  
  /**
   * Set character encoding for input and output.
   */
  setCharset(charset: Charset): void;
  
  /**
   * Get current character encoding.
   */
  getCharset(): Charset;
  
  /**
   * Select agglutination rules.
   * @throws Error for invalid aggl parameter
   */
  setAggl(aggl: string): void;
  
  /**
   * Get current agglutination rules option.
   */
  getAggl(): string;
  
  /**
   * Select past tense segmentation.
   * @throws Error for invalid praet parameter
   */
  setPraet(praet: string): void;
  
  /**
   * Get current past tense segmentation option.
   */
  getPraet(): string;
  
  /**
   * Set case handling policy.
   */
  setCaseHandling(caseHandling: CaseHandling): void;
  
  /**
   * Get current case handling policy.
   */
  getCaseHandling(): CaseHandling;
  
  /**
   * Set token numbering policy.
   */
  setTokenNumbering(numbering: TokenNumbering): void;
  
  /**
   * Get current token numbering policy.
   */
  getTokenNumbering(): TokenNumbering;
  
  /**
   * Set whitespace handling policy.
   */
  setWhitespaceHandling(whitespaceHandling: WhitespaceHandling): void;
  
  /**
   * Get current whitespace handling policy.
   */
  getWhitespaceHandling(): WhitespaceHandling;
  
  /**
   * Get IdResolver for converting between IDs and strings.
   */
  getIdResolver(): IdResolver;
}

/**
 * Static factory methods and version information
 */
export interface MorfeuszStatic {
  /**
   * Get Morfeusz library version string.
   */
  getVersion(): string;
  
  /**
   * Get default dictionary name.
   */
  getDefaultDictName(): string;
  
  /**
   * Get library copyright information.
   */
  getCopyright(): string;
  
  /**
   * Create a new Morfeusz instance with default dictionary.
   * 
   * **NOT THREAD-SAFE**: This method affects all Morfeusz instances.
   * 
   * @param usage - Usage mode (default: BOTH_ANALYSE_AND_GENERATE)
   * @returns New Morfeusz instance
   */
  createInstance(usage?: MorfeuszUsage): Morfeusz;
  
  /**
   * Create a new Morfeusz instance with specified dictionary.
   * 
   * **NOT THREAD-SAFE**: This method affects all Morfeusz instances.
   * 
   * @param dictName - Dictionary name
   * @param usage - Usage mode (default: BOTH_ANALYSE_AND_GENERATE)
   * @returns New Morfeusz instance
   */
  createInstance(dictName: string, usage?: MorfeuszUsage): Morfeusz;
}

/**
 * Morfeusz exception class
 */
export class MorfeuszException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MorfeuszException';
  }
}

/**
 * File format exception for dictionary loading errors
 */
export class FileFormatException extends MorfeuszException {
  constructor(message: string) {
    super(message);
    this.name = 'FileFormatException';
  }
}
