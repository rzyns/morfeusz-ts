import type { Deserializer } from "../fsa/FSA.js";
import type { FSA } from "../fsa/FSA.js";
import { MorphDeserializer } from "../deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../deserialization/InterpsGroupsReader.js";
import { parseFsaHeader, type FsaHeader } from "../fsa/header.js";
import { SimpleFSA, CFSA1, CFSA2 } from "../fsa/FSA.js";

export class Dictionary {
	readonly buffer: DataView;
	readonly deserializer: Deserializer<InterpsGroupsReader>;
	readonly header: FsaHeader;
	constructor(buf: ArrayBuffer) {
		this.buffer = new DataView(buf);
		this.deserializer = new MorphDeserializer();
		this.header = parseFsaHeader(this.buffer);
	}
	// TODO: parse epilogue to fill id/copyright, separators and segrules maps

	createFSA<T>(deserializer: Deserializer<T>, outFactory: () => T): FSA<T> {
		switch (this.header.impl) {
			case 0:
				return new SimpleFSA<T>(
					this.header.fsaDataView,
					deserializer,
					outFactory
				);
			case 1:
				return new CFSA1<T>(
					this.header.fsaDataView,
					deserializer,
					outFactory
				);
			case 2:
				return new CFSA2<T>(
					this.header.fsaDataView,
					deserializer,
					outFactory
				);
			default:
				throw new Error(`Unknown FSA impl: ${this.header.impl}`);
		}
	}
}
