import { describe, it, expect } from 'vitest';
import {
  UTF8CharsetConverter,
  OneByteCharsetConverter,
  getCharsetConverter,
} from '../src/index.js';
import { Charset } from '../src/index.js';

describe('Charset converters', () => {
  it('UTF8 next/append roundtrips', () => {
    const conv = UTF8CharsetConverter.instance;
    const s = 'Zażółć gęślą jaźń 😀';
    const it = { s, i: 0 };
    const out: string[] = [];
    for (;;) {
      const cp = conv.next(it);
      if (cp == null) break;
      conv.append(cp, out);
    }
    expect(out.join('')).toBe(s);
  });

  it('OneByte converter passes ASCII through', () => {
    const asciiTable = new Array<number>(256).fill(0xfffd);
    for (let i = 0; i < 256; i++) asciiTable[i] = i; // identity for test
    const conv = new OneByteCharsetConverter(asciiTable);
    const s = 'ABC xyz 123';
    const it = { s, i: 0 };
    const out: string[] = [];
    for (;;) {
      const cp = conv.next(it);
      if (cp == null) break;
      conv.append(cp, out);
    }
    expect(out.join('')).toBe(s);
  });

  it('getCharsetConverter returns correct instances', () => {
    expect(getCharsetConverter(Charset.UTF8)).toBe(UTF8CharsetConverter.instance);
  });
});
