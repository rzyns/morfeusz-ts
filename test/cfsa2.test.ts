import { describe, it, expect } from "vitest";
import { CFSA2 } from "../src/core/fsa/FSA.js";
import { MorphDeserializer } from "../src/core/deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";

function buildCFSA2Buffer(): DataView {
	// State 0 transitions list:
	//  [label='a'] [flags: ACCEPTING|LAST, offset=0] [payload: len=2, 0x11,0x22]
	const buf = new ArrayBuffer(1 + 1 + 2 + 2);
	const view = new DataView(buf);
	let off = 0;
	view.setUint8(off++, "a".charCodeAt(0));
	// flags: 0x40 (ACCEPTING) | 0x20 (LAST) | offset low 5 bits (0)
	view.setUint8(off++, 0x60);
	// payload length 2 at targetPtr
	view.setUint16(off, 2, false);
	off += 2;
	view.setUint8(off++, 0x11);
	view.setUint8(off++, 0x22);
	return view;
}

describe("CFSA2", () => {
	it("recognizes a transition using flags and varint offset", () => {
		const view = buildCFSA2Buffer();
		const fsa = new CFSA2<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "a".charCodeAt(0));
		expect(s.isAccepting()).toBe(true);
		const reader = s.getValue();
		expect(reader.getNext().type).toBe(0x11);
		expect(reader.getNext().type).toBe(0x22);
		expect(reader.hasNext()).toBe(false);
	});

	it("sinks when label not found and last flag set", () => {
		const view = buildCFSA2Buffer();
		const fsa = new CFSA2<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "b".charCodeAt(0));
		expect(s.isSink()).toBe(true);
	});
});
