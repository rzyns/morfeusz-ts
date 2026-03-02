import { describe, it, expect } from "vitest";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../src/core/deserialization/InterpsGroupsDecoder.js";
import { CaseHandling } from "../src/core/types.js";

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

const MOCK_IDS = {
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
};

describe("lemma assembly", () => {
	it("applies suffix cut and appends suffix (groupTypeByte=0xa0, no case patterns)", () => {
		// groupTypeByte=0xa0: bit7=1 (no orth case), bit5=1 (no lemma case)
		// Content layout: [groupTypeByte:1][preLoopByte=0x00:1][suffixToCut:1][suffixToAdd:cstr][tagId:u16be][nameId:u8][labelsId:u16be]
		const orth = "abcde";
		const groupTypeByte = 0xa0;
		const suffixToCut = 2;
		const suffixToAdd = "ing";
		const tag = 5;
		const name = 7;
		const labels = 9;
		const content = [
			groupTypeByte,
			suffixToCut,
			...cstr(suffixToAdd),
			(tag >>> 8) & 0xff, tag & 0xff,
			name,
			(labels >>> 8) & 0xff, labels & 0xff
		];
		const view = makeGroupBuffer(groupTypeByte, content);
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const decoder = new InterpsGroupsDecoder();
		const res = decoder.decode(orth, reader, MOCK_IDS, CaseHandling.IGNORE_CASE);
		expect(res.length).toBeGreaterThan(0);
		const first = res[0];
		expect(first.lemma).toBe("abcing");
		expect(first.tagId).toBe(tag);
		expect(first.nameId).toBe(name);
		expect(first.labelsId).toBe(labels);
	});

	it("reads explicit field0 byte when nibble==0xf (0xaf groupTypeByte)", () => {
		// groupTypeByte=0xaf: bit7=1 (no orth case), bit5=1 (no lemma case), nibble=0xf (read field0)
		// Content: [groupTypeByte:1][field0:1 (explicit, nibble=0xf)][suffixToCut:1][suffixToAdd:cstr][tagId:u16be][nameId:u8][labelsId:u16be]
		const orth = "hello";
		const groupTypeByte = 0xaf;
		const field0 = 0x00; // explicit field0 byte (nibble=0xf), prefixToCut=0
		const suffixToCut = 0;
		const suffixToAdd = "o";
		const tag = 12;
		const name = 3;
		const labels = 77;
		const content = [
			groupTypeByte,
			field0,
			suffixToCut,
			...cstr(suffixToAdd),
			(tag >>> 8) & 0xff, tag & 0xff,
			name,
			(labels >>> 8) & 0xff, labels & 0xff
		];
		const view = makeGroupBuffer(groupTypeByte, content);
		const reader = new InterpsGroupsReader();
		reader.update(view, 0, view.byteLength);
		const decoder = new InterpsGroupsDecoder();
		const res = decoder.decode(orth, reader, MOCK_IDS, CaseHandling.IGNORE_CASE);
		expect(res.length).toBeGreaterThan(0);
		const first = res[0];
		expect(first.lemma).toBe("helloo");
		expect(first.tagId).toBe(tag);
		expect(first.nameId).toBe(name);
		expect(first.labelsId).toBe(labels);
	});
});
