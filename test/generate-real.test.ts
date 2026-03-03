import { describe, it, expect, beforeAll } from "vitest";
import { MorfeuszImpl } from "../src/morfeusz/MorfeuszImpl.js";
import { MorfeuszUsage } from "../src/core/types.js";

let m: MorfeuszImpl;
beforeAll(async () => {
	m = new MorfeuszImpl("sgjp", MorfeuszUsage.GENERATE_ONLY);
	await m.load();
});

describe("Generator path", () => {
	it("generates all expected forms for kot", () => {
		const forms = m.generate("kot");
		const orthTags = new Set(forms.map((f) => `${f.orth}/${f.tag}`));
		// Spot-check 6 expected forms
		const expected = [
			"kot/subst:sg:nom:m1",
			"kota/subst:sg:gen.acc:m1",
			"kotem/subst:sg:inst:m1",
			"kocie/subst:sg:loc:m1",
			"kotów/subst:pl:gen.acc:m1",
			"kotach/subst:pl:loc:m1"
		];
		for (const e of expected) {
			expect(orthTags.has(e), `missing: ${e}`).toBe(true);
		}
	});

	it("correctly decodes depr form (gap at stored_id 150)", () => {
		const forms = m.generate("kot");
		const depr = forms.find((f) => f.tag === "depr:pl:nom.acc.voc:m2");
		expect(depr).toBeDefined();
		expect(depr?.orth).toBe("koty");
		expect(depr?.lemma).toBe("kot:Sm1");
	});

	it("generates Sm1 and Sm2 disambiguations", () => {
		const forms = m.generate("kot");
		const sm1Nom = forms.find(
			(f) => f.lemma === "kot:Sm1" && f.tag === "subst:sg:nom:m1"
		);
		const sm2Nom = forms.find(
			(f) => f.lemma === "kot:Sm2" && f.tag === "subst:sg:nom:m2"
		);
		expect(sm1Nom?.orth).toBe("kot");
		expect(sm2Nom?.orth).toBe("kot");
	});

	it("generates forms for czytać (verb)", () => {
		const forms = m.generate("czytać");
		const orthTags = new Set(forms.map((f) => `${f.orth}/${f.tag}`));
		expect(
			orthTags.has("czytał/praet:sg:m1.m2.m3:imperf"),
			`missing czytał`
		).toBe(true);
		expect(orthTags.has("czytam/fin:sg:pri:imperf"), `missing czytam`).toBe(
			true
		);
		expect(orthTags.has("czytając/pcon:imperf"), `missing czytając`).toBe(
			true
		);
	});

	it("names and labels are resolved in generator output", () => {
		const forms = m.generate("kot");
		const sm1 = forms.filter((f) => f.lemma === "kot:Sm1");
		// All Sm1 forms should have 'nazwa_pospolita' name
		for (const f of sm1.filter((x) => x.tagId !== 0)) {
			expect(f.name).toBe("nazwa_pospolita");
		}
		// Nom form has labels 'pot.,środ.'
		const nom = sm1.find((f) => f.tag === "subst:sg:nom:m1");
		expect(nom?.labels).toContain("pot.");
	});
});
