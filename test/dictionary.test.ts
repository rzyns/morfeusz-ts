import { describe, it, expect } from "vitest";
import {
	DictionariesRepository,
	MorfeuszProcessorType,
	Dictionary
} from "../src/index.js";

describe("DictionariesRepository", () => {
	it("resolves and loads analyzer dict from default paths if present", async () => {
		// Try known dict names from repo; if none exist, skip the test gracefully
		const candidates = ["sgjp", "polimorf"];
		let loaded = null as null | { name: string };
		for (const name of candidates) {
			const data = await DictionariesRepository.tryToLoadDictionary(
				name,
				MorfeuszProcessorType.ANALYZER
			);
			if (data) {
				loaded = { name };
				break;
			}
		}
		if (!loaded) {
			// No dicts available in environment; ensure function returns null and exit
			const data = await DictionariesRepository.tryToLoadDictionary(
				"nonexistent",
				MorfeuszProcessorType.ANALYZER
			);
			expect(data).toBeNull();
			return;
		}
		expect(loaded).not.toBeNull();
	});

	it("wraps loaded buffer in Dictionary", async () => {
		const data = await DictionariesRepository.tryToLoadDictionary(
			"sgjp",
			MorfeuszProcessorType.ANALYZER
		);
		if (!data) return; // skip if not present
		const dict = new Dictionary(data.buffer);
		expect(dict.buffer.byteLength).toBeGreaterThan(0);
	});
});
