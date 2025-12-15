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

