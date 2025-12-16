import { describe, it, expect } from "vitest";
import { CaseConverter } from "../src/core/case/CaseConverter.js";

describe("CaseConverter.toTitle graphemes", () => {
	const conv = new CaseConverter();
	it("handles combining marks at start", () => {
		const s = "e\u0301abc"; // e + combining acute accent
		const t = conv.toTitle(s);
		expect(t.startsWith("E\u0301")).toBe(true);
		expect(t.slice(2)).toBe("abc");
	});
	it("doesn't break ZWJ emoji cluster", () => {
		const s = "👩‍👩‍👧‍👦AbC"; // family emoji (ZWJ sequence)
		const t = conv.toTitle(s);
		// Should preserve the emoji cluster and lowercase the rest
		expect(t.startsWith("👩‍👩‍👧‍👦")).toBe(true);
		expect(t.replace("👩‍👩‍👧‍👦", "")).toBe("abc");
	});
});
