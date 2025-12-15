import { describe, it, expect } from 'vitest';
import {
  MorfeuszImpl,
  MorfeuszUsage,
  MorphInterpretationHelpers as MI,
  WhitespaceHandling,
} from '../src/index.js';

describe('MorfeuszImpl (scaffold)', () => {
  it('analyse() yields ign per word, skipping whitespaces by default', () => {
    const m = new MorfeuszImpl('default', MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE);
    const it = m.analyse('Ala  ma\t\npsa');

    const out = [] as ReturnType<typeof MI.createIgn>[];
    while (it.hasNext()) out.push(it.next());

    expect(out.map(o => o.orth)).toEqual(['Ala', 'ma', 'psa']);
    expect(out.map(o => [o.startNode, o.endNode])).toEqual([[0,1],[1,2],[2,3]]);
  });

  it('analyse() can KEEP whitespaces as separate tokens', () => {
    const m = new MorfeuszImpl('default', MorfeuszUsage.ANALYSE_ONLY);
    m.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
    const it = m.analyse(' A  B ');

    const out = [] as ReturnType<typeof MI.createIgn>[];
    while (it.hasNext()) out.push(it.next());

    // Expect: sp, A, sp(2 chars), B, sp
    expect(out.map(o => o.orth)).toEqual([' ', 'A', '  ', 'B', ' ']);
    // Monotonic nodes starting from 0
    expect(out.map(o => [o.startNode, o.endNode])).toEqual([[0,1],[1,2],[2,3],[3,4],[4,5]]);
  });

  it('generate() returns single ign for lemma without dictionary', () => {
    const m = new MorfeuszImpl('default', MorfeuszUsage.GENERATE_ONLY);
    const res = m.generate('kot');
    expect(res).toHaveLength(1);
    expect(res[0].orth).toBe('kot');
    expect(res[0].lemma).toBe('kot');
  });

  it('generateWithTag() filters by tagId (stub)', () => {
    const m = new MorfeuszImpl('default', MorfeuszUsage.GENERATE_ONLY);
    expect(m.generateWithTag('kot', 0)).toHaveLength(1);
    expect(m.generateWithTag('kot', 1)).toHaveLength(0);
  });
});
