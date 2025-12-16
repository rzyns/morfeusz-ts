import { describe, it, expect } from "vitest";
import { Dictionary } from "../src/core/dictionary/Dictionary.js";
import {
	MAGIC_NUMBER,
	VERSION_NUM_OFFSET,
	IMPLEMENTATION_NUM_OFFSET,
	FSA_DATA_SIZE_OFFSET,
	FSA_DATA_OFFSET
} from "../src/core/fsa/const.js";
import { MorphDeserializer } from "../src/core/deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";

function buildHeaderWithSimpleFSA(): ArrayBuffer {
	// Build a full dict buffer: header + simple FSA payload
	// Simple FSA from simplefsa.test: 11 bytes
	const fsaSize = 11;
	const total = FSA_DATA_OFFSET + fsaSize;
	const buf = new ArrayBuffer(total);
	const view = new DataView(buf);
	view.setUint32(0, MAGIC_NUMBER, false);
	view.setUint8(VERSION_NUM_OFFSET, 1);
	view.setUint8(IMPLEMENTATION_NUM_OFFSET, 0); // SimpleFSA
	view.setUint32(FSA_DATA_SIZE_OFFSET, fsaSize, false);
	// Write FSA bytes starting at FSA_DATA_OFFSET
	let off = FSA_DATA_OFFSET;
	view.setUint8(off + 0, 0x01); // 1 transition
	view.setUint8(off + 1, "x".charCodeAt(0));
	view.setUint8(off + 2, 0x00);
	view.setUint8(off + 3, 0x00);
	view.setUint8(off + 4, off + 5 - FSA_DATA_OFFSET); // offset within fsaDataView -> 5
	view.setUint8(off + 5, 0x80); // accepting
	view.setUint16(off + 6, 3, false);
	view.setUint8(off + 8, 0xaa);
	view.setUint8(off + 9, 0xbb);
	view.setUint8(off + 10, 0xcc);
	return buf;
}

function buildHeaderWithCFSA1(): ArrayBuffer {
	// CFSA1 buffer from cfsa1.test builder
	const mappingLen = 257;
	const payloadLen = 2;
	const fsaSize = mappingLen + 1 + 1 + 1 + 1 + 2 + payloadLen;
	const total = FSA_DATA_OFFSET + fsaSize;
	const buf = new ArrayBuffer(total);
	const view = new DataView(buf);
	view.setUint32(0, MAGIC_NUMBER, false);
	view.setUint8(VERSION_NUM_OFFSET, 1);
	view.setUint8(IMPLEMENTATION_NUM_OFFSET, 1); // CFSA1
	view.setUint32(FSA_DATA_SIZE_OFFSET, fsaSize, false);
	let off = FSA_DATA_OFFSET;
	// mapping
	for (let i = 0; i < mappingLen; i++) view.setUint8(off + i, 0);
	view.setUint8(off + 97, 1);
	off += mappingLen;
	// state0 hdr
	view.setUint8(off, 0x01);
	off += 1;
	// transition first byte (short=1, offsSize=1)
	view.setUint8(off, (1 << 2) | 1);
	off += 1;
	// offset 0
	view.setUint8(off, 0x00);
	off += 1;
	// target hdr (accepting)
	view.setUint8(off, 0x80);
	off += 1;
	// payload length 2
	view.setUint16(off, 2, false);
	off += 2;
	// payload bytes
	view.setUint8(off, 0xaa);
	off += 1;
	view.setUint8(off, 0xbb);
	off += 1;
	return buf;
}

function buildHeaderWithCFSA2(): ArrayBuffer {
	// Build a minimal CFSA2: [label 'z'][flags accept|last offset=0][len=2][0xaa,0xbb]
	const fsaSize = 1 + 1 + 2 + 2;
	const total = FSA_DATA_OFFSET + fsaSize;
	const buf = new ArrayBuffer(total);
	const view = new DataView(buf);
	view.setUint32(0, MAGIC_NUMBER, false);
	view.setUint8(VERSION_NUM_OFFSET, 1);
	view.setUint8(IMPLEMENTATION_NUM_OFFSET, 2); // CFSA2
	view.setUint32(FSA_DATA_SIZE_OFFSET, fsaSize, false);
	const off = FSA_DATA_OFFSET;
	view.setUint8(off + 0, "z".charCodeAt(0));
	view.setUint8(off + 1, 0x60); // accept|last, offset=0
	view.setUint16(off + 2, 2, false);
	view.setUint8(off + 4, 0xaa);
	view.setUint8(off + 5, 0xbb);
	return buf;
}

function buildHeaderWithImpl(impl: number, fsaBytes: number): ArrayBuffer {
	const total = FSA_DATA_OFFSET + fsaBytes;
	const buf = new ArrayBuffer(total);
	const view = new DataView(buf);
	view.setUint32(0, MAGIC_NUMBER, false);
	view.setUint8(VERSION_NUM_OFFSET, 1);
	view.setUint8(IMPLEMENTATION_NUM_OFFSET, impl);
	view.setUint32(FSA_DATA_SIZE_OFFSET, fsaBytes, false);
	return buf;
}

describe("Dictionary FSA factory", () => {
	it("creates SimpleFSA for impl=0 and recognizes", () => {
		const dict = new Dictionary(buildHeaderWithSimpleFSA());
		const fsa = dict.createFSA(
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "x".charCodeAt(0));
		expect(s.isAccepting()).toBe(true);
		const reader = s.getValue();
		expect(reader.getNext().type).toBe(0xaa);
		expect(reader.getNext().type).toBe(0xbb);
		expect(reader.getNext().type).toBe(0xcc);
	});

	it("CFSA1 and CFSA2 are supported in factory", () => {
		const dict1 = new Dictionary(buildHeaderWithCFSA1());
		const fsa1 = dict1.createFSA(
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s1 = fsa1.getInitialState();
		s1.proceedToNext(fsa1, "a".charCodeAt(0));
		expect(s1.isAccepting()).toBe(true);
		const dict2 = new Dictionary(buildHeaderWithCFSA2());
		const fsa2 = dict2.createFSA(
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s2 = fsa2.getInitialState();
		s2.proceedToNext(fsa2, "z".charCodeAt(0));
		expect(s2.isAccepting()).toBe(true);
	});
});
