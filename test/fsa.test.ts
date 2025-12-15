import { describe, it, expect } from 'vitest';
import { SimpleFSA, SimpleState } from '../src/index.js';

describe('FSA scaffold', () => {
  it('SimpleFSA returns initial state', () => {
    const s = new SimpleState<string>();
    s.setAccepting('ok', 2);
    const fsa = new SimpleFSA<string>(s);
    const init = fsa.getInitialState();
    expect(init.isAccepting()).toBe(true);
    expect(init.getValue()).toBe('ok');
    expect(init.getValueSize()).toBe(2);
  });
});
