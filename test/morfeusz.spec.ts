/**,
    dir: 'tests',
 * Vitest-based tests for morfeusz-ts bindings (TypeScript)
 */
import { describe } from 'vitest';
import MorfeuszFactory, { WhitespaceHandling, MorphUtils } from '../src/index.js';

describe('MorfeuszFactory static info', (test) => {
  test('provides version metadata', ({ expect }) => {
    const version = MorfeuszFactory.getVersion();
    const copyright = MorfeuszFactory.getCopyright();
    const dictName = MorfeuszFactory.getDefaultDictName();
    expect(version.length).toBeGreaterThan(0);
    expect(copyright.length).toBeGreaterThan(0);
    expect(dictName.length).toBeGreaterThan(0);
  });
});

describe('Morfeusz instance', (test) => {
  const morfeusz = MorfeuszFactory.createInstance();

  test('creates an instance', ({ expect }) => {
    expect(morfeusz).toBeTruthy();
  });

  test('configures whitespace handling', ({ expect }) => {
    morfeusz.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
    expect(morfeusz.getWhitespaceHandling()).toBe(WhitespaceHandling.KEEP_WHITESPACES);
  });

  test('exposes dictionary info', ({ expect }) => {
    expect(morfeusz.getDictID().length).toBeGreaterThan(0);
    expect(morfeusz.getDictCopyright().length).toBeGreaterThan(0);
  });

  test('analyses text and returns interpretations', ({ expect }) => {
    const results = morfeusz.analyse('test');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first).toHaveProperty('orth');
    expect(first).toHaveProperty('lemma');
    expect(first).toHaveProperty('tag');
    expect(first).toHaveProperty('startNode');
    expect(first).toHaveProperty('endNode');
  });

  test('generates forms for a lemma', ({ expect }) => {
    const forms = morfeusz.generate('test');
    expect(forms.length).toBeGreaterThan(0);
    expect(forms[0]).toHaveProperty('lemma');
  });

  test('uses IdResolver for counts and tag resolution', ({ expect }) => {
    const resolver = morfeusz.getIdResolver();
    expect(resolver.getTagsCount()).toBeGreaterThan(0);
    expect(resolver.getNamesCount()).toBeGreaterThan(0);
    expect(resolver.getLabelsCount()).toBeGreaterThan(0);
    const tagId = resolver.getTagId('ign');
    expect(typeof tagId).toBe('number');
    const tagStr = resolver.getTag(tagId);
    expect(tagStr.length).toBeGreaterThan(0);
  });

  test('applies MorphUtils predicates', ({ expect }) => {
    const results = morfeusz.analyse('a b');
    const hasWhitespace = results.some(r => MorphUtils.isWhitespace(r));
    expect(hasWhitespace).toBe(true);
  });
});
