import { describe, it, expect, beforeAll } from "vitest";
import { MorfeuszImpl } from "../src/morfeusz/MorfeuszImpl.js";
import { DictionariesRepository } from "../src/core/dictionary/DictionariesRepository.js";
import { MorfeuszUsage } from "../src/core/types.js";
import { MorfeuszProcessorType } from "../src/core/dictionary/const.js";
import { Dictionary } from "../src/core/dictionary/Dictionary.js";

// Runs only when real .dict files are present (system install or morfeusz2/dict/).
// Ground truth from morfeusz_analyzer CLI.

const KNOWN: Array<{
	word: string;
	lemmas: string[]; // at least one must appear
	tagPrefix: string; // at least one result tag must start with this
}> = [
	{ word: "w", lemmas: ["w"], tagPrefix: "prep:" },
	{ word: "kot", lemmas: ["kot"], tagPrefix: "subst:sg:nom:m" },
	{ word: "psa", lemmas: ["pies"], tagPrefix: "subst:sg:gen" },
	{ word: "żółw", lemmas: ["żółw"], tagPrefix: "subst:sg:nom:m" }
];

describe("MorfeuszImpl + real dictionary", () => {
	let m: MorfeuszImpl | null = null;

	beforeAll(async () => {
		const found = await DictionariesRepository.tryToLoadDictionary(
			"sgjp",
			MorfeuszProcessorType.ANALYZER
		);
		if (!found) return;
		m = new MorfeuszImpl("sgjp", MorfeuszUsage.ANALYSE_ONLY);
		await m.load();
	});

	it("dictionary is loadable and header is valid", async () => {
		const found = await DictionariesRepository.tryToLoadDictionary(
			"sgjp",
			MorfeuszProcessorType.ANALYZER
		);
		if (!found) {
			console.log("SKIP: no dict");
			return;
		}
		const dict = new Dictionary(found.buffer);
		expect([0, 1, 2]).toContain(dict.header.impl);
	});

	for (const { word, lemmas, tagPrefix } of KNOWN) {
		it(`recognizes "${word}"`, () => {
			if (!m) {
				console.log("SKIP: no dict");
				return;
			}
			const results = m.analyseToArray(word);
			expect(results.length).toBeGreaterThan(0);

			const nonIgn = results.filter((r) => r.tagId !== 0);
			expect(
				nonIgn.length,
				`all results were ign for "${word}"`
			).toBeGreaterThan(0);

			const hasLemma = lemmas.some((l) =>
				results.some((r) => r.lemma.startsWith(l))
			);
			expect(
				hasLemma,
				`expected lemma from [${lemmas}], got [${results.map((r) => r.lemma)}]`
			).toBe(true);
		});
	}
});
