import { describe, it, expect } from 'vitest';
import { DictionariesRepository, MorfeuszProcessorType, parseFsaHeader, MAGIC_NUMBER } from '../src/index.js';

describe('FSA header parser', () => {
  it('parses header of real dict if present', async () => {
    const data = await DictionariesRepository.tryToLoadDictionary('sgjp', MorfeuszProcessorType.ANALYZER)
      || await DictionariesRepository.tryToLoadDictionary('polimorf', MorfeuszProcessorType.ANALYZER);
    if (!data) return; // skip if not present
    const view = new DataView(data.buffer);
    const hdr = parseFsaHeader(view);
    expect(hdr.magic >>> 0).toBe(MAGIC_NUMBER >>> 0);
    expect(hdr.fsaSize).toBeGreaterThan(0);
    expect(hdr.epilogueOffset).toBeGreaterThan(hdr.fsaSize);
  });
});
