import { describe, it, expect } from 'vitest';
import { MorfeuszImpl } from '../src/morfeusz/MorfeuszImpl.js';
import { DictionariesRepository } from '../src/core/dictionary/DictionariesRepository.js';
import { MorfeuszUsage } from '../src/core/types.js';
import { MorfeuszProcessorType } from '../src/core/dictionary/const.js';
import { parseFsaHeader } from '../src/core/fsa/header.js';
import { Dictionary } from '../src/core/dictionary/Dictionary.js';

// This test will run only if a real dictionary is present in morfeusz2/dict.
// It verifies that MorfeuszImpl uses the FSA to recognize at least one simple token.

describe('MorfeuszImpl + real dictionary (optional)', () => {
  it('recognizes a common word when dictionary present', async () => {
    const found = await DictionariesRepository.tryToLoadDictionary('sgjp', MorfeuszProcessorType.ANALYZER);
    if (!found) {
      // Skip: environment has no real dictionary files
      return;
    }
    // Skip if dictionary impl is not SimpleFSA (impl=0)
    const dict = new Dictionary(found.buffer);
    if (dict.header.impl !== 0) {
      return;
    }
    const m = new MorfeuszImpl('sgjp', MorfeuszUsage.ANALYSE_ONLY);
    await m.load();
    const res = m.analyseToArray('w'); // Polish preposition 'w'
    // Should return at least one interpretation; when recognized, tagId != 0 (not ign)
    expect(res.length).toBe(1);
    expect(res[0].orth).toBe('w');
    expect(res[0].tagId).not.toBe(0);
  });
});
