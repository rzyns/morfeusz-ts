import type { IdResolver, MorphInterpretation } from "../core/types.js";
import {
	Charset,
	TokenNumbering,
	CaseHandling,
	WhitespaceHandling,
	MorfeuszUsage,
	MorphInterpretation as MI,
	MorfeuszException
} from "../core/types.js";
import { ResultsIteratorImpl } from "./ResultsIteratorImpl.js";
import { DictionariesRepository } from "../core/dictionary/DictionariesRepository.js";
import { MorfeuszProcessorType } from "../core/dictionary/const.js";
import { Dictionary } from "../core/dictionary/Dictionary.js";
import type { FSA } from "../core/fsa/FSA.js";
import { InterpsGroupsReader } from "../core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../core/deserialization/InterpsGroupsDecoder.js";
import { MorphDeserializer } from "../core/deserialization/MorphDeserializer.js";

export class MorfeuszImpl {
	private usage: MorfeuszUsage;
	private options = {
		encoding: Charset.UTF8,
		tokenNumbering: TokenNumbering.SEPARATE_NUMBERING,
		whitespaceHandling: WhitespaceHandling.SKIP_WHITESPACES,
		caseHandling: CaseHandling.CONDITIONALLY_CASE_SENSITIVE,
		debug: false
	};
	private nextNodeNum = 0;
	private idResolver: IdResolver | null = null; // placeholder until dictionaries are wired
	private dictionaryName: string;
	private dictionary: Dictionary | null = null;
	private fsa: FSA<InterpsGroupsReader> | null = null;

	constructor(dictName: string, usage: MorfeuszUsage) {
		this.dictionaryName = dictName;
		this.usage = usage;
	}

	clone(): MorfeuszImpl {
		const c = new MorfeuszImpl(this.dictionaryName, this.usage);
		c.options = { ...this.options };
		c.nextNodeNum = this.nextNodeNum;
		c.idResolver = this.idResolver;
		return c;
	}

	getDictID(): string {
		return this.dictionary ? this.dictionaryName : "default";
	}

	getDictCopyright(): string {
		return "";
	}

	analyse(text: string): ResultsIteratorImpl {
		this.ensureIsAnalyzer();
		this.adjustTokensCounter();
		const items = this.analyseToArray(text);
		return new ResultsIteratorImpl(items);
	}

	analyseToArray(text: string): MorphInterpretation[] {
		this.ensureIsAnalyzer();
		this.adjustTokensCounter();
		const items: MorphInterpretation[] = [];
		let cursor = 0;
		const pushWhitespace = (ws: string) => {
			if (
				this.options.whitespaceHandling ===
				WhitespaceHandling.KEEP_WHITESPACES
			) {
				items.push(
					MI.createWhitespace(
						this.nextNodeNum,
						this.nextNodeNum + 1,
						ws
					)
				);
				this.nextNodeNum += 1;
			}
		};
		const pushWord = (w: string) => {
			if (!w) return;
			const payload = this.recognizePayload(w);
			if (payload) {
				const interps = this.decodePayload(w, payload);
				for (const it of interps) {
					items.push({
						...it,
						startNode: this.nextNodeNum,
						endNode: this.nextNodeNum + 1
					});
				}
			} else {
				items.push(
					MI.createIgn(this.nextNodeNum, this.nextNodeNum + 1, w, w)
				);
			}
			this.nextNodeNum += 1;
		};
		while (cursor < text.length) {
			const ch = text[cursor];
			if (/\s/.test(ch)) {
				let start = cursor;
				while (cursor < text.length && /\s/.test(text[cursor]))
					cursor++;
				pushWhitespace(text.slice(start, cursor));
			} else {
				let start = cursor;
				while (cursor < text.length && !/\s/.test(text[cursor]))
					cursor++;
				pushWord(text.slice(start, cursor));
			}
		}
		return items;
	}

	generate(lemma: string): MorphInterpretation[] {
		this.ensureIsGenerator();
		if (/\s/.test(lemma))
			throw new MorfeuszException("Input contains more than one word");
		// No dictionary yet: return ign with orth=lemma, lemma=lemma
		return [MI.createIgn(0, 1, lemma, lemma)];
	}

	generateWithTag(lemma: string, tagId: number): MorphInterpretation[] {
		// Tag filtering is not meaningful without dictionaries; return generate(lemma)
		return this.generate(lemma).filter((m) => m.tagId === tagId);
	}

	setCharset(charset: Charset): void {
		this.options.encoding = charset;
	}
	getCharset(): Charset {
		return this.options.encoding;
	}

	setAggl(_aggl: string): void {}
	getAggl(): string {
		return "";
	}

	setPraet(_praet: string): void {}
	getPraet(): string {
		return "";
	}

	setCaseHandling(ch: CaseHandling): void {
		this.options.caseHandling = ch;
	}
	getCaseHandling(): CaseHandling {
		return this.options.caseHandling;
	}

	// Convenience methods for case preference
	strictCase(): this {
		this.setCaseHandling(CaseHandling.STRICTLY_CASE_SENSITIVE);
		return this;
	}
	preferMatchingCase(): this {
		this.setCaseHandling(CaseHandling.CONDITIONALLY_CASE_SENSITIVE);
		return this;
	}
	ignoreCase(): this {
		this.setCaseHandling(CaseHandling.IGNORE_CASE);
		return this;
	}

	setTokenNumbering(tn: TokenNumbering): void {
		this.options.tokenNumbering = tn;
		this.nextNodeNum = 0;
	}
	getTokenNumbering(): TokenNumbering {
		return this.options.tokenNumbering;
	}

	setWhitespaceHandling(wh: WhitespaceHandling): void {
		this.options.whitespaceHandling = wh;
	}
	getWhitespaceHandling(): WhitespaceHandling {
		return this.options.whitespaceHandling;
	}

	setDebug(debug: boolean): void {
		this.options.debug = debug;
	}

	getIdResolver(): IdResolver {
		if (!this.idResolver) {
			// minimal stub resolver
			this.idResolver = {
				getTagsetId: () => "stub",
				getTag: (id: number) =>
					id === 0 ? "ign" : id === 1 ? "sp" : `tag${id}`,
				getTagId: (t: string) => (t === "ign" ? 0 : t === "sp" ? 1 : 2),
				getName: (_id: number) => "",
				getNameId: (_n: string) => 0,
				getLabelsAsString: (_id: number) => "",
				getLabels: (_id: number) => new Set<string>(),
				getLabelsId: (_s: string) => 0,
				getTagsCount: () => 2,
				getNamesCount: () => 0,
				getLabelsCount: () => 0
			};
		}
		return this.idResolver;
	}

	setDictionary(dictName: string): void {
		this.dictionaryName = dictName;
	}

	getAvailableAgglOptions(): Set<string> {
		return new Set();
	}
	getAvailablePraetOptions(): Set<string> {
		return new Set();
	}

	private adjustTokensCounter() {
		if (this.options.tokenNumbering === TokenNumbering.SEPARATE_NUMBERING) {
			this.nextNodeNum = 0;
		}
	}

	private ensureIsAnalyzer() {
		if (
			this.usage !== MorfeuszUsage.ANALYSE_ONLY &&
			this.usage !== MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE
		) {
			throw new MorfeuszException(
				"Cannot analyse with given Morfeusz instance."
			);
		}
	}

	private ensureIsGenerator() {
		if (
			this.usage !== MorfeuszUsage.GENERATE_ONLY &&
			this.usage !== MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE
		) {
			throw new MorfeuszException(
				"Cannot generate with given Morfeusz instance."
			);
		}
	}

	async load(processorType?: MorfeuszProcessorType): Promise<void> {
		const pt =
			processorType ??
			(this.usage === MorfeuszUsage.GENERATE_ONLY
				? MorfeuszProcessorType.GENERATOR
				: MorfeuszProcessorType.ANALYZER);
		const data = await DictionariesRepository.tryToLoadDictionary(
			this.dictionaryName,
			pt
		);
		if (!data)
			throw new MorfeuszException(
				`Dictionary not found: ${this.dictionaryName} (${pt === MorfeuszProcessorType.ANALYZER ? "analyzer" : "generator"})`
			);
		this.dictionary = new Dictionary(data.buffer);
		// Create FSA with morph deserializer
		const deser = new MorphDeserializer();
		this.fsa = this.dictionary.createFSA(
			deser,
			() => new InterpsGroupsReader()
		);
	}

	isLoaded(): boolean {
		return !!this.fsa;
	}

	private recognizePayload(word: string): InterpsGroupsReader | null {
		if (!this.fsa) return null;
		const s = this.fsa.getInitialState();
		// Feed UTF-8 bytes — the Morfeusz FSA is indexed on raw UTF-8 byte sequences,
		// not Unicode code points. Iterating over the string gives us codepoints, so
		// we must encode each character to its UTF-8 bytes before walking the automaton.
		const encoded = new TextEncoder().encode(word);
		for (const byte of encoded) {
			s.proceedToNext(this.fsa, byte);
			if (s.isSink()) return null;
		}
		if (!s.isAccepting()) return null;
		return s.getValue();
	}

	private decodePayload(
		orth: string,
		reader: InterpsGroupsReader
	): MorphInterpretation[] {
		const decoder = new InterpsGroupsDecoder();
		const ids = this.getIdResolver();
		const res = decoder.decode(
			orth,
			reader,
			ids,
			this.options.caseHandling
		);
		if (res.length === 0) return [MI.createIgn(0, 0, orth, orth)];
		return res;
	}
}
