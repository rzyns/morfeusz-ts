import { describe, it, expect } from "vitest";
import { CFSA1 } from "../src/core/fsa/FSA.js";
import { MorphDeserializer } from "../src/core/deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";

function buildCFSA1Buffer(): DataView {
	// Build mapping (257 bytes), then state0 with one transition on 'a' to accepting state with payload 0x11,0x22.
	const mappingLen = 257;
	const payload = [0x11, 0x22];
	const fsaBytes =
		mappingLen +
		1 /*state0 hdr*/ +
		1 /*trans first*/ +
		1 /*offset byte*/ +
		1 /*target hdr*/ +
		2 /*len*/ +
		payload.length;
	const buf = new ArrayBuffer(fsaBytes);
	const view = new DataView(buf);
	// mapping: all zeros, except 'a'(97)->1
	for (let i = 0; i < mappingLen; i++) view.setUint8(i, 0);
	view.setUint8(97, 1);
	let off = mappingLen;
	// state0 header: non-accepting, 1 transition
	view.setUint8(off, 0x01);
	off += 1;
	// transition: shortLabel=1, offsetSize=1 byte
	view.setUint8(off, (1 << 2) | 1);
	off += 1;
	// offset byte = 0 -> target starts immediately
	view.setUint8(off, 0x00);
	off += 1;
	// target state header: accepting, 0 transitions
	view.setUint8(off, 0x80);
	off += 1;
	// payload length (2)
	view.setUint16(off, payload.length, false);
	off += 2;
	// payload bytes
	view.setUint8(off, payload[0]);
	off += 1;
	view.setUint8(off, payload[1]);
	off += 1;
	return view;
}

describe("CFSA1", () => {
	it("recognizes a transition using short label and relative offset", () => {
		const view = buildCFSA1Buffer();
		const fsa = new CFSA1<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "a".charCodeAt(0));
		expect(s.isAccepting()).toBe(true);
		const reader = s.getValue();
		const g1 = reader.getNext();
		expect(g1.type).toBe(0x11);
		const g2 = reader.getNext();
		expect(g2.type).toBe(0x22);
		expect(reader.hasNext()).toBe(false);
	});

	it("falls into sink on missing transition", () => {
		const view = buildCFSA1Buffer();
		const fsa = new CFSA1<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "b".charCodeAt(0));
		expect(s.isSink()).toBe(true);
	});
});
