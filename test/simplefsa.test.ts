import { describe, it, expect } from "vitest";
import { SimpleFSA } from "../src/core/fsa/FSA.js";
import { MorphDeserializer } from "../src/core/deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";

function buildSimpleFsaBuffer(): DataView {
	// Layout:
	// state0 @0: [stateData=0x01 (1 transition)] [label='a'] [offset(3)=0x000005]
	// state1 @5: [stateData=0x80 (accepting, 0 transitions implied by mask)] [size(2)=0x0003] [payload=0x11,0x22,0x33]
	const buf = new ArrayBuffer(11);
	const view = new DataView(buf);
	view.setUint8(0, 0x01);
	view.setUint8(1, "a".charCodeAt(0));
	view.setUint8(2, 0x00);
	view.setUint8(3, 0x00);
	view.setUint8(4, 0x05);
	view.setUint8(5, 0x80);
	view.setUint16(6, 3, false);
	view.setUint8(8, 0x11);
	view.setUint8(9, 0x22);
	view.setUint8(10, 0x33);
	return view;
}

describe("SimpleFSA", () => {
	it("recognizes a single transition and attaches payload", () => {
		const view = buildSimpleFsaBuffer();
		const fsa = new SimpleFSA<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		expect(s.isAccepting()).toBe(false);
		s.proceedToNext(fsa, "a".charCodeAt(0));
		expect(s.isAccepting()).toBe(true);
		const reader = s.getValue();
		expect(reader.hasNext()).toBe(true);
		const g1 = reader.getNext();
		expect(g1.type).toBe(0x11);
		const g2 = reader.getNext();
		expect(g2.type).toBe(0x22);
		const g3 = reader.getNext();
		expect(g3.type).toBe(0x33);
		expect(reader.hasNext()).toBe(false);
		expect(s.getValueSize()).toBe(5); // 2 bytes length + 3 payload bytes
	});

	it("goes to sink when transition not found", () => {
		const view = buildSimpleFsaBuffer();
		const fsa = new SimpleFSA<InterpsGroupsReader>(
			view,
			new MorphDeserializer(),
			() => new InterpsGroupsReader()
		);
		const s = fsa.getInitialState();
		s.proceedToNext(fsa, "b".charCodeAt(0));
		expect(s.isSink()).toBe(true);
	});
});
