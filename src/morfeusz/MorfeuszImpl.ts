import type {
  IdResolver,
  MorphInterpretation,
} from "../core/types.js";
import {
  Charset,
  TokenNumbering,
  CaseHandling,
  WhitespaceHandling,
  MorfeuszUsage,
  MorphInterpretation as MI,
  MorfeuszException,
} from "../core/types.js";
import { ResultsIteratorImpl } from "./ResultsIteratorImpl.js";

export class MorfeuszImpl {
  private usage: MorfeuszUsage;
  private options = {
    encoding: Charset.UTF8,
    tokenNumbering: TokenNumbering.SEPARATE_NUMBERING,
    whitespaceHandling: WhitespaceHandling.SKIP_WHITESPACES,
    caseHandling: CaseHandling.CONDITIONALLY_CASE_SENSITIVE,
    debug: false,
  };
  private nextNodeNum = 0;
  private idResolver: IdResolver | null = null; // placeholder until dictionaries are wired
  private dictionaryName: string;

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
    return "default"; // placeholder until dictionaries
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
      if (this.options.whitespaceHandling === WhitespaceHandling.KEEP_WHITESPACES) {
        items.push(MI.createWhitespace(this.nextNodeNum, this.nextNodeNum + 1, ws));
        this.nextNodeNum += 1;
      }
    };
    const pushWord = (w: string) => {
      if (!w) return;
      items.push(MI.createIgn(this.nextNodeNum, this.nextNodeNum + 1, w, w));
      this.nextNodeNum += 1;
    };
    while (cursor < text.length) {
      const ch = text[cursor];
      if (/\s/.test(ch)) {
        let start = cursor;
        while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
        pushWhitespace(text.slice(start, cursor));
      } else {
        let start = cursor;
        while (cursor < text.length && !/\s/.test(text[cursor])) cursor++;
        pushWord(text.slice(start, cursor));
      }
    }
    return items;
  }

  generate(lemma: string): MorphInterpretation[] {
    this.ensureIsGenerator();
    if (/\s/.test(lemma)) throw new MorfeuszException("Input contains more than one word");
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
  getCharset(): Charset { return this.options.encoding; }

  setAggl(_aggl: string): void {}
  getAggl(): string { return ""; }

  setPraet(_praet: string): void {}
  getPraet(): string { return ""; }

  setCaseHandling(ch: CaseHandling): void {
    this.options.caseHandling = ch;
  }
  getCaseHandling(): CaseHandling { return this.options.caseHandling; }

  setTokenNumbering(tn: TokenNumbering): void {
    this.options.tokenNumbering = tn;
    this.nextNodeNum = 0;
  }
  getTokenNumbering(): TokenNumbering { return this.options.tokenNumbering; }

  setWhitespaceHandling(wh: WhitespaceHandling): void {
    this.options.whitespaceHandling = wh;
  }
  getWhitespaceHandling(): WhitespaceHandling { return this.options.whitespaceHandling; }

  setDebug(debug: boolean): void { this.options.debug = debug; }

  getIdResolver(): IdResolver {
    if (!this.idResolver) {
      // minimal stub resolver
      this.idResolver = {
        getTagsetId: () => "stub",
        getTag: (id: number) => (id === 0 ? "ign" : id === 1 ? "sp" : `tag${id}`),
        getTagId: (t: string) => (t === "ign" ? 0 : t === "sp" ? 1 : 2),
        getName: (_id: number) => "",
        getNameId: (_n: string) => 0,
        getLabelsAsString: (_id: number) => "",
        getLabels: (_id: number) => new Set<string>(),
        getLabelsId: (_s: string) => 0,
        getTagsCount: () => 2,
        getNamesCount: () => 0,
        getLabelsCount: () => 0,
      };
    }
    return this.idResolver;
  }

  setDictionary(dictName: string): void { this.dictionaryName = dictName; }

  getAvailableAgglOptions(): Set<string> { return new Set(); }
  getAvailablePraetOptions(): Set<string> { return new Set(); }

  private adjustTokensCounter() {
    if (this.options.tokenNumbering === TokenNumbering.SEPARATE_NUMBERING) {
      this.nextNodeNum = 0;
    }
  }

  private ensureIsAnalyzer() {
    if (this.usage !== MorfeuszUsage.ANALYSE_ONLY && this.usage !== MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE) {
      throw new MorfeuszException("Cannot analyse with given Morfeusz instance.");
    }
  }

  private ensureIsGenerator() {
    if (this.usage !== MorfeuszUsage.GENERATE_ONLY && this.usage !== MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE) {
      throw new MorfeuszException("Cannot generate with given Morfeusz instance.");
    }
  }
}
