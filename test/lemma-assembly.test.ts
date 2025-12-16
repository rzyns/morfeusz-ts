import { describe, it, expect } from "vitest";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../src/core/deserialization/InterpsGroupsDecoder.js";
import { CaseHandling } from "../src/core/types.js";

// Compression flags mirrored from src/core/deserialization/compression.ts
const CompressionFlags = {
	ORTH_ONLY_LOWER: 0x80,
	ORTH_ONLY_TITLE: 0x40,
	LEMMA_ONLY_LOWER: 0x20,
	LEMMA_ONLY_TITLE: 0x10,
	PREFIX_CUT_MASK: 0x0f
} as const;

function makeGroupBuffer(typeByte: number, contentBytes: number[]): DataView {
	// Layout: [type:1][size:2][content:size]
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

describe("lemma assembly", () => {
	it("uses compressed prefix nibble and lowercases lemma", () => {
		const orth = "abcd"; // cpLen=4
		// Group type byte: lemma lower + prefix cut = 1 (encoded in low nibble) + no explicit prefix byte
		const type = CompressionFlags.LEMMA_ONLY_LOWER | 0x01; // compressed prefix cut = 1
		// Content: [compression duplicate byte][suffixToCut:1][suffixToAdd:cstr][tag:u16][name:u8][labels:u16]
		const suffixToCut = 1; // cut last char 'd'
		const suffixToAdd = "ing"; // add "ing"
		const tag = 5;
		const name = 7;
		const labels = 9;
		const content = [
			type & 0xff,
			suffixToCut & 0xff,
			...cstr(suffixToAdd),
			(tag >>> 8) & 0xff,
			tag & 0xff,
			name & 0xff,
			(labels >>> 8) & 0xff,
			labels & 0xff
		];
		const view = makeGroupBuffer(type, content);
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const decoder = new InterpsGroupsDecoder();
		const res = decoder.decode(
			orth,
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
			CaseHandling.IGNORE_CASE
		);
		expect(res.length).toBeGreaterThan(0);
		const first = res[0];
		// prefixCut=1 => core = "bcd"; suffixCut=1 => core becomes "bc"; + "ing" => "bcing"; lower => "bcing"
		expect(first.lemma).toBe("bcing");
		expect(first.tagId).toBe(tag);
		expect(first.nameId).toBe(name);
		expect(first.labelsId).toBe(labels);
	});

	it("reads explicit prefix byte when mask=0x0f and applies title case", () => {
		const orth = "hello";
		// Use mask=0x0f to signal explicit prefix byte; and lemma title-case flag
		const type =
			CompressionFlags.LEMMA_ONLY_TITLE |
			CompressionFlags.PREFIX_CUT_MASK; // explicit prefix byte follows
		const explicitPrefixCut = 2; // cuts 'he'
		const suffixToCut = 0;
		const suffixToAdd = "o"; // lemma core "llo" + "o" => "lloo" -> title => "Lloo"
		const tag = 12;
		const name = 3;
		const labels = 77;
		const content = [
			type & 0xff,
			explicitPrefixCut & 0xff,
			suffixToCut & 0xff,
			...cstr(suffixToAdd),
			(tag >>> 8) & 0xff,
			tag & 0xff,
			name & 0xff,
			(labels >>> 8) & 0xff,
			labels & 0xff
		];
		const view = makeGroupBuffer(type, content);
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const decoder = new InterpsGroupsDecoder();
		const res = decoder.decode(
			orth,
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
			CaseHandling.IGNORE_CASE
		);
		expect(res.length).toBeGreaterThan(0);
		const first = res[0];
		expect(first.lemma).toBe("Lloo");
		expect(first.tagId).toBe(tag);
		expect(first.nameId).toBe(name);
		expect(first.labelsId).toBe(labels);
	});
});
