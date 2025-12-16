import { describe, it, expect } from 'vitest';
import { SimpleFSA } from '../src/index.js';
import { MorphDeserializer } from '../src/core/deserialization/MorphDeserializer.js';
import { InterpsGroupsReader } from '../src/core/deserialization/InterpsGroupsReader.js';

describe('FSA scaffold', () => {
  it('SimpleFSA initial state is not accepting by default', () => {
    const buf = new ArrayBuffer(1);
    const view = new DataView(buf);
    view.setUint8(0, 0x00); // no transitions, not accepting
    const fsa = new SimpleFSA<InterpsGroupsReader>(view, new MorphDeserializer(), () => new InterpsGroupsReader());
    const init = fsa.getInitialState();
    expect(init.isAccepting()).toBe(false);
  });
});
