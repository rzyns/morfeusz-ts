import type { Deserializer } from "../fsa/FSA.js";
import { MorphDeserializer } from "../deserialization/MorphDeserializer.js";
import { InterpsGroupsReader } from "../deserialization/InterpsGroupsReader.js";

export class Dictionary {
  readonly buffer: DataView;
  readonly deserializer: Deserializer<InterpsGroupsReader>;
  constructor(buf: ArrayBuffer) {
    this.buffer = new DataView(buf);
    this.deserializer = new MorphDeserializer();
  }
  // TODO: parse epilogue to fill id/copyright, separators and segrules maps
}
