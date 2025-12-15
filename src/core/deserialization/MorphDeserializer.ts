import type { Deserializer } from "../fsa/FSA.js";
import { readInt16 } from "../binary/readers.js";
import { InterpsGroupsReader } from "./InterpsGroupsReader.js";

/**
 * TS port of MorphDeserializer: reads a 16-bit length and updates the reader with that slice.
 */
export class MorphDeserializer implements Deserializer<InterpsGroupsReader> {
  deserialize(view: DataView, offset: number, out: InterpsGroupsReader): number {
    const size = readInt16(view, offset);
    const start = offset + 2;
    out.update(view, start, size);
    return size + 2;
  }
}
