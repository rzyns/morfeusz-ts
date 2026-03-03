import { describe, it, expect } from "vitest";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../src/core/deserialization/InterpsGroupsDecoder.js";
import { CaseHandling } from "../src/core/types.js";

const CompressionFlags = {
	ORTH_ONLY_LOWER: 0x80,
	ORTH_ONLY_TITLE: 0x40,
	LEMMA_ONLY_LOWER: 0x20,
	LEMMA_ONLY_TITLE: 0x10,
	PREFIX_CUT_MASK: 0x0f
} as const;

function makeGroupBuffer(typeByte: number, contentBytes: number[]): DataView {
	const size = contentBytes.length;
	const arr = new Uint8Array(1 + 2 + size);
	arr[0] = typeByte & 0xff;
	arr[1] = (size >>> 8) & 0xff;
	arr[2] = size & 0xff;
	for (let i = 0; i < size; i++) arr[3 + i] = contentBytes[i] & 0xff;
	return new DataView(arr.buffer);
}

function cstr(s: string): number[] {
	return [...Buffer.from(s, "utf8"), 0];
}

// Content layout: [groupTypeByte:1][preLoopByte:1][interp...][interp...]...
// The preLoopByte (always 0x00) is consumed by processInterpsGroup before the interp loop.
function makeMinimalContent(type: number, tag: number) {
	const suffixToCut = 0;
	const name = 0;
	const labels = 0;
	// preLoopByte at content[1] only present when groupTypeByte=0x00 (bit7 and bit6 both clear)
	const hasPreLoopByte = (type & 0xc0) === 0;
	return [
		type & 0xff, // groupTypeByte (content[0])
		...(hasPreLoopByte ? [0x00] : []), // preLoopByte — only for 0x00-type groups
		// interp data starts here:
		suffixToCut & 0xff,
		...cstr(""),
		(tag >>> 8) & 0xff,
		tag & 0xff,
		name & 0xff,
		(labels >>> 8) & 0xff,
		labels & 0xff
	];
}

describe("orth-case filtering", () => {
	it("drops mismatched lowercase when STRICT", () => {
		const type = CompressionFlags.ORTH_ONLY_LOWER;
		const view = makeGroupBuffer(type, makeMinimalContent(type, 1));
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const dec = new InterpsGroupsDecoder();
		const res = dec.decode(
			"WORD",
			reader,
			{
				getTagsetId: () => "",
				getTag: () => "",
				getTagId: () => 0,
				getName: () => "",
				getNameId: () => 0,
				getLabelsAsString: () => "",
				getLabels: () => new Set<string>(),
				getLabelsId: () => 0,
				getTagsCount: () => 0,
				getNamesCount: () => 0,
				getLabelsCount: () => 0
			},
			CaseHandling.STRICTLY_CASE_SENSITIVE
		);
		// 0x80 group doesn't match "WORD" (STRICTLY + ORTH_ONLY_LOWER)
		expect(res[0].tagId).toBe(0);
		expect(res[0].orth).toBe("WORD");
	});

	it("keeps title-case only when STRICT", () => {
		const type = CompressionFlags.ORTH_ONLY_TITLE;
		const view = makeGroupBuffer(type, makeMinimalContent(type, 1));
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const dec = new InterpsGroupsDecoder();
		const ok = dec.decode(
			"Word",
			reader,
			{
				getTagsetId: () => "",
				getTag: () => "",
				getTagId: () => 0,
				getName: () => "",
				getNameId: () => 0,
				getLabelsAsString: () => "",
				getLabels: () => new Set<string>(),
				getLabelsId: () => 0,
				getTagsCount: () => 0,
				getNamesCount: () => 0,
				getLabelsCount: () => 0
			},
			CaseHandling.STRICTLY_CASE_SENSITIVE
		);
		expect(ok[0].tagId).toBe(1);

		const bad = dec.decode(
			"word",
			reader,
			{
				getTagsetId: () => "",
				getTag: () => "",
				getTagId: () => 0,
				getName: () => "",
				getNameId: () => 0,
				getLabelsAsString: () => "",
				getLabels: () => new Set<string>(),
				getLabelsId: () => 0,
				getTagsCount: () => 0,
				getNamesCount: () => 0,
				getLabelsCount: () => 0
			},
			CaseHandling.STRICTLY_CASE_SENSITIVE
		);
		expect(bad[0].tagId).toBe(0);
	});
});
