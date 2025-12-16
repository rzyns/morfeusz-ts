import { describe, it, expect } from "vitest";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../src/core/deserialization/InterpsGroupsDecoder.js";
import { CompressionFlags } from "../src/core/deserialization/compression.js";

const stubIds = {
	getTagsetId: () => "stub",
	getTag: (id: number) => `tag${id}`,
	getTagId: (t: string) => 0,
	getName: (_id: number) => "",
	getNameId: (_n: string) => 0,
	getLabelsAsString: (_id: number) => "",
	getLabels: (_id: number) => new Set<string>(),
	getLabelsId: (_s: string) => 0,
	getTagsCount: () => 0,
	getNamesCount: () => 0,
	getLabelsCount: () => 0
};

describe("InterpsGroupsDecoder (placeholder)", () => {
	it("decodes a single group with one interpretation (real format)", () => {
		// Build payload: [len(2)] [group: type+size + content]
		// type: ORTH_ONLY_LOWER | LEMMA_ONLY_LOWER, PREFIX_CUT=0
		const type =
			CompressionFlags.ORTH_ONLY_LOWER |
			CompressionFlags.LEMMA_ONLY_LOWER |
			0x00;
		// content: [suffixToCut=0][suffixToAdd='\0'][tag=0x0506][name=0x07][qual=0x0009]
		const groupContentLen = 1 + 1 + 2 + 1 + 2 + 1; // 8 (include qualifiers 2 bytes)
		const totalGroupsLen = 1 /*type*/ + 2 /*size*/ + groupContentLen; // 11
		const buf = new ArrayBuffer(2 + totalGroupsLen);
		const view = new DataView(buf);
		view.setUint16(0, totalGroupsLen, false);
		view.setUint8(2, type);
		view.setUint16(3, groupContentLen, false);
		let off = 5;
		view.setUint8(off++, 0); // suffixToCut
		view.setUint8(off++, 0); // suffixToAdd '\0'
		view.setUint16(off, 0x0506, false);
		off += 2; // tag
		view.setUint8(off++, 0x07); // nameClassifier
		view.setUint16(off, 0x0009, false);
		off += 2; // qualifiers
		const reader = new InterpsGroupsReader();
		reader.update(view, 2, totalGroupsLen);
		const dec = new InterpsGroupsDecoder();
		const res = dec.decode("ala", reader, stubIds as any);
		expect(res.length).toBeGreaterThan(0);
		expect(typeof res[0].tagId).toBe("number");
	});
});
