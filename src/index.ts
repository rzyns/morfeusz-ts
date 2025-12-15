export {
	Charset,
	TokenNumbering,
	CaseHandling,
	WhitespaceHandling,
	MorfeuszUsage,
	type MorphInterpretation,
	MorphInterpretation as MorphInterpretationHelpers,
	type ResultsIterator,
	type IdResolver,
	MorfeuszException,
} from "./core/types.js";

export { ResultsIteratorImpl } from "./morfeusz/ResultsIteratorImpl.js";
export { MorfeuszImpl } from "./morfeusz/MorfeuszImpl.js";

// Optional internal utilities exports for early adopters
export type { CharsetConverter } from "./core/charset/CharsetConverter.js";
export { UTF8CharsetConverter, OneByteCharsetConverter, getCharsetConverter } from "./core/charset/CharsetConverter.js";
export { CaseConverter } from "./core/case/CaseConverter.js";
export { CasePatternHelper } from "./core/case/CasePatternHelper.js";
export * as BinaryReaders from "./core/binary/readers.js";
export { type Deserializer, type State as FSAState, SimpleFSA, SimpleState } from "./core/fsa/FSA.js";

