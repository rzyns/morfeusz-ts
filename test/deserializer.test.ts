import { describe, it, expect } from "vitest";
import { MorphDeserializer, InterpsGroupsReader } from "../src/index.js";

describe("MorphDeserializer", () => {
	it("reads 16-bit size and updates reader", () => {
		// payload: size=3, bytes [10,20,30]
		const bytes = new Uint8Array([0x00, 0x03, 10, 20, 30]);
		const view = new DataView(bytes.buffer);
		const reader = new InterpsGroupsReader();
		const d = new MorphDeserializer();
		const consumed = d.deserialize(view, 0, reader);
		expect(consumed).toBe(5);
		const types: number[] = [];
		while (reader.hasNext()) types.push(reader.getNext().type);
		expect(types).toEqual([10, 20, 30]);
	});
});
