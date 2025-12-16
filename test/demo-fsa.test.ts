import { describe, it, expect } from "vitest";
import {
	DemoStringFSA,
	MorphDeserializer,
	InterpsGroupsReader
} from "../src/index.js";

describe("DemoStringFSA", () => {
	it("recognizes strings and produces InterpsGroupsReader payload", () => {
		// word 'kot' with payload bytes [42]
		const entries = [{ word: "kot", payload: new Uint8Array([42]) }];
		const deser = new MorphDeserializer();
		const fsa = new DemoStringFSA<InterpsGroupsReader>(entries, deser);
		const state = fsa.getInitialState();
		const input = "kot";
		for (const ch of input) state.proceedToNext(fsa, ch.codePointAt(0)!);
		expect(state.isAccepting()).toBe(true);
		const reader = state.getValue();
		const types: number[] = [];
		while (reader.hasNext()) types.push(reader.getNext().type);
		expect(types).toEqual([42]);
	});
});
