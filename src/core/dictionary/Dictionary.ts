import type { Deserializer } from "../fsa/FSA.js";
import { MorphDeserializer } from "../deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../deserialization/InterpsGroupsReader.js";
import { parseFsaHeader, type FsaHeader } from "../fsa/header.js";

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
}
