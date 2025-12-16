import { describe, it, expect } from "vitest";
import {
	CaseConverter,
	CasePatternHelper,
	CaseHandling
} from "../src/index.js";

describe("Case handling", () => {
	it("CaseConverter lower/upper are locale-aware", () => {
		const c = new CaseConverter();
		expect(c.toLower("ZAŻÓŁĆ")).toBe("zażółć");
		expect(c.toUpper("zażółć")).toBe("ZAŻÓŁĆ");
	});

	it("CasePatternHelper respects CaseHandling", () => {
		const helper = new CasePatternHelper(new CaseConverter());
		expect(
			helper.checkOrthCaseMatches("Kot", "KOT", CaseHandling.IGNORE_CASE)
		).toBe(true);
		expect(
			helper.checkOrthCaseMatches(
				"Kot",
				"KOT",
				CaseHandling.STRICTLY_CASE_SENSITIVE
			)
		).toBe(false);
		expect(
			helper.checkOrthCaseMatches(
				"Kot",
				"kot",
				CaseHandling.CONDITIONALLY_CASE_SENSITIVE
			)
		).toBe(true);
	});
});
