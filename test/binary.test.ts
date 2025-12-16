import { describe, it, expect } from "vitest";
import { BinaryReaders } from "../src/index.js";

describe("Binary readers", () => {
	it("readInt8/16/24/32 big-endian", () => {
		const buf = new ArrayBuffer(12);
		const view = new DataView(buf);
		view.setUint8(0, 0x12);
		view.setUint16(1, 0x3456, false);
		view.setUint8(3, 0x78);
		view.setUint8(4, 0x9a);
		view.setUint8(5, 0xbc);
		view.setUint32(6, 0xdef01234, false);

		expect(BinaryReaders.readInt8(view, 0)).toBe(0x12);
		expect(BinaryReaders.readInt16(view, 1)).toBe(0x3456);
		expect(BinaryReaders.readInt24(view, 3)).toBe(0x789abc);
		expect(BinaryReaders.readInt32(view, 6)).toBe(0xdef01234);
	});

	it("readCString", () => {
		const bytes = new Uint8Array([0x41, 0x42, 0x43, 0x00, 0x44]);
		const view = new DataView(bytes.buffer);
		const { value, next } = BinaryReaders.readCString(view, 0);
		expect(value).toBe("ABC");
		expect(next).toBe(4);
	});
});
